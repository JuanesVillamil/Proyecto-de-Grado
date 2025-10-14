from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from sqlalchemy.orm import Session
import config  # Importar configuración antes de database
from database import Base, engine, SessionLocal
from starlette.responses import Response
from fastapi import FastAPI, HTTPException
from auth import create_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth import verify_token
from passlib.hash import bcrypt
import json
import datetime
class CORSAwareStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response: Response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
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
# from predict_resnet_multiview import predict_birads_per_view  # Deshabilitado por conflicto PyTorch
from PIL import Image

app = FastAPI()

# Crear tablas automáticamente cuando inicia la aplicación
# NOTA: Las tablas se crean automáticamente por Docker Y por SQLAlchemy
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de base de datos creadas/verificadas exitosamente")
except Exception as e:
    print(f"⚠️ Advertencia creando tablas: {e}")
print("✅ Backend iniciado - Usando base de datos Docker PostgreSQL")

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

app.mount("/images", CORSAwareStaticFiles(directory=TEMP_DIR), name="images")

# Endpoint de salud que no requiere base de datos
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend funcionando correctamente"}

@app.get("/")
def root():
    return {"message": "API de BI-RADS funcionando", "docs": "/docs"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

            # Gamma correction si muy brillante
            mean_val = np.mean(arr)
            if mean_val > 200:
                gamma = 0.6
                look_up = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype("uint8")
                arr = cv2.LUT(arr, look_up)

            # Recorte automático
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
                    # Forzar recorte más ancho
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

            # Redimensionar si <224
            if im.width < 224 or im.height < 224:
                scale = 224 / min(im.width, im.height)
                new_size = (int(im.width * scale), int(im.height * scale))
                im = im.resize(new_size, Image.LANCZOS)

            im.save(destino)

        except Exception as e:
            raise ValueError("No se pudo procesar el archivo DICOM. Verifique su integridad.")

    # Procesamiento de imágenes estándar (JPG, PNG, TIF)
    else:
        try:
            with open(temp_path, "rb") as f:
                img_check = Image.open(f)
                img_check.load()

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

@app.post("/predict")
async def predict(
    l_cc: UploadFile = File(None),
    r_cc: UploadFile = File(None),
    l_mlo: UploadFile = File(None),
    r_mlo: UploadFile = File(None),
    usuario_id: int = None,
    nombre_paciente: str = None
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

    # Generar resultados simulados mientras se soluciona el modelo ML
    results = {}
    import random
    
    birads_counts = {}
    for view, path in image_paths.items():
        filename = os.path.basename(path)
        
        # Simular clasificación BI-RADS (temporal)
        birads_simulado = random.randint(1, 5)
        confidence_simulado = round(random.uniform(75.0, 95.0), 2)
        
        # Contar BI-RADS para determinar el más frecuente
        birads_counts[birads_simulado] = birads_counts.get(birads_simulado, 0) + 1
        
        # Generar probabilidades simuladas
        probs = [random.uniform(0, 30) for _ in range(5)]
        probs[birads_simulado - 1] = confidence_simulado  # Mayor probabilidad para la clase predicha
        total = sum(probs)
        probabilidades = [round(p / total * 100, 2) for p in probs]
        
        results[view] = {
            "birads": birads_simulado,
            "confidence": confidence_simulado,
            "probabilidades": probabilidades,
            "image_url": f"http://127.0.0.1:8000/images/{filename}",
            "note": "Resultado simulado - Modelo ML temporalmente deshabilitado"
        }
    
    # Determinar BI-RADS más frecuente o el más alto
    if birads_counts:
        resultado_birads_principal = max(birads_counts.keys())
    else:
        resultado_birads_principal = 1
    
    # Guardar el reporte en la base de datos si se proporciona usuario_id
    if usuario_id:
        try:
            import subprocess
            
            # Preparar los datos para insertar
            detalles_json = json.dumps(results, ensure_ascii=False)
            detalles_escaped = detalles_json.replace("'", "''")
            nombre_paciente_escaped = (nombre_paciente or "Sin especificar").replace("'", "''")
            
            # Insertar reporte usando subprocess
            insert_sql = f"""
            INSERT INTO reportes (usuario_id, resultado_birads, detalles_json, nombre_paciente) 
            VALUES ({usuario_id}, 'BI-RADS {resultado_birads_principal}', '{detalles_escaped}', '{nombre_paciente_escaped}');
            """
            
            result = subprocess.run([
                "docker", "exec", "-i", "birads_postgres", 
                "psql", "-U", "postgres", "-d", "birads_db", 
                "-c", insert_sql
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                results["reporte_guardado"] = True
                results["reporte_info"] = {
                    "usuario_id": usuario_id,
                    "resultado_birads": f"BI-RADS {resultado_birads_principal}",
                    "nombre_paciente": nombre_paciente or "Sin especificar"
                }
            else:
                results["reporte_guardado"] = False
                results["reporte_error"] = result.stderr
                
        except Exception as e:
            results["reporte_guardado"] = False
            results["reporte_error"] = str(e)
    
    return JSONResponse(content=results)

class UsuarioCreate(BaseModel):
    nombre: str
    documento: str
    fecha_nacimiento: datetime.date
    rol: str
    password: str

@app.post("/register")
def registrar_usuario(usuario: UsuarioCreate):
    try:
        # Usar subprocess para evitar problemas de codificación con psycopg2
        import subprocess
        
        # Escapar comillas en los datos
        documento = usuario.documento.replace("'", "''")
        nombre = usuario.nombre.replace("'", "''")
        fecha = usuario.fecha_nacimiento.strftime('%Y-%m-%d')
        rol = usuario.rol.replace("'", "''")
        password_hash = bcrypt.hash(usuario.password)
        
        # Verificar si ya existe
        check_sql = f"SELECT COUNT(*) FROM usuarios WHERE documento = '{documento}';"
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-t", "-c", check_sql
        ], capture_output=True, text=True)
        
        if result.returncode == 0 and int(result.stdout.strip()) > 0:
            raise HTTPException(status_code=400, detail="El documento ya está registrado")
        
        # Insertar nuevo usuario
        insert_sql = f"INSERT INTO usuarios (documento, nombre, fecha_nacimiento, rol, password_hash) VALUES ('{documento}', '{nombre}', '{fecha}', '{rol}', '{password_hash}');"
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-c", insert_sql
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            return {"message": "Usuario registrado exitosamente"}
        else:
            raise HTTPException(status_code=500, detail=f"Error en la base de datos: {result.stderr}")
                
    except HTTPException:
        # Re-lanzar HTTPExceptions específicas
        raise
    except Exception as e:
        # Manejar otros errores
        print(f"Error en registro: {str(e)}")  # Para debug
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

@app.get("/usuario-protegido")
def usuario_protegido(user: dict = Depends(get_current_user)):
    return {"mensaje": f"Hola, usuario autenticado: {user['sub']}"}

@app.post("/login")
def login(datos: dict):
    try:
        documento = datos.get("documento", "").replace("'", "''")
        password = datos.get("password", "")
        
        if not documento or not password:
            raise HTTPException(status_code=400, detail="Documento y contraseña son requeridos")
        
        # Buscar usuario en la base de datos usando subprocess
        import subprocess
        
        query_sql = f"SELECT documento, nombre, password_hash FROM usuarios WHERE documento = '{documento}';"
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-t", "-c", query_sql
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        lines = result.stdout.strip().split('\n')
        if not lines or lines[0].strip() == '':
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Parsear resultado
        user_data = lines[0].strip().split('|')
        if len(user_data) < 3:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        stored_documento = user_data[0].strip()
        stored_nombre = user_data[1].strip()
        stored_password_hash = user_data[2].strip()
        
        # Verificar contraseña
        if not bcrypt.verify(password, stored_password_hash):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Crear token
        access_token = create_access_token(data={"sub": stored_documento})
        return {"access_token": access_token, "token_type": "bearer", "user": {"documento": stored_documento, "nombre": stored_nombre}}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/logout")
def logout():
    """
    Endpoint de logout - En JWT no necesitamos hacer nada en el servidor
    ya que el token se maneja en el cliente, pero es útil para logging
    """
    return {"message": "Sesión cerrada exitosamente"}

@app.get("/reportes/{usuario_id}")
def listar_reportes(usuario_id: int):
    """
    Listar todos los reportes de un usuario específico
    """
    try:
        import subprocess
        
        # Consultar reportes del usuario ordenados por fecha descendente
        query_sql = f"""
        SELECT id, fecha_creacion, resultado_birads, nombre_paciente 
        FROM reportes 
        WHERE usuario_id = {usuario_id} 
        ORDER BY fecha_creacion DESC;
        """
        
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-t", "-c", query_sql
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error en la base de datos: {result.stderr}")
        
        # Parsear resultados
        reportes = []
        lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
        
        for line in lines:
            parts = line.split('|')
            if len(parts) >= 4:
                reportes.append({
                    "id": int(parts[0].strip()),
                    "fecha_creacion": parts[1].strip(),
                    "resultado_birads": parts[2].strip(),
                    "nombre_paciente": parts[3].strip()
                })
        
        return {"reportes": reportes, "total": len(reportes)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listando reportes: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/reportes/detalle/{reporte_id}")
def obtener_detalle_reporte(reporte_id: int):
    """
    Obtener el detalle completo de un reporte específico
    """
    try:
        import subprocess
        
        # Consultar el reporte específico con todos los detalles
        query_sql = f"""
        SELECT id, usuario_id, fecha_creacion, resultado_birads, detalles_json, nombre_paciente 
        FROM reportes 
        WHERE id = {reporte_id};
        """
        
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-t", "-c", query_sql
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error en la base de datos: {result.stderr}")
        
        lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
        
        if not lines:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # Parsear resultado
        parts = lines[0].split('|')
        if len(parts) < 6:
            raise HTTPException(status_code=500, detail="Datos de reporte incompletos")
        
        # Parsear JSON de detalles
        try:
            detalles = json.loads(parts[4].strip())
        except json.JSONDecodeError:
            detalles = {}
        
        reporte = {
            "id": int(parts[0].strip()),
            "usuario_id": int(parts[1].strip()),
            "fecha_creacion": parts[2].strip(),
            "resultado_birads": parts[3].strip(),
            "detalles": detalles,
            "nombre_paciente": parts[5].strip()
        }
        
        return reporte
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error obteniendo detalle reporte: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/reportes/download/{reporte_id}")
def descargar_reporte(reporte_id: int):
    """
    Descargar un reporte en formato JSON
    """
    try:
        # Obtener el reporte completo
        reporte = obtener_detalle_reporte(reporte_id)
        
        # Generar nombre de archivo
        fecha = reporte["fecha_creacion"].split(' ')[0].replace('-', '')
        nombre_archivo = f"reporte_birads_{reporte_id}_{fecha}.json"
        
        # Preparar contenido del reporte
        reporte_descarga = {
            "id": reporte["id"],
            "fecha_creacion": reporte["fecha_creacion"],
            "paciente": reporte["nombre_paciente"],
            "resultado_birads": reporte["resultado_birads"],
            "analisis_por_vista": reporte["detalles"],
            "resumen": {
                "total_vistas_analizadas": len(reporte["detalles"]),
                "clasificacion_principal": reporte["resultado_birads"]
            }
        }
        
        # Retornar como JSON descargable
        response = JSONResponse(content=reporte_descarga)
        response.headers["Content-Disposition"] = f"attachment; filename={nombre_archivo}"
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error descargando reporte: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")