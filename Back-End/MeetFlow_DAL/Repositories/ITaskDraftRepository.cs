using System.Collections.Generic;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using MeetFlow_DAL.Entities;

namespace MeetFlow_DAL.Repositories
{
    public interface ITaskDraftRepository
    {
        Task<TaskDraft?> GetByIdAsync(int id);
        Task<List<TaskDraft>> GetForMeetingAsync(int meetingId);
        Task AddRangeAsync(IEnumerable<TaskDraft> drafts);
        void Remove(TaskDraft draft);
    }
}
