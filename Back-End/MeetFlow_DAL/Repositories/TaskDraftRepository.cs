using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using Microsoft.EntityFrameworkCore;
using MeetFlow_DAL.Data;
using MeetFlow_DAL.Entities;

namespace MeetFlow_DAL.Repositories
{
    public class TaskDraftRepository : ITaskDraftRepository
    {
        private readonly MeetFlowDbContext _db;

        public TaskDraftRepository(MeetFlowDbContext db)
        {
            _db = db;
        }

        public Task<TaskDraft?> GetByIdAsync(int id) =>
            _db.TaskDrafts
                .Include(d => d.AssignedToNavigation)
                .Include(d => d.Decision)
                .FirstOrDefaultAsync(d => d.Id == id);

        public Task<List<TaskDraft>> GetForMeetingAsync(int meetingId) =>
            _db.TaskDrafts
                .Include(d => d.AssignedToNavigation)
                .Include(d => d.Decision)
                .Where(d => d.MeetingId == meetingId)
                .OrderBy(d => d.CreatedAt)
                .ToListAsync();

        public Task AddRangeAsync(IEnumerable<TaskDraft> drafts)
        {
            _db.TaskDrafts.AddRange(drafts);
            return Task.CompletedTask;
        }

        public void Remove(TaskDraft draft)
        {
            _db.TaskDrafts.Remove(draft);
        }
    }
}
