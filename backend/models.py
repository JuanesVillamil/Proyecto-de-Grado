from sqlalchemy import Column, Integer, String, Date
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    documento = Column(String, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    rol = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)  