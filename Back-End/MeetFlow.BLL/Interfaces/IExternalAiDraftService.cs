using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using MeetFlow.BLL.DTOs.AiDraftExtraction;

namespace MeetFlow.BLL.Interfaces
{
    // Talks to the teammate's external AI microservice — completely separate from
    // IAiTaskExtractionService (the Gemini-in-backend flow), which is untouched.
    public interface IExternalAiDraftService
    {
        Task<AiExtractionResponse> GenerateTaskDraftsAsync(AiMeetingContextRequest context);
    }
}
