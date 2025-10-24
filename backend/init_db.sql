-- Script de inicialización de la base de datos
-- Se ejecuta automáticamente cuando se crea el contenedor PostgreSQL

-- Crear tabla usuarios si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    rol VARCHAR(50) NOT NULL,
    observaciones TEXT,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla reportes si no existe
CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado_birads VARCHAR(20) NOT NULL,
    detalles_json TEXT NOT NULL,
    nombre_paciente VARCHAR(100)
);

-- Insertar usuario de prueba (opcional)
-- Contraseña: admin123
INSERT INTO usuarios (usuario, nombre, fecha_nacimiento, rol, observaciones, password_hash) 
VALUES ('admin', 'Administrador Sistema', '1990-01-01', 'Administrador', 'Usuario por defecto del sistema', '$2b$12$LQv3c1yqBwWCAtwJENx.8.V7QjZyj3QNZq3p9ZTcOYxXHb1MlhR.O')
ON CONFLICT (usuario) DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON usuarios(nombre);