# 🔧 Solución de Problemas CORS y Conectividad

## ❌ Error común: "XMLHttpRequest cannot load due to access control checks"

### 🎯 **Pasos de diagnóstico para tu compañero:**

#### **1. Verificar que Docker esté funcionando**
```bash
docker ps
```
**Debe ver:** `birads_postgres` con status `Up`

#### **2. Verificar que el backend responda**
Abrir en navegador: `http://localhost:8000/health`

**✅ Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "Backend funcionando correctamente"
}
```

**❌ Si no funciona:** El backend no está ejecutándose

#### **3. Iniciar el backend correctamente**
```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**✅ Debe ver:**
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Started server process
INFO: Application startup complete.
```

#### **4. Verificar conectividad desde frontend**
Abrir DevTools (F12) → Console → Ejecutar:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend conectado:', data))
  .catch(e => console.error('❌ Error:', e))
```

#### **5. Si persiste el error CORS:**

**Opción A: Usar Chrome sin CORS (temporal)**
```bash
# Windows
chrome.exe --user-data-dir=/tmp/foo --disable-web-security --disable-features=VizDisplayCompositor

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

**Opción B: Usar Firefox** (generalmente menos restrictivo con CORS en desarrollo)

**Opción C: Usar extensión CORS**
- Instalar extensión "CORS Unblock" en Chrome
- Activarla mientras desarrollas

#### **6. Verificar firewall/antivirus**
- Deshabilitar temporalmente Windows Defender
- Agregar excepción para puertos 4200 y 8000

### 🚀 **Orden correcto de inicio:**

```bash
# 1. Docker primero
docker-compose up -d

# 2. Backend segundo  
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend tercero (nueva terminal)
cd frontend
npm start
```

### 📱 **URLs para verificar:**

- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`  
- Frontend: `http://localhost:4200`

### 🎯 **Si nada funciona:**

**Cambiar configuración a modo desarrollo permisivo:**

En `backend/app.py`, cambiar CORS a:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Solo para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**⚠️ Importante:** Esta configuración es solo para desarrollo, NO para producción.