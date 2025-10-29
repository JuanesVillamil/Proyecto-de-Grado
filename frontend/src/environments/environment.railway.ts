// Configuración para Railway
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-railway.railway.app'  // Railway te dará esta URL
};

// Para desarrollo local
export const environmentDev = {
  production: false,
  apiUrl: 'http://localhost:8000'
};