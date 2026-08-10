import logging
from typing import Literal, Optional

from pydantic import BaseModel


logger = logging.getLogger("meetflow_ai")


class Participant(BaseModel):
    user_id: int
    full_name: str


class ExtractTasksRequest(BaseModel):
    meeting_title: str
    meeting_date: str
    participants: list[Participant]
    notes: list[str]
    decisions: list[str]


class GeminiTaskDraft(BaseModel):
    title: str
    description: str
    assignee_name: Optional[str] = None
    priority: Literal["Low", "Medium", "High"]
    deadline: Optional[str] = None
    decision_index: Optional[int] = None


class GeminiTaskDraftList(BaseModel):
    task_drafts: list[GeminiTaskDraft]


class TaskListResponse(BaseModel):
    task_drafts: list[GeminiTaskDraft]