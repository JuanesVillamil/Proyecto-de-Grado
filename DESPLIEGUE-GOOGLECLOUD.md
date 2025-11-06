# Pasos para realizar el despliegue del sistema en Google Cloud

## Instalacion de la CLI de Google Cloud
1. Acceder a https://docs.cloud.google.com/sdk/docs/install-sdk?hl=es-419
2. Descargar el archivo correspondiente al sistema operativo 
3. Seguir los pasos de instalacion
4. Inicializar la CLI con _gcloud init_

## Acceder a la CLI de Google Cloud
0. Si la maquina virtual no esta prendida, correr _gcloud compute instances start instance-20251030-165216_
1. correr _gcloud compute ssh instance-20251030-165216_
2. En caso de que la red bloque la conexion **(ssh: connect to host 35.223.139.97 port 22: Connection refused)**, conectarser con _gcloud compute ssh instance-20251030-165216 --tunnel-through-iap_
3. Ingresar la passphrase

## Actualizaciones de repositorio
1. Navegar a la carpeta del proyecto con _cd Proyecto-de-Grado/_
2. Ejecutar _git pull origin GCDeploy_
3. Navegar a la carpeta del Frontend con _cd frontend/_
4. Actualizar el proyecto con _npm install_
5. Construir la pagina con _npm run build_

## Containers
1. Navegar a la carpeta del proyecto
2. Obtener el Token de Hugginface con **export HUGGINGFACE_HUB_TOKEN=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/HUGGINGFACE_HUB_TOKEN" -H "Metadata-Flavor: Google")**
3. Apagar los containers existentes con _sudo docker compose down_
4. Reconstruir los containers con _sudo docker compose build_
5. Activar los containers con _sudo docker compose up -d_
6. Verificar que todos los containers estan activos con _sudo docker ps_
7. Si se desea acceder a la terminal integrada de Postgres dentro del container, correr 'sudo docker exec -it birads_postgres psql -U postgres -d birads_db'
8. Si ocurre algun error, leer los logs con _sudo docker logs [container] | tail -n 30_