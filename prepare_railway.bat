@echo off
REM 🚀 SCRIPT AUTOMATICO PARA RAILWAY DEPLOYMENT - WINDOWS
REM Ejecuta este script para preparar todo automáticamente

echo 🚀 Preparando proyecto para Railway...

REM Preparar backend
echo 📁 Preparando backend...
cd backend
copy app_railway.py app.py
copy config_railway.py config.py
copy database_railway.py database.py
copy requirements-railway.txt requirements.txt

REM Preparar frontend
echo 📁 Preparando frontend...
cd ..\frontend
copy package-railway.json package.json

echo ✅ Archivos preparados!
echo.
echo 🔧 PRÓXIMOS PASOS MANUALES:
echo 1. Actualizar URLs en frontend (buscar 'localhost:8000' y cambiar por Railway URL)
echo 2. Subir a GitHub
echo 3. Conectar con Railway
echo.
echo 🌍 Revisa RAILWAY_DEPLOY_GUIDE.md para instrucciones completas

pause