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
import psycopg2
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
        roles_permitidos = ["Administrador", "Radiólogo", "administrador", "radiologo"]
        if usuario.rol not in roles_permitidos:
            raise HTTPException(status_code=400, detail="Rol no válido. Solo se permiten: Administrador, Radiólogo")

        rol_normalizado = "Administrador" if usuario.rol.lower() == "administrador" else "Radiólogo"
        password_hash = bcrypt.hash(usuario.password)

        # Connect to Postgres inside Docker network
        conn = psycopg2.connect(
            host="postgres",
            database="birads_db",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()

        # Verificar si ya existe
        cur.execute("SELECT COUNT(*) FROM usuarios WHERE documento = %s;", (usuario.usuario,))
        count = cur.fetchone()[0]
        if count > 0:
            raise HTTPException(status_code=400, detail="El usuario ya está registrado")

        # Insertar nuevo usuario
        cur.execute("""
            INSERT INTO usuarios (documento, nombre, fecha_nacimiento, rol, observaciones, password_hash)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (
            usuario.usuario,
            usuario.nombre,
            usuario.fecha_nacimiento.strftime('%Y-%m-%d'),
            rol_normalizado,
            usuario.observaciones or "",
            password_hash
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {"message": "Usuario registrado exitosamente"}

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
        usuario = datos.get("usuario", "").strip()
        password = datos.get("password", "").strip()

        if not usuario or not password:
            raise HTTPException(status_code=400, detail="Usuario y contraseña son requeridos")

        # Conexión directa a la base de datos dentro del contenedor
        conn = psycopg2.connect(
            host="postgres",        # nombre del servicio del contenedor postgres
            database="birads_db",
            user="postgres",
            password="postgres"
        )
        cur = conn.cursor()

        # Buscar usuario
        cur.execute("""
            SELECT id, documento, nombre, password_hash 
            FROM usuarios 
            WHERE documento = %s;
        """, (usuario,))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        stored_id, stored_usuario, stored_nombre, stored_password_hash = row

        # Verificar contraseña
        if not bcrypt.verify(password, stored_password_hash):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        # Crear token
        access_token = create_access_token(data={"sub": stored_usuario})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": stored_id,
                "usuario": stored_usuario,
                "nombre": stored_nombre
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

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

# Endpoints para gestión de perfil de usuario
@app.get("/usuario/{usuario_id}")
def obtener_usuario(usuario_id: int):
    """Obtener datos completos de un usuario por ID"""
    try:
        import subprocess
        
        # Consultar usuario usando subprocess
        select_sql = f"""
        SELECT id, usuario, nombre, fecha_nacimiento, rol, observaciones 
        FROM usuarios WHERE id = {usuario_id};
        """
        
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-t", "-A", "-F", "|", "-c", select_sql
        ], capture_output=True, text=True)
        
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            if lines and lines[0].strip():
                data = lines[0].split('|')
                if len(data) >= 6:
                    usuario_data = {
                        "id": int(data[0]),
                        "usuario": data[1],
                        "nombre": data[2],
                        "fecha_nacimiento": data[3],
                        "rol": data[4],
                        "observaciones": data[5] if data[5] else ""
                    }
                    return usuario_data
        
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    except Exception as e:
        print(f"Error obteniendo usuario: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.put("/usuario/{usuario_id}")
def actualizar_usuario(usuario_id: int, usuario_data: dict):
    """Actualizar datos de un usuario"""
    try:
        import subprocess
        
        # Preparar datos para actualizar
        usuario_name = usuario_data.get('usuario', '').replace("'", "''")
        nombre = usuario_data.get('nombre', '').replace("'", "''")
        fecha_nacimiento = usuario_data.get('fecha_nacimiento', '')
        rol_input = usuario_data.get('rol', 'Radiólogo')
        observaciones = usuario_data.get('observaciones', '').replace("'", "''")
        
        # Validar que el rol sea uno de los permitidos
        roles_permitidos = ["Administrador", "Radiólogo"]
        if rol_input not in roles_permitidos:
            raise HTTPException(status_code=400, detail="Rol no válido. Solo se permiten: Administrador, Radiólogo")
        
        rol = rol_input.replace("'", "''")
        
        # Validaciones básicas
        if not usuario_name or not nombre or not fecha_nacimiento:
            raise HTTPException(status_code=400, detail="Usuario, nombre y fecha de nacimiento son obligatorios")
        
        # Actualizar usuario usando subprocess
        update_sql = f"""
        UPDATE usuarios 
        SET usuario = '{usuario_name}',
            nombre = '{nombre}',
            fecha_nacimiento = '{fecha_nacimiento}',
            rol = '{rol}',
            observaciones = '{observaciones}'
        WHERE id = {usuario_id};
        """
        
        result = subprocess.run([
            "docker", "exec", "-i", "birads_postgres", 
            "psql", "-U", "postgres", "-d", "birads_db", 
            "-c", update_sql
        ], capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            return {
                "message": "Usuario actualizado correctamente",
                "usuario": {
                    "id": usuario_id,
                    "usuario": usuario_name,
                    "nombre": nombre,
                    "fecha_nacimiento": fecha_nacimiento,
                    "rol": rol,
                    "observaciones": observaciones
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Error actualizando usuario")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error actualizando usuario: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")