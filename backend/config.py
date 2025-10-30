import os
import sys

def configure_environment():
    """Configura el entorno para evitar problemas de codificación en Windows"""
    if sys.platform == "win32":
        # Configurar codificación UTF-8
        os.environ['PYTHONIOENCODING'] = 'utf-8'
        os.environ['PYTHONUTF8'] = '1'
        
        # Configurar locale si es posible
        try:
            import locale
            locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
        except:
            pass

# Configurar el entorno al importar
configure_environment()

# Variables de configuración
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@postgres:5432/birads_db"
)

SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_muy_segura_para_jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30