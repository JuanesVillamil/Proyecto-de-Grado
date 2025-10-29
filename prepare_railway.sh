#!/bin/bash

# 🚀 SCRIPT AUTOMATICO PARA RAILWAY DEPLOYMENT
# Ejecuta este script para preparar todo automáticamente

echo "🚀 Preparando proyecto para Railway..."

# Preparar backend
echo "📁 Preparando backend..."
cd backend
cp app_railway.py app.py
cp config_railway.py config.py
cp database_railway.py database.py
cp requirements-railway.txt requirements.txt

# Preparar frontend
echo "📁 Preparando frontend..."
cd ../frontend
cp package-railway.json package.json

echo "✅ Archivos preparados!"
echo ""
echo "🔧 PRÓXIMOS PASOS MANUALES:"
echo "1. Actualizar URLs en frontend (buscar 'localhost:8000' y cambiar por Railway URL)"
echo "2. Subir a GitHub"
echo "3. Conectar con Railway"
echo ""
echo "🌍 Revisa RAILWAY_DEPLOY_GUIDE.md para instrucciones completas"