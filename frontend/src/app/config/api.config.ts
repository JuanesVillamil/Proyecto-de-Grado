// Configuración centralizada de la API
export const API_CONFIG = {
  // Para desarrollo local
  LOCAL_URL: 'http://localhost:8000',
  
  // Para Railway (se actualiza después del deploy)
  RAILWAY_URL: 'https://proyecto-birads-backend.railway.app',
  
  // URL actual (cambiar según el entorno)
  get BASE_URL() {
    // Detectar automáticamente el entorno
    if (globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1') {
      return this.LOCAL_URL;
    } else {
      return this.RAILWAY_URL;
    }
  }
};

// Exportar la URL base para usar en los componentes
export const API_BASE_URL = API_CONFIG.BASE_URL;