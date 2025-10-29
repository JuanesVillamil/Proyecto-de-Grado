from sqlalchemy import create_engine, Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import config_railway
import os

# Usar la configuración de Railway
SQLALCHEMY_DATABASE_URL = config_railway.DATABASE_URL

print(f"🔗 Conectando a Railway DB...")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=config_railway.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Definir modelos directamente aquí para Railway
class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), unique=True, index=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    rol = Column(String(50), nullable=False)
    observaciones = Column(Text)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default='now()')
    
    # Relación con reportes
    reportes = relationship("Reporte", back_populates="usuario", cascade="all, delete-orphan")

class Reporte(Base):
    __tablename__ = "reportes"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    fecha_creacion = Column(DateTime, server_default='now()')
    resultado_birads = Column(String(20), nullable=False)
    detalles_json = Column(Text, nullable=False)
    nombre_paciente = Column(String(100))
    
    # Relación con usuario
    usuario = relationship("Usuario", back_populates="reportes")

# Función para inicializar la base de datos
def init_db():
    """Crear todas las tablas y datos iniciales"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas en Railway PostgreSQL")
        
        # Crear usuario administrador por defecto
        db = SessionLocal()
        try:
            existing_admin = db.query(Usuario).filter(Usuario.usuario == "admin").first()
            if not existing_admin:
                from passlib.hash import bcrypt
                import datetime
                
                admin_user = Usuario(
                    usuario="admin",
                    nombre="Administrador del Sistema",
                    fecha_nacimiento=datetime.date(1990, 1, 1),
                    rol="Administrador",
                    observaciones="Usuario administrador por defecto",
                    password_hash=bcrypt.hash("admin123")
                )
                db.add(admin_user)
                db.commit()
                print("✅ Usuario admin creado (usuario: admin, password: admin123)")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")

if __name__ == "__main__":
    init_db()