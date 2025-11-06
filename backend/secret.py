from google.cloud import secretmanager
import google_crc32c

def getSecret():
    client = secretmanager.SecretManagerServiceClient()

    name = "projects/166929649479/secrets/HUGGINGFACE_HUB_TOKEN/versions/1"

    response = client.access_secret_version(request={"name": name})

    # Verify payload checksum.
    crc32c = google_crc32c.Checksum()
    crc32c.update(response.payload.data)
    if response.payload.data_crc32c != int(crc32c.hexdigest(), 16):
        print("Data corruption detected.")

    # Print the secret payload.
    secret = response.payload.data.decode("UTF-8")
    return secret
