from app.infrastructure.gemini_client import GeminiClient
from app.services.task_service import TaskService
from app.models import Participant

gemini_client = GeminiClient()
task_service = TaskService(gemini_client)

result = task_service.extract_tasks(
    meeting_title="MeetFlow Sprint Planning",
    meeting_date="2026-08-07",
    participants=[
        Participant(id="guid-111", name="Omar"),
        Participant(id="guid-222", name="Rawda"),
        Participant(id="guid-333", name="Eman"),
        Participant(id="guid-444", name="Nazeh"),
    ],
    notes="""
    1. The team agreed to focus on the core MVP first.
    2. Omar will document this decision by August 8.

    Rawda will finish the backend API by August 9.
    Eman will finish the dashboard frontend by August 10.
    Omar will prepare the demo video by August 11.
    Nazeh will handle the UI/UX tasks.

    We also discussed deployment, but no one was assigned to it yet.
    """,
    decisions="""
    1. Focus on the core MVP first.
    2. Document the MVP scope.
    """,
)

print("\n========== AI RESULT ==========\n")
print("Tasks count:", len(result.tasks))

for task in result.tasks:
    print(f"Title: {task.title}")
    print(f"Description: {task.description}")
    print(f"Assignee ID: {task.assignee_id}")   
    print(f"Priority: {task.priority}")
    print(f"Deadline: {task.deadline}")
    print(f"Decision Index: {task.decision_index}")  
    print("-" * 40)