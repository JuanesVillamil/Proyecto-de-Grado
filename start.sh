#!/bin/bash

# Iniciar backend
cd backend
echo "Iniciando backend..."
uvicorn app:app --reload &

# Iniciar frontend
cd ../frontend
echo "Iniciando frontend Angular..."
npm start