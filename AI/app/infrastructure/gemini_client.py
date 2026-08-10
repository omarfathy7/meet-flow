from google import genai
from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.models import GeminiTaskDraftList

class GeminiClient:

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = GEMINI_MODEL

    def extract_tasks(self, prompt: str) -> GeminiTaskDraftList:
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": GeminiTaskDraftList.model_json_schema(),
            },
        )
        return GeminiTaskDraftList.model_validate_json(response.text)