from app.infrastructure.gemini_client import GeminiClient
from app.models import Participant, TaskListResponse


class TaskService:

    def __init__(self, gemini_client: GeminiClient):
        self.gemini_client = gemini_client

    def extract_tasks(
        self,
        meeting_title: str,
        meeting_date: str,
        participants: list[Participant],
        notes: list[str],
        decisions: list[str],
    ) -> TaskListResponse:

        prompt = self._build_prompt(
            meeting_title=meeting_title,
            meeting_date=meeting_date,
            participants=participants,
            notes=notes,
            decisions=decisions,
        )

        gemini_result = self.gemini_client.extract_tasks(prompt)

        return TaskListResponse(
            task_drafts=gemini_result.task_drafts
        )

    @staticmethod
    def _build_prompt(
        meeting_title: str,
        meeting_date: str,
        participants: list[Participant],
        notes: list[str],
        decisions: list[str],
    ) -> str:

        participants_str = "\n".join(
            f"- {p.full_name} (user_id: {p.user_id})"
            for p in participants
        )

        notes_str = "\n".join(
            f"- {note}"
            for note in notes
        )

        # Internal decision indexing starts from 0.
        # The frontend can display decision_index + 1 to users.
        decisions_str = "\n".join(
            f"{index}. {decision}"
            for index, decision in enumerate(decisions)
        )

        return f"""
You are MeetFlow AI.

Your job is to extract actionable tasks from a meeting.

Meeting information:
Meeting title: {meeting_title}
Meeting date: {meeting_date}

Participants:
{participants_str}

Notes:
{notes_str}

Decisions:
{decisions_str}

Rules:

1. Extract only actionable tasks.
2. A task must represent an action that someone needs to perform.
3. Do NOT create tasks from general discussion, opinions, status updates, or completed work.
4. Never invent an assignee.
5. An assignee must be one of the provided participants.
6. Use the participant's exact full_name as assignee_name.
7. If no valid assignee exists, use null for assignee_name.
8. Never invent a deadline.
9. Convert explicit deadlines to YYYY-MM-DD based on the meeting date.
10. If no deadline exists, use null.
11. Priority must be exactly one of: Low, Medium, High.
12. Decisions can contain tasks, but only extract them if they represent an actionable future action.
13. If a task is derived from a specific decision, put the decision's 0-based index in decision_index.
14. If a task is not derived from a decision, use null for decision_index.

Return a JSON object with a "task_drafts" array.

Each task object must contain:

- "title": string
- "description": string
- "assignee_name": string or null
- "priority": "Low" | "Medium" | "High"
- "deadline": string (YYYY-MM-DD) or null
- "decision_index": integer or null
"""