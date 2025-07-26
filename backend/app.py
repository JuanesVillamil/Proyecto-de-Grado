from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os
import time
import pydicom
import numpy as np
from PIL import Image

from predict_resnet_multiview import predict_birads_per_view

app = FastAPI()

# Middleware CORS correctamente aplicado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta absoluta relativa al script para archivos temporales
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_views")
os.makedirs(TEMP_DIR, exist_ok=True)

# Montar como recurso estático
app.mount("/images", StaticFiles(directory=TEMP_DIR), name="images")

def guardar_y_convertir_a_rgb(upload_file: UploadFile, nombre_archivo: str) -> str:
    extension = upload_file.filename.split('.')[-1].lower()
    timestamp = str(int(time.time() * 1000))
    nombre_final = f"{nombre_archivo}_{timestamp}.jpg"
    destino = os.path.join(TEMP_DIR, nombre_final)
    temp_path = os.path.join(TEMP_DIR, f"temp_{nombre_archivo}")

    with open(temp_path, "wb") as temp:
        shutil.copyfileobj(upload_file.file, temp)

    if extension == "dcm":
        ds = pydicom.dcmread(temp_path)
        arr = ds.pixel_array
        if len(arr.shape) == 2:
            arr = (arr / np.max(arr) * 255).astype(np.uint8)
            im = Image.fromarray(arr).convert("RGB")
        else:
            raise Exception("DICOM con más de 1 canal no es compatible")
        im.save(destino)
    else:
        im = Image.open(temp_path).convert("RGB")
        im.save(destino)

    os.remove(temp_path)
    return destino

@app.post("/predict")
async def predict(
    l_cc: UploadFile = File(None),
    r_cc: UploadFile = File(None),
    l_mlo: UploadFile = File(None),
    r_mlo: UploadFile = File(None)
):
    # Limpiar archivos anteriores
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