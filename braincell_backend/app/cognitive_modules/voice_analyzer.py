from ..api.schemas import VocalState


def infer_vocal_state(_audio_blob: str | None) -> VocalState | None:
    """Placeholder vocal analysis that will be replaced with real signal processing.

    Args:
        _audio_blob: Base64-encoded audio payload from the client.

    Returns:
        A best-guess VocalState or None if insufficient signal.
    """
    return None
