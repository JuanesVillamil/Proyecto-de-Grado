from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
import config_railway  # Usar configuración de Railway
from database import Base, engine, SessionLocal
from models import Usuario, Reporte
from starlette.responses import Response
from fastapi import FastAPI, HTTPException
from auth import create_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth import verify_token
from passlib.hash import bcrypt
import json
import datetime
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
from PIL import Image

app = FastAPI(title="BI-RADS API", description="API para clasificación BI-RADS de mamografías")

# Crear tablas automáticamente
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de base de datos creadas/verificadas exitosamente")
except Exception as e:
    print(f"⚠️ Advertencia creando tablas: {e}")

print("✅ Backend iniciado - Railway PostgreSQL")

# Middleware CORS optimizado para Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=config_railway.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_views")
os.makedirs(TEMP_DIR, exist_ok=True)

# Montar archivos estáticos solo si existe el directorio
try:
    app.mount("/images", StaticFiles(directory=TEMP_DIR), name="images")
except Exception as e:
    print(f"⚠️ No se pudo montar directorio de imágenes: {e}")

# Endpoint de salud optimizado para Railway
@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "message": "Backend funcionando en Railway",
        "database": "connected" if engine else "disconnected"
    }

@app.get("/")
def root():
    return {
        "message": "API de BI-RADS funcionando en Railway", 
        "docs": "/docs",
        "health": "/health"
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# [AQUÍ VA EL RESTO DEL CÓDIGO DE app.py - COPIAMOS TODAS LAS FUNCIONES]

# Función para procesar imágenes optimizada
def guardar_y_convertir_a_rgb(upload_file: UploadFile, nombre_archivo: str) -> str:
    import cv2

    # Normalizar extensión
    extension = upload_file.filename.split('.')[-1].lower()
    if extension == "dicom":
        extension = "dcm"
    elif extension in ["tif", "tiff"]:
        extension = "tif"

    # Nombre final con timestamp
    timestamp = str(int(time.time() * 1000))
    nombre_final = f"{nombre_archivo}_{timestamp}.png"
    destino = os.path.join(TEMP_DIR, nombre_final)
    temp_path = os.path.join(TEMP_DIR, f"temp_{nombre_archivo}")

    # Guardar archivo temporal
    with open(temp_path, "wb") as temp:
        shutil.copyfileobj(upload_file.file, temp)

    # Procesamiento de DICOM
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

            # Recorte automático (código simplificado para Railway)
            im = Image.fromarray(arr).convert("RGB")

            # Redimensionar si <224
            if im.width < 224 or im.height < 224:
                scale = 224 / min(im.width, im.height)
                new_size = (int(im.width * scale), int(im.height * scale))
                im = im.resize(new_size, Image.LANCZOS)

            im.save(destino)

        except Exception as e:
            raise ValueError("No se pudo procesar el archivo DICOM. Verifique su integridad.")

    # Procesamiento de imágenes estándar
    else:
        try:
            im = Image.open(temp_path).convert("RGB")

            # Redimensionar si <224
            if im.width < 224 or im.height < 224:
                scale = 224 / min(im.width, im.height)
                new_size = (int(im.width * scale), int(im.height * scale))
                im = im.resize(new_size, Image.LANCZOS)

            im.save(destino)

        except Exception:
            raise ValueError("Archivo de imagen no válido o corrupto.")

    # Eliminar archivo temporal
    os.remove(temp_path)
    return destino

# Predicción simplificada para Railway (sin PyTorch por ahora)
@app.post("/predict")
async def predict(
    l_cc: UploadFile = File(None),
    r_cc: UploadFile = File(None),
    l_mlo: UploadFile = File(None),
    r_mlo: UploadFile = File(None),
    usuario_id: int = None,
    nombre_paciente: str = None
):
    # Limpiar directorio temporal
    for f in os.listdir(TEMP_DIR):
        try:
            os.remove(os.path.join(TEMP_DIR, f))
        except:
            pass

    files = {
        "L-CC": l_cc,
        "R-CC": r_cc,
        "L-MLO": l_mlo,
        "R-MLO": r_mlo
    }

    image_paths = {}
    for view, upload_file in files.items():
        if upload_file is not None:
            try:
                path = guardar_y_convertir_a_rgb(upload_file, view)
                image_paths[view] = path
            except Exception as e:
                return JSONResponse(
                    content={"error": f"Error procesando {view}: {str(e)}"}, 
                    status_code=400
                )

    if not image_paths:
        return JSONResponse(
            content={"error": "No se recibió ninguna imagen válida."}, 
            status_code=400
        )

    # Generar resultados simulados para Railway
    results = {}
    import random
    
    birads_counts = {}
    for view, path in image_paths.items():
        filename = os.path.basename(path)
        
        # Simular clasificación BI-RADS
        birads_simulado = random.randint(1, 5)
        confidence_simulado = round(random.uniform(75.0, 95.0), 2)
        
        birads_counts[birads_simulado] = birads_counts.get(birads_simulado, 0) + 1
        
        # Generar probabilidades simuladas
        probs = [random.uniform(0, 30) for _ in range(5)]
        probs[birads_simulado - 1] = confidence_simulado
        total = sum(probs)
        probabilidades = [round(p / total * 100, 2) for p in probs]
        
        # URL base de Railway
        base_url = os.getenv("RAILWAY_STATIC_URL", "https://tu-app.railway.app")
        
        results[view] = {
            "birads": birads_simulado,
            "confidence": confidence_simulado,
            "probabilidades": probabilidades,
            "image_url": f"{base_url}/images/{filename}",
            "note": "Simulado para Railway - Modelo ML se activará después"
        }
    
    return JSONResponse(content=results)

# Modelos Pydantic
class UsuarioCreate(BaseModel):
    nombre: str
    usuario: str
    fecha_nacimiento: datetime.date
    rol: str
    password: str
    observaciones: str = ""

# Registro de usuario optimizado para Railway
@app.post("/register")
def registrar_usuario(usuario: UsuarioCreate):
    try:
        from sqlalchemy.orm import Session
        
        # Validar rol
        roles_permitidos = ["Administrador", "Radiólogo"]
        rol_normalizado = usuario.rol if usuario.rol in roles_permitidos else "Radiólogo"
        
        # Crear usuario con SQLAlchemy (más confiable que subprocess)
        db = SessionLocal()
        try:
            # Verificar si existe
            existing_user = db.query(Usuario).filter(Usuario.usuario == usuario.usuario).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="El usuario ya está registrado")
            
            # Crear nuevo usuario
            nuevo_usuario = Usuario(
                usuario=usuario.usuario,
                nombre=usuario.nombre,
                fecha_nacimiento=usuario.fecha_nacimiento,
                rol=rol_normalizado,
                observaciones=usuario.observaciones,
                password_hash=bcrypt.hash(usuario.password)
            )
            
            db.add(nuevo_usuario)
            db.commit()
            db.refresh(nuevo_usuario)
            
            return {"message": "Usuario registrado exitosamente en Railway"}
            
        finally:
            db.close()
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en registro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Login optimizado
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.post("/login")
def login(datos: dict):
    try:
        usuario = datos.get("usuario", "")
        password = datos.get("password", "")
        
        if not usuario or not password:
            raise HTTPException(status_code=400, detail="Usuario y contraseña son requeridos")
        
        # Usar SQLAlchemy en lugar de subprocess
        db = SessionLocal()
        try:
            user_record = db.query(Usuario).filter(Usuario.usuario == usuario).first()
            
            if not user_record:
                raise HTTPException(status_code=401, detail="Credenciales inválidas")
            
            # Verificar contraseña
            if not bcrypt.verify(password, user_record.password_hash):
                raise HTTPException(status_code=401, detail="Credenciales inválidas")
            
            # Crear token
            access_token = create_access_token(data={"sub": user_record.usuario})
            return {
                "access_token": access_token, 
                "token_type": "bearer", 
                "user": {
                    "id": user_record.id,
                    "usuario": user_record.usuario, 
                    "nombre": user_record.nombre
                }
            }
        finally:
            db.close()
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config_railway.PORT)