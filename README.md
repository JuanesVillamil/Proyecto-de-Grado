1. Instalar frontend
cd frontend
npm install
cd ..

2. Iniciar Uvicorn
cd backend
Conexion a entorno virtual source venv/bin/activate (MacOs) o venv\Scripts\activate (Windows)
uvicorn app:app --host 127.0.0.1 --port 8000

3. Iniciar proyecto
cd ..
./start.sh