from fastapi import Header, HTTPException, status

from app.config import AI_SERVICE_API_KEY


def verify_ai_service_key(
    x_ai_service_key: str | None = Header(default=None),
) -> None:
    if not x_ai_service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing AI service API key",
        )

    if x_ai_service_key != AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid AI service API key",
        )