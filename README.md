# Sistema de Clasificación BIRADS para Mamografías

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.103.2-green.svg)
![Angular](https://img.shields.io/badge/Angular-17+-red.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)
![HuggingFace](https://img.shields.io/badge/🤗-Model%20Deployed-yellow.svg)

## 📋 Descripción del Proyecto

**Proyecto de Grado - Ingeniería de Sistemas**

Sistema inteligente para la clasificación automática de mamografías según el estándar BI-RADS (Breast Imaging Reporting and Data System), desarrollado como proyecto de grado para la carrera de Ingeniería de Sistemas. 

El sistema utiliza técnicas de Deep Learning con arquitectura ResNet-18 para analizar imágenes mamográficas y proporcionar clasificaciones BI-RADS precisas, asistiendo a los profesionales médicos en el diagnóstico temprano del cáncer de mama.

## 🎯 Objetivos

- **Objetivo General**: Desarrollar un sistema automatizado para la clasificación de mamografías según el estándar BI-RADS utilizando técnicas de inteligencia artificial.

- **Objetivos Específicos**:
  - Implementar un modelo de Deep Learning para clasificación de imágenes médicas
  - Crear una interfaz web intuitiva para la carga y visualización de mamografías
  - Desarrollar un sistema de autenticación y gestión de usuarios
  - Proporcionar resultados de clasificación con niveles de confianza
  - Facilitar el análisis de múltiples vistas mamográficas (CC, MLO)

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
├── Frontend (Angular 17+)          # Interfaz de usuario
├── Backend (FastAPI + Python)      # API REST y lógica de negocio
├── Base de Datos (PostgreSQL)      # Gestión de usuarios y registros
├── Modelo ML (Hugging Face)        # Clasificación BI-RADS
└── Docker                          # Containerización y despliegue
```

### Tecnologías Utilizadas

**Frontend:**
- Angular 17+ con TypeScript
- SCSS para estilos
- Cornerstone.js para visualización DICOM
- Bootstrap para UI responsiva

**Backend:**
- FastAPI (Python)
- PyTorch para inferencia del modelo
- SQLAlchemy ORM
- JWT para autenticación
- Pillow para procesamiento de imágenes

**Machine Learning:**
- ResNet-18 (PyTorch)
- Modelo preentrenado desplegado en Hugging Face
- Preprocesamiento de imágenes médicas
- Clasificación multi-clase BI-RADS (1-5)

**Base de Datos:**
- PostgreSQL 15
- Docker para portabilidad
- Gestión de usuarios y sesiones

## 🤖 Modelo de Machine Learning

### Información del Modelo

- **Arquitectura**: ResNet-18 modificada
- **Repositorio**: [Enterwar99/MODEL_MAMMOGRAFII](https://huggingface.co/Enterwar99/MODEL_MAMMOGRAFII)
- **Plataforma**: Hugging Face Hub
- **Clases**: BI-RADS 1, 2, 3, 4, 5
- **Input**: Imágenes 224x224 RGB
- **Output**: Probabilidades por clase + confianza

### Características del Modelo

```python
# Arquitectura del modelo
- Base: ResNet-18
- Capas finales: Dropout(0.5) + Linear(512, 5)
- Activación: Softmax para probabilidades
- Normalización: ImageNet standard
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Docker y Docker Compose
- Python 3.8+
- Node.js 18+
- Git

### Instalación Rápida con Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/JuanesVillamil/Proyecto-de-Grado.git
cd Proyecto-de-Grado

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env.docker

# 3. Crear la imagen del Backend
cd backend
docker build -t birads_backend .

# 4. Levantar servicios con Docker
docker-compose up -d

# 5. Verificar que los servicios estén ejecutándose
docker-compose ps
```

### Instalación Manual

#### Backend

```bash
# Navegar al directorio backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos PostgreSQL
# (Asegúrate de tener PostgreSQL ejecutándose)

# Ejecutar el servidor
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# O construir para producción
npm run build
```

## 🐳 Configuración Docker

### Servicios Incluidos

```yaml
services:
  postgres:      # Base de datos PostgreSQL 15
  backend:       # API FastAPI en Puerto 8000
  # frontend se ejecuta localmente en desarrollo
```

### Variables de Entorno

```bash
# Backend (.env.docker)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/birads_db
SECRET_KEY=your-secret-key-here
HUGGINGFACE_TOKEN=your-hf-token (opcional)
```

## 📱 Uso del Sistema

### 1. Registro e Inicio de Sesión
- Crear cuenta nueva o iniciar sesión
- Sistema de autenticación JWT

### 2. Carga de Mamografías
- Soporta formatos: DICOM (.dcm), JPEG, PNG
- Carga múltiple para diferentes vistas
- Validación automática de archivos

### 3. Análisis y Clasificación
- Procesamiento automático con modelo BI-RADS
- Resultados por vista individual
- Niveles de confianza y probabilidades

### 4. Visualización de Resultados
- Visor DICOM integrado
- Clasificación BI-RADS con explicación
- Exportación de reportes

## 🔧 Estructura del Proyecto

```
Proyecto-de-Grado/
├── backend/
│   ├── app.py                 # Aplicación principal FastAPI
│   ├── auth.py               # Autenticación JWT
│   ├── database.py           # Configuración BD
│   ├── models.py             # Modelos SQLAlchemy
│   ├── predict_resnet_multiview.py  # Inferencia ML
│   ├── requirements.txt      # Dependencias Python
│   └── Dockerfile           # Imagen Docker backend
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/        # Componentes autenticación
│   │   │   ├── components/   # Componentes principales
│   │   │   └── services/    # Servicios Angular
│   │   └── assets/          # Recursos estáticos
│   ├── package.json         # Dependencias Node.js
│   └── angular.json         # Configuración Angular
├── docker-compose.yml       # Orquestación servicios
└── README.md               # Documentación
```

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run e2e
```

## 📊 Clasificación BI-RADS

| Categoría | Descripción | Probabilidad de Malignidad |
|-----------|-------------|---------------------------|
| BI-RADS 1 | Normal | 0% |
| BI-RADS 2 | Hallazgo benigno | 0% |
| BI-RADS 3 | Probablemente benigno | <2% |
| BI-RADS 4 | Sospechoso | 2-95% |
| BI-RADS 5 | Altamente sugestivo de malignidad | >95% |

## 🤝 Contribución

Este proyecto es parte de un trabajo de grado en Ingeniería de Sistemas. Para contribuciones:

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Autores

**Proyecto de Grado - Ingeniería de Sistemas**

- **Estudiante**: [Tu Nombre]
- **Director**: [Nombre del Director]
- **Universidad**: [Nombre de la Universidad]
- **Año**: 2025

## 🙏 Agradecimientos

- Hugging Face por el hosting del modelo ML
- Comunidad PyTorch por las herramientas de Deep Learning
- Cornerstone.js por el visor DICOM
- FastAPI por el framework web

## 📞 Contacto

- **Email**: [tu-email@universidad.edu]
- **LinkedIn**: [tu-perfil-linkedin]
- **GitHub**: [JuanesVillamil](https://github.com/JuanesVillamil)

---

**⚕️ Nota Médica**: Este sistema es una herramienta de apoyo diagnóstico y no reemplaza el criterio clínico profesional. Siempre consulte con un radiólogo certificado para interpretación definitiva.