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
    if text_friction.backspace_count > 15:
        score += 1

    # Vocal cues
    if vocal_state == VocalState.HESITANT:
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

    return CognitiveState.CONFUSED if score >= 5 else CognitiveState.FOCUSED
