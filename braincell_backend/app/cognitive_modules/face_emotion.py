from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from typing import Optional

import cv2  # type: ignore
import numpy as np

try:
    # Optional TensorFlow/Keras and HuggingFace Hub imports for Emo0.1 model
    from tensorflow.keras.models import load_model  # type: ignore
    from huggingface_hub import hf_hub_download  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    load_model = None  # type: ignore
    hf_hub_download = None  # type: ignore


_haar_cascade = None
_emo_model = None
_model_load_attempted = False


@dataclass
class FaceEmotionResult:
    label: str
    score: float
    candidates: list[tuple[str, float]] | None = None
    source: str = "heuristic"


def _get_haar_cascade():
    global _haar_cascade
    if _haar_cascade is None:
        _haar_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return _haar_cascade


def _load_emo_model(path: Optional[str] = None):
    """Load Emo0.1 model from HuggingFace Hub or local path.

    If path is provided, tries to load from that path.
    Otherwise, downloads from HuggingFace Hub: shivampr1001/Emo0.1

    If dependencies are not installed or model loading fails, returns None,
    and inference will gracefully fall back to a naive heuristic.
    """
    global _emo_model, _model_load_attempted
    
    # Return cached model if already loaded
    if _emo_model is not None:
        return _emo_model
    
    # Avoid repeated attempts if already failed
    if _model_load_attempted:
        return None
    
    # Check if dependencies are available
    if load_model is None or hf_hub_download is None:
        _model_load_attempted = True
        return None
    
    try:
        if path and path.strip():
            # User provided a non-empty local path
            print(f"Loading Emo0.1 model from local path: {path}")
            _emo_model = load_model(path)
            print(f"✓ Loaded Emo0.1 model from local path")
        else:
            # Download from HuggingFace Hub (repo_id: shivampr1001/Emo0.1)
            print("Downloading Emo0.1 model from HuggingFace Hub: shivampr1001/Emo0.1")
            model_path = hf_hub_download(repo_id="shivampr1001/Emo0.1", filename="Emo0.1.h5")
            _emo_model = load_model(model_path)
            print(f"✓ Successfully loaded Emo0.1 model from HuggingFace Hub")
        return _emo_model
    except Exception as e:
        print(f"✗ Failed to load Emo0.1 model: {e}")
        _model_load_attempted = True
        return None


def get_facial_model_status(model_path: Optional[str] = None) -> str:
    """Return 'keras' if a Keras model is available (and can be loaded), else 'heuristic'.

    This will attempt to load the model once and cache it.
    """
    try:
        model = _load_emo_model(model_path)
        if model is not None:
            return "keras"
        return "heuristic"
    except Exception:
        return "heuristic"


def _decode_image(image_b64: str) -> np.ndarray:
    if image_b64.startswith("data:image"):
        image_b64 = image_b64.split(",", 1)[1]
    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def _preprocess_roi_for_emo01(roi: np.ndarray) -> np.ndarray:
    """Preprocess ROI for Emo0.1 model: 48x48 RGB, normalized to [0,1].
    
    Based on official documentation from shivampr1001/Emo0.1
    """
    # Convert BGR (OpenCV) to RGB
    img = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    # Resize to 48x48
    img = cv2.resize(img, (48, 48))
    # Normalize to float32 [0,1]
    img = img.astype("float32") / 255.0
    # Add batch dimension: (1, 48, 48, 3)
    return np.expand_dims(img, axis=0)


def infer_face_emotion(image_b64: str, *, model_path: Optional[str] = None) -> FaceEmotionResult:
    """Detect face and infer emotion using Emo0.1 model from HuggingFace.

    Model expects 48x48 RGB images and outputs 7 emotions:
    ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
    
    Falls back to brightness-based heuristic if model is unavailable.
    """
    img = _decode_image(image_b64)
    cascade = _get_haar_cascade()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(64, 64))
    if len(faces) == 0:
        # No face found; return neutral
        return FaceEmotionResult(label="neutral", score=0.5)

    x, y, w, h = faces[0]
    roi = img[y : y + h, x : x + w]

    # Attempt model inference with Emo0.1
    model = _load_emo_model(model_path)
    if model is not None:
        try:
            # Preprocess: 48x48 RGB normalized
            arr = _preprocess_roi_for_emo01(roi)
            
            # Predict
            preds = model.predict(arr, verbose=0)[0]
            
            # Labels from official Emo0.1 documentation
            emotions = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"]
            
            # Normalize labels for UI consistency
            def norm(lbl: str) -> str:
                if lbl in ["disgusted", "disgust"]:
                    return "frustrated"
                if lbl == "fearful":
                    return "fear"
                if lbl == "surprised":
                    return "surprise"
                return lbl

            idx = int(np.argmax(preds))
            raw_label = emotions[idx] if idx < len(emotions) else "neutral"
            label = norm(raw_label)
            score = float(preds[idx])
            
            # Build top-3 candidate list
            order = np.argsort(preds)[::-1]
            top = []
            for j in order[:3]:
                if j < len(emotions):
                    top.append((norm(emotions[j]), float(preds[j])))
            
            return FaceEmotionResult(label=label, score=score, candidates=top, source="keras")
        except Exception as e:
            print(f"Keras inference failed: {e}")
            pass

    # Heuristic fallback: brightness-based
    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray_roi, (48, 48))
    mean_val = float(np.mean(resized.astype("float32") / 255.0))
    
    if mean_val > 0.6:
        return FaceEmotionResult(label="happy", score=0.6, candidates=[("happy", 0.6), ("neutral", 0.3)], source="heuristic")
    if mean_val < 0.35:
        return FaceEmotionResult(label="sad", score=0.6, candidates=[("sad", 0.6), ("neutral", 0.3)], source="heuristic")
    return FaceEmotionResult(label="neutral", score=0.5, candidates=[("neutral", 0.5), ("happy", 0.25), ("sad", 0.25)], source="heuristic")
