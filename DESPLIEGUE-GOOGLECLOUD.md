# Pasos para realizar el despliegue del sistema en Google Cloud

## Instalacion de la CLI de Google Cloud
1. Acceder a https://docs.cloud.google.com/sdk/docs/install-sdk?hl=es-419
2. Descargar el archivo correspondiente al sistema operativo 
3. Seguir los pasos de instalacion
4. Inicializar la CLI con _gcloud init_

## Acceder a la CLI de Google Cloud
0. Si la maquina virtual no esta prendida, correr _gcloud compute instances start instance-20251030-165216_
1. correr _gcloud compute ssh instance-20251030-165216_
2. Ingresar la passphrase

## Actualizaciones de repositorio
1. Navegar a la carpeta del proyecto con _cd Proyecto-de-Grado/_
2. Ejecutar _git pull origin GCDeploy_
3. Navegar a la carpeta del Frontend con _cd frontend/_
4. Actualizar el proyecto con _npm install_
5. Construir la pagina con _npm run build_

## Containers
1. Navegar a la carpeta del proyecto
2. Apagar los containers existentes con _sudo docker container down_
3. Reconstruir los containers con _sudo docker container build_
4. Activar los containers con _sudo docker container up -d_
5. Verificar que todos los containers estan activos con _sudo docker ps_
6. Si se desea acceder a la terminal integrada de Postgres dentro del container, correr 'sudo docker exec -it birads_db psql -U postgres -d birads_postgres'