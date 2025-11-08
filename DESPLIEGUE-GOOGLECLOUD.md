# Pasos para realizar el despliegue del sistema en Google Cloud

## Instalacion de la CLI de Google Cloud
1. Acceder a https://docs.cloud.google.com/sdk/docs/install-sdk?hl=es-419
2. Descargar el archivo correspondiente al sistema operativo 
3. Seguir los pasos de instalacion
4. Inicializar la CLI con **gcloud init**

## Acceder a la CLI de Google Cloud
0. Si la maquina virtual no esta prendida, correr **gcloud compute instances start instance-20251030-165216**
1. correr **gcloud compute ssh instance-20251030-165216**
2. En caso de que la red bloque la conexion **(ssh: connect to host 35.223.139.97 port 22: Connection refused)**, conectarser con **gcloud compute ssh instance-20251030-165216 --tunnel-through-iap**
3. Ingresar la passphrase

## Actualizaciones de repositorio
1. Navegar a la carpeta del proyecto con **cd Proyecto-de-Grado/**
2. Ejecutar **git pull origin GCDeploy**
3. Navegar a la carpeta del Frontend con **cd frontend/**
4. Actualizar el proyecto con **npm install**
5. Construir la pagina con **npm run build**

## Containers
1. Navegar a la carpeta del proyecto
2. Apagar los containers existentes con **sudo docker compose down**
3. Reconstruir los containers con **sudo docker compose build**
4. Activar los containers con **sudo docker compose up -d**
5. Verificar que todos los containers estan activos con **sudo docker ps**
6. Si se desea acceder a la terminal integrada de Postgres dentro del container, correr **sudo docker exec -it birads_postgres psql -U postgres -d birads_db**
7. Si ocurre algun error, leer los logs con **_**sudo docker logs [container] | tail -n 30**_**