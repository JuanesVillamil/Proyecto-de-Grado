@echo off
cd backend
echo Iniciando backend...
start cmd /k uvicorn app:app --reload
cd ..frontend
echo Iniciando frontend Angular...
npm start
