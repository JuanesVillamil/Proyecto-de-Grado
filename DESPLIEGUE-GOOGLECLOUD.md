# Pasos para realizar el despliegue del sistema en Google Cloud

## Instalacion de la CLI de Google Cloud+
<ol>
  <li>Acceder a https://docs.cloud.google.com/sdk/docs/install-sdk?hl=es-419</li>
  <li>Descargar el archivo correspondiente al sistema operativo </li>
  <li>Seguir los pasos de instalacion</li>
  <li>Inicializar la CLI con <b>gcloud init</b></li>
</ol>

## Acceder a la CLI de Google Cloud
<ol>
  <li>Si la maquina virtual no esta prendida, correr <b>gcloud compute instances start instance-20251030-165216</b></li>
  <li>correr <b>gcloud compute ssh instance-20251030-165216</b></li>
  <li>En caso de que la red bloque la conexion <i>(ssh: connect to host 35.223.139.97 port 22: Connection refused)</i>, conectarser con <b>gcloud compute ssh instance-20251030-165216 --tunnel-through-iap</b></li>
  <li>Ingresar la passphrase</li>
</ol>

## Actualizaciones de repositorio
<ol>
  <li>Navegar a la carpeta del proyecto con <b>cd Proyecto-de-Grado/</b></li>
  <li>Ejecutar <b>git pull origin GCDeploy</b></li>
  <li>Navegar a la carpeta del Frontend con <b>cd frontend/</b></li>
  <li>Actualizar el proyecto con <b>npm install</b></li>
  <li>Construir la pagina con <b>npm run build</b></li>
</ol>

## Containers
<ol>
  <li>Navegar a la carpeta del proyecto</li>
  <li>Apagar los containers existentes con <b>sudo docker compose down</b></li>
  <li>Reconstruir los containers con <b>sudo docker compose build</b></li>
  <li>Activar los containers con <b>sudo docker compose up -d</b></li>
  <li>Si en algun momento ocurre un error relacionado con el <b>Puerto 80</b>, ejecutar <b>sudo systemctl stop nginx</b> y volver a intentar</li>
  <li>Verificar que todos los containers estan activos con <b>sudo docker ps</b></li>
  <li>Si se desea acceder a la terminal integrada de Postgres dentro del container, correr <b>sudo docker exec -it birads_postgres psql -U postgres -d birads_db</b></li>
  <li>Si ocurre algun error dentro del sistema, leer los logs con <b>sudo docker logs [container] | tail -n 30</b></li>
</ol>
