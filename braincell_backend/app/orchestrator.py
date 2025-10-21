"""Core cognitive signal fusion logic for BrainCell."""

from .api.schemas import CognitiveState, FacialExpression, TextFriction, VocalState


def fuse_cognitive_signals(
    text_friction: TextFriction,
    vocal_state: VocalState | None,
    facial_expression: FacialExpression | None,
) -> CognitiveState:
    """Fuse multimodal signals into a single cognitive state.

    Implements the scoring rubric outlined in the technical specification.

    Args:
        text_friction: Typing-based friction metrics.
        vocal_state: Classified vocal state if audio is available.
        facial_expression: Classified facial expression if webcam is active.

    Returns:
        CognitiveState: The inferred focus/confusion/frustration status.
    """

    # Immediate overrides
    if vocal_state == VocalState.FRUSTRATED:
        return CognitiveState.FRUSTRATED

    score = 0

    # Textual friction
    if text_friction.rephrase_count > 1:
        score += 3
    if text_friction.backspace_count > 10:
        score += 2
    if text_friction.backspace_count > 20:
        score += 3

    # Vocal cues
    if vocal_state == VocalState.HESITANT:
        score += 3
    # Treat stressed as leaning towards confusion/frustration
    if getattr(VocalState, 'STRESSED', None) and vocal_state == VocalState.STRESSED:  # type: ignore[attr-defined]
        score += 4

    # Facial expressions
    if facial_expression in {
        FacialExpression.FEAR,
        FacialExpression.SAD,
        FacialExpression.ANGRY,
    }:
        score += 3
    elif facial_expression == FacialExpression.SURPRISE:
        score += 1

    # Strong confusion threshold
    if score >= 8:
        return CognitiveState.FRUSTRATED

    return CognitiveState.CONFUSED if score >= 4 else CognitiveState.FOCUSED
