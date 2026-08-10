import os

from dotenv import load_dotenv


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash",
)

AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")


if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing")

if not AI_SERVICE_API_KEY:
    raise RuntimeError("AI_SERVICE_API_KEY is missing")