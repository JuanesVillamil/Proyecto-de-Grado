@echo off
echo 🚀 Iniciando Sistema BIRADS...
echo.

echo 📁 Creando directorios necesarios...
if not exist "backend\temp_views" mkdir backend\temp_views

echo 🐳 Iniciando base de datos PostgreSQL...
docker-compose up -d
echo ⏳ Esperando a que PostgreSQL inicie (30 segundos)...
timeout /t 30 /nobreak

echo ✅ Base de datos iniciada!
echo.
echo 📋 Próximos pasos:
echo.
echo 1. Abrir nueva terminal y ejecutar:
echo    cd backend
echo    uvicorn app:app --reload --host 0.0.0.0 --port 8000
echo.
echo 2. Abrir otra terminal y ejecutar:
echo    cd frontend
echo    npm install
echo    npm start
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:4200
echo    Backend:  http://localhost:8000
echo.
pause