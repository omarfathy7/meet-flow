import logging
from fastapi import Depends, FastAPI, HTTPException
from app.dependencies.auth import verify_ai_service_key
from app.infrastructure.gemini_client import GeminiClient
from app.services.task_service import TaskService
from app.models import ExtractTasksRequest, TaskListResponse


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meetflow_ai")

app = FastAPI(
    title="MeetFlow AI Service",
    version="1.0.0",
)

gemini_client = GeminiClient()
task_service = TaskService(gemini_client)

@app.get("/")
def root():
    return {"service": "MeetFlow AI", "status": "running"}

@app.get("/health")
def health_check():
    return {"service": "MeetFlow AI", "status": "healthy"}

@app.post(
    "/ai/extract-tasks",
    dependencies=[Depends(verify_ai_service_key)],
    response_model=TaskListResponse,
)
def extract_meeting_tasks(request: ExtractTasksRequest):
    try:
        result = task_service.extract_tasks(
            meeting_title=request.meeting_title,
            meeting_date=request.meeting_date,
            participants=request.participants,
            notes=request.notes,
            decisions=request.decisions,
        )
        return result

    except Exception as e:
        logger.exception("AI task extraction failed")  
        raise HTTPException(
            status_code=500,
            detail="AI task extraction failed",
        )