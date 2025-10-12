# Instrucciones para ejecutar la aplicación con Docker

## Prerrequisitos
1. **Iniciar Docker Desktop**: Busca Docker Desktop en el menú de inicio y ábrelo. Espera a que aparezca "Docker Desktop is running" en la barra de tareas.

## Levantar todos los servicios
```bash
docker-compose up -d --build
```

## Ver logs
```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs de la base de datos
docker-compose logs -f postgres
```

## Detener servicios
```bash
docker-compose down
```

## Limpiar todo (incluyendo volúmenes)
```bash
docker-compose down -v
```

## Acceder a la base de datos desde dentro del contenedor
```bash
docker exec -it birads_postgres psql -U postgres -d birads_db
```

## URLs de la aplicación
- Backend API: http://localhost:8000
- Frontend: http://localhost:4200 (ejecutar por separado con `ng serve`)
- Base de datos: localhost:5432

## Notas importantes
- **IMPORTANTE**: Docker Desktop debe estar ejecutándose antes de usar estos comandos
- La base de datos se persiste en un volumen Docker llamado `postgres_data`
- Los archivos del backend se montan como volumen para desarrollo
- Las variables de entorno están en `.env.docker` para Docker y `.env.local` para desarrollo local
- El frontend no está en Docker, ejecuta `ng serve` en el directorio frontend/ por separado