from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from typing import Optional

import numpy as np

try:
    import torch  # type: ignore
    from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2Processor  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    torch = None  # type: ignore
    Wav2Vec2ForSequenceClassification = None  # type: ignore
    Wav2Vec2Processor = None  # type: ignore

try:
    import librosa  # type: ignore
except Exception:  # pragma: no cover
    librosa = None  # type: ignore


_voice_model = None
_voice_processor = None


@dataclass
class VoiceEmotionResult:
    label: str
    score: float
    candidates: list[tuple[str, float]] | None = None
    source: str = "hf"  # 'hf' when transformer model used, 'fallback' otherwise


def _load_voice_model(model_id: str = "Dpngtm/wav2vec2-emotion-recognition"):
    global _voice_model, _voice_processor
    if torch is None or Wav2Vec2ForSequenceClassification is None:
        return None, None
    if _voice_model is None or _voice_processor is None:
        _voice_processor = Wav2Vec2Processor.from_pretrained(model_id)
        _voice_model = Wav2Vec2ForSequenceClassification.from_pretrained(model_id)
        _voice_model.eval()
    return _voice_model, _voice_processor


def warmup_voice_model(model_id: str = "Dpngtm/wav2vec2-emotion-recognition") -> bool:
    """Load the HF voice model into memory if available.

    Returns True if the model is available and loaded, False otherwise.
    """
    try:
        model, processor = _load_voice_model(model_id)
        return bool(model is not None and processor is not None)
    except Exception:
        return False


def _decode_wav(audio_b64: str, target_sr: int = 16000) -> Optional[np.ndarray]:
    if librosa is None:
        return None
    if audio_b64.startswith("data:audio"):
        audio_b64 = audio_b64.split(",", 1)[1]
    audio_bytes = base64.b64decode(audio_b64)
    # Load using librosa
    try:
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=True)
        if sr != target_sr:
            y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        return y
    except Exception:
        return None


def infer_voice_emotion(audio_b64: str) -> VoiceEmotionResult:
    model, processor = _load_voice_model()
    if model is None or processor is None:
        return VoiceEmotionResult(label="calm", score=0.5, source="fallback")

    y = _decode_wav(audio_b64, target_sr=16000)
    if y is None or len(y) < 3200:  # < 0.2s at 16kHz
        return VoiceEmotionResult(label="calm", score=0.5, source="fallback")

    with torch.no_grad():  # type: ignore[attr-defined]
        inputs = processor(y, sampling_rate=16000, return_tensors="pt", padding=True)
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        idx = int(torch.argmax(probs))
        labels = model.config.id2label  # type: ignore[attr-defined]

        def norm(lbl: str) -> str:
            l = lbl.lower()
            if "angry" in l or "anger" in l:
                return "frustrated"  # map strong anger to frustrated for UI
            if "sad" in l or "disgust" in l:
                return "stressed"
            if "fear" in l or "anxiety" in l or "fearful" in l:
                return "hesitant"
            if "neutral" in l or "calm" in l:
                return "calm"
            if "happy" in l or "joy" in l:
                return "calm"  # happy speech -> calm state
            # Unknown emotions pass through
            return l

        label_raw = labels.get(idx, "calm")
        label = norm(label_raw)
        score = float(probs[idx].item())
        
        # Debug logging to see what the model is actually returning
        print(f"Voice emotion raw labels from model: {labels}")
        print(f"Voice emotion detected: {label_raw} -> {label} (score: {score:.2f})")
        
        order = torch.argsort(probs, descending=True)
        top = []
        for j in order[:3]:
            j_i = int(j)
            raw_l = labels.get(j_i, "calm")
            top.append((norm(raw_l), float(probs[j_i].item())))
    return VoiceEmotionResult(label=label, score=score, candidates=top, source="hf")
