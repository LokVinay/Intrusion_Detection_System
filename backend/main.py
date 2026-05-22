from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
import pickle
import joblib
from fastapi.middleware.cors import CORSMiddleware

# ----------------------
# Initialize FastAPI
# ----------------------
app = FastAPI(
    title="Intrusion Detection System",
    description="FastAPI backend for IDS XGBoost model with 10 features",
    version="1.1"
)

# ----------------------
# Enable CORS
# ----------------------
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Paths to model and encoder
# ----------------------
MODEL_PATH = "xgboost_model_10features.pkl"
ENCODER_PATH = "label_encoder_10features.pkl"

# ----------------------
# Load XGBoost model and LabelEncoder
# ----------------------
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print("✅ XGBoost model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load XGBoost model: {e}")
    model = None

try:
    label_encoder = joblib.load(ENCODER_PATH)
    print("✅ LabelEncoder loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load LabelEncoder: {e}")
    label_encoder = None


# ----------------------
# Input Schemas
# ----------------------
class TestInput(BaseModel):
    features: List[float]

class BatchTestInput(BaseModel):
    features_list: List[List[float]]


# ----------------------
# Root & Health
# ----------------------
@app.get("/")
def root():
    return {"message": "Intrusion Detection System Backend is Running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


# ----------------------
# Prediction Endpoints
# ----------------------
@app.post("/api/predict")
def predict(data: TestInput):
    if model is None or label_encoder is None:
        return {"error": "Model or LabelEncoder not loaded."}

    features_array = np.array(data.features).reshape(1, -1)
    pred_num = model.predict(features_array)[0]
    pred_label = label_encoder.inverse_transform([pred_num])[0]

    # Convert all attack types to "Intrusion"
    if pred_label.lower() != "normal":
        pred_label = "Intrusion"
    else:
        pred_label = "Normal"

    return {"prediction": pred_label}


@app.post("/api/predict-batch")
def predict_batch(data: BatchTestInput):
    if model is None or label_encoder is None:
        return {"error": "Model or LabelEncoder not loaded."}

    features_array = np.array(data.features_list)
    pred_nums = model.predict(features_array)
    pred_labels = label_encoder.inverse_transform(pred_nums)

    # Convert all attack categories to "Intrusion"
    final_labels = ["Normal" if label.lower() == "normal" else "Intrusion" for label in pred_labels]

    return {"predictions": final_labels}


# ----------------------
# Batch Prediction Summary
# ----------------------
@app.post("/api/predictions-summary-batch")
def predictions_summary_batch(data: BatchTestInput):
    if model is None or label_encoder is None:
        return {"predictions": [], "error": "Model or LabelEncoder not loaded."}
    try:
        features_array = np.array(data.features_list)
        pred_nums = model.predict(features_array)
        pred_labels = label_encoder.inverse_transform(pred_nums)
        final_labels = ["Normal" if l.lower() == "normal" else "Intrusion" for l in pred_labels]

        summary = {}
        for label in np.unique(final_labels):
            summary[label] = int(np.sum(np.array(final_labels) == label))
        return summary
    except Exception as e:
        return {"predictions": [], "error": str(e)}


# ----------------------
# Feature Importance
# ----------------------
@app.get("/api/feature-importance")
def feature_importance():
    if model is None:
        return {"error": "Model not loaded."}
    booster = model.get_booster() if hasattr(model, "get_booster") else model
    importance_dict = booster.get_score(importance_type="weight")
    importance_list = [{"feature": k, "importance": v} for k, v in importance_dict.items()]
    importance_list.sort(key=lambda x: x["importance"], reverse=True)
    return importance_list


# ----------------------
# Confusion Matrix (Simulated)
# ----------------------
@app.get("/api/confusion-matrix")
def confusion_matrix_endpoint():
    if model is None or label_encoder is None:
        return {"error": "Model or LabelEncoder not loaded."}
    try:
        X_test = np.random.rand(100, 10)
        y_test = np.random.choice(["Normal", "Intrusion"], 100)
        y_pred_nums = model.predict(X_test)
        y_pred_labels = label_encoder.inverse_transform(y_pred_nums)
        y_pred_labels = np.array(["Normal" if y.lower() == "normal" else "Intrusion" for y in y_pred_labels])

        normal_actual = int(np.sum(y_test == "Normal"))
        intrusion_actual = int(np.sum(y_test == "Intrusion"))
        normal_pred = int(np.sum(y_pred_labels == "Normal"))
        intrusion_pred = int(np.sum(y_pred_labels == "Intrusion"))

        cm = [
            [normal_actual, intrusion_pred],
            [intrusion_actual, intrusion_pred]
        ]
        return cm
    except Exception as e:
        return {"error": str(e)}

