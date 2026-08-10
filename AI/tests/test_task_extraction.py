from app.infrastructure.gemini_client import GeminiClient
from app.services.task_service import TaskService
from app.models import Participant


def main():
    participants = [
        Participant(user_id=1, full_name="Omar"),
        Participant(user_id=2, full_name="Ahmed"),
        Participant(user_id=3, full_name="Mariam"),
    ]

    service = TaskService(GeminiClient())

    result = service.extract_tasks(
        meeting_title="MeetFlow MVP Planning",
        meeting_date="2026-08-09",
        participants=participants,
        notes=[
            "Ahmed said the backend API is almost finished.",
            "Mariam thinks the dashboard design looks good.",
            "The team discussed the possibility of adding WhatsApp notifications.",
            "The frontend screens were completed yesterday.",
            "Omar will prepare the demo video before August 15.",
        ],
        decisions=[
            "Omar will prepare the final MVP demo.",
            "Ahmed will finish the backend API.",
        ],
    )

    print("\n========== TEST 1 ==========\n")

    for i, task in enumerate(result.task_drafts, start=1):
        print(f"Task {i}")
        print(f"Title: {task.title}")
        print(f"Description: {task.description}")
        print(f"Assignee Name: {task.assignee_name}")
        print(f"Priority: {task.priority}")
        print(f"Deadline: {task.deadline}")
        print(f"Decision Index: {task.decision_index}")
        print("-" * 40)


if __name__ == "__main__":
    main()