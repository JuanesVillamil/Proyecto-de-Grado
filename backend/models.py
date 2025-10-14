from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    documento = Column(String, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    rol = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

class Reporte(Base):
    __tablename__ = "reportes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_creacion = Column(DateTime, default=func.now(), nullable=False)
    resultado_birads = Column(String, nullable=False)  # BI-RADS más frecuente
    detalles_json = Column(Text, nullable=False)  # JSON con todos los resultados
    nombre_paciente = Column(String, nullable=True)  # Opcional para identificar el caso  