from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
import shutil
import os
import time
import pydicom
import numpy as np
import models
from database import engine
import models
from fastapi import HTTPException
from passlib.hash import bcrypt
from pydantic import BaseModel
import datetime
from database import Base, engine, SessionLocal
from predict_resnet_multiview import predict_birads_per_view
from database import Base, engine, SessionLocal


from PIL import Image
from predict_resnet_multiview import predict_birads_per_view

app = FastAPI()

Base.metadata.create_all(bind=engine)
# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_views")
os.makedirs(TEMP_DIR, exist_ok=True)

app.mount("/images", StaticFiles(directory=TEMP_DIR), name="images")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def guardar_y_convertir_a_rgb(upload_file: UploadFile, nombre_archivo: str) -> str:
    import cv2

    extension = upload_file.filename.split('.')[-1].lower()
    timestamp = str(int(time.time() * 1000))
    nombre_final = f"{nombre_archivo}_{timestamp}.png"
    destino = os.path.join(TEMP_DIR, nombre_final)
    temp_path = os.path.join(TEMP_DIR, f"temp_{nombre_archivo}")

    # Guardar archivo temporal
    with open(temp_path, "wb") as temp:
        shutil.copyfileobj(upload_file.file, temp)

    # Tratar .dicom igual que .dcm
    if extension == "dicom":
        extension = "dcm"

    if extension == "dcm":
        try:
            ds = pydicom.dcmread(temp_path, force=True)
            arr = ds.pixel_array.astype(np.float32)

            # Invertir si MONOCHROME1
            if ds.get('PhotometricInterpretation') == "MONOCHROME1":
                arr = np.max(arr) - arr

            # Normalizar y convertir a uint8
            arr = cv2.normalize(arr, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

            # Aplicar CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            arr = clahe.apply(arr)

            # Aplicar gamma correction si la imagen es muy brillante
            mean_val = np.mean(arr)
            if mean_val > 200:
                gamma = 0.6
                look_up = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype("uint8")
                arr = cv2.LUT(arr, look_up)

            # Recorte automático mejorado
            blurred = cv2.GaussianBlur(arr, (5, 5), 0)
            _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((20, 20), np.uint8))
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                tissue_mask = np.zeros_like(binary)
                largest_contour = max(contours, key=cv2.contourArea)
                cv2.drawContours(tissue_mask, [largest_contour], -1, 255, -1)
                coords = np.column_stack(np.where(tissue_mask > 0))
                y0, x0 = coords.min(axis=0)
                y1, x1 = coords.max(axis=0)

                h, w = arr.shape
                pad = 10
                y0 = max(0, y0 - pad)
                y1 = min(h, y1 + pad)
                x0 = max(0, x0 - pad)
                x1 = min(w, x1 + pad)

                cropped = arr[y0:y1, x0:x1]

                min_width = 224
                orig_width = arr.shape[1]
                cropped_ratio = cropped.shape[1] / orig_width

                if cropped_ratio < 0.4:
                    print("⚠️ Recorte rechazado: tejido demasiado estrecho. Intentando centrar región.")
                    x_center = (x0 + x1) // 2
                    crop_width = max(int(0.5 * orig_width), min_width)
                    x0 = max(0, x_center - crop_width // 2)
                    x1 = min(orig_width, x_center + crop_width // 2)
                    arr = arr[y0:y1, x0:x1]
                elif cropped.shape[1] < min_width:
                    pad_width = max(min_width, int(0.6 * orig_width))
                    padded = np.zeros((cropped.shape[0], pad_width), dtype=np.uint8)
                    offset = (pad_width - cropped.shape[1]) // 2
                    padded[:, offset:offset + cropped.shape[1]] = cropped
                    arr = padded
                else:
                    arr = cropped

            im = Image.fromarray(arr).convert("RGB")
            if im.width < 224 or im.height < 224:
                # Redimensionar conservando aspecto si es menor a 224
                scale = 224 / min(im.width, im.height)
                new_size = (int(im.width * scale), int(im.height * scale))
                im = im.resize(new_size, Image.LANCZOS)
            im.save(destino)
        except Exception as e:
            raise ValueError("No se pudo procesar el archivo DICOM. Verifique su integridad.")
    else:
        try:
            with open(temp_path, "rb") as f:
                img_check = Image.open(f)
                img_check.load()
            im = Image.open(temp_path).convert("RGB")
            if im.width < 224 or im.height < 224:
                # Redimensionar conservando aspecto si es menor a 224
                scale = 224 / min(im.width, im.height)
                new_size = (int(im.width * scale), int(im.height * scale))
                im = im.resize(new_size, Image.LANCZOS)
            im.save(destino)
        except Exception:
            raise ValueError("Archivo de imagen no válido o corrupto.")

    os.remove(temp_path)
    return destino

@app.post("/predict")
async def predict(
    l_cc: UploadFile = File(None),
    r_cc: UploadFile = File(None),
    l_mlo: UploadFile = File(None),
    r_mlo: UploadFile = File(None)
):
    for f in os.listdir(TEMP_DIR):
        os.remove(os.path.join(TEMP_DIR, f))

    files = {
        "L-CC": l_cc,
        "R-CC": r_cc,
        "L-MLO": l_mlo,
        "R-MLO": r_mlo
    }

    image_paths = {}
    for view, upload_file in files.items():
        if upload_file is not None:
            path = guardar_y_convertir_a_rgb(upload_file, view)
            image_paths[view] = path

    if not image_paths:
        return JSONResponse(content={"error": "No se recibió ninguna imagen válida."}, status_code=400)

    results = predict_birads_per_view(image_paths)

    for view, path in image_paths.items():
        filename = os.path.basename(path)
        results[view]["image_url"] = f"http://127.0.0.1:8000/images/{filename}"

    return JSONResponse(content=results)

class UsuarioCreate(BaseModel):
    nombre: str
    documento: str
    fecha_nacimiento: datetime.date
    rol: str
    password: str

@app.post("/register")
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter_by(documento=usuario.documento).first()
    if existe:
        raise HTTPException(status_code=400, detail="El documento ya está registrado")

    hashed_pw = bcrypt.hash(usuario.password)

    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        documento=usuario.documento,
        fecha_nacimiento=usuario.fecha_nacimiento,
        rol=usuario.rol,
        password_hash=hashed_pw
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return {"msg": "Usuario registrado con éxito", "id": nuevo_usuario.id}