import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import torch.nn as nn
from huggingface_hub import hf_hub_download
import os

def get_model_architecture():
    model = models.resnet18(weights=None)
    num_feats = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_feats, 5)
    )
    return model

REPO_ID = "Enterwar99/MODEL_MAMMOGRAFII"
FILENAME = "best_model.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME, token=os.getenv("HUGGINGFACE_HUB_TOKEN"))
model = get_model_architecture()
model.load_state_dict(torch.load(model_path, map_location=device))
model.to(device)
model.eval()

imagenet_mean = [0.485, 0.456, 0.406]
imagenet_std = [0.229, 0.224, 0.225]
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
])

def predict_birads_per_view(image_paths: dict):
    results = {}
    for view, path in image_paths.items():
        image = Image.open(path).convert("RGB")
        image_tensor = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probs, 1)
            birads_category = predicted_idx.item() + 1

            # Convertir tensor a lista de floats en porcentaje
            probs_percent = probs.squeeze().tolist()
            probs_percent = [round(p * 100, 2) for p in probs_percent]

        results[view] = {
            "birads": birads_category,
            "confidence": round(float(confidence) * 100, 2),
            "probabilidades": probs_percent  # ← NUEVO
        }
    return results