using System.Collections.Generic;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using MeetFlow.BLL.DTOs.Task;
using MeetFlow.BLL.DTOs.TaskDraft;

namespace MeetFlow.BLL.Interfaces
{
    public interface ITaskDraftService
    {
        // Gathers meeting title/date/participants/notes/decisions, calls the external
        // AI service, maps + validates its response, and saves the results as drafts.
        Task<List<TaskDraftDto>> ExtractDraftsAsync(int userId, int meetingId);

        Task<List<TaskDraftDto>> GetDraftsForMeetingAsync(int userId, int meetingId);
        Task<TaskDraftDto> UpdateDraftAsync(int userId, int meetingId, int draftId, UpdateTaskDraftDto dto);
        Task<TaskDto> ApproveDraftAsync(int userId, int meetingId, int draftId);
        Task RejectDraftAsync(int userId, int meetingId, int draftId);
    }
}
