import os
import json

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel


# =========================
# 1. Load API Key
# =========================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing")


# =========================
# 2. Gemini Client
# =========================

client = genai.Client(
    api_key=api_key
)


# =========================
# 3. Structured Output Schema
# =========================

class Task(BaseModel):
    title: str
    description: str
    assignee: str | None
    priority: str
    deadline: str | None


class TaskList(BaseModel):
    tasks: list[Task]


# =========================
# 4. Meeting Notes
# =========================

meeting_notes = """
Meeting: MeetFlow Sprint Planning
Date: 2026-08-07

Participants:
Omar
Rawda
Eman
Nazeh

Discussion:
We need to finish the MVP before the deadline.

Nazeh will handle the ui/ux tasks.
Rawda will finish the backend API by August 9.
Eman will finish the dashboard frontend by August 10.
Omar will prepare the demo video by August 11.

We also discussed deployment, but no one was assigned to it yet.
"""


# =========================
# 5. Prompt
# =========================

prompt = f"""
You are MeetFlow AI.

Extract actionable tasks from the meeting notes below.

Rules:

1. Extract only actionable tasks.
2. Never invent an assignee.
3. Never invent a deadline.
4. The assignee must be one of the meeting participants.
5. Convert explicit deadlines to YYYY-MM-DD.
6. If there is no assignee, use null.
7. If there is no deadline, use null.
8. Priority must be Low, Medium, or High.

Meeting Notes:

{meeting_notes}
"""


# =========================
# 6. Generate Structured JSON
# =========================

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=prompt,
    config={
        "response_mime_type": "application/json",
        "response_json_schema": TaskList.model_json_schema(),
    },
)


# =========================
# 7. Parse Response
# =========================

result = TaskList.model_validate_json(response.text)


# =========================
# 8. Display Result
# =========================

print("\n========== Structured Gemini Response ==========\n")

print(
    json.dumps(
        result.model_dump(),
        indent=2,
        ensure_ascii=False
    )
)

print("\n========== Validation ==========\n")

print("Valid structured output: YES")
print(f"Tasks extracted: {len(result.tasks)}")