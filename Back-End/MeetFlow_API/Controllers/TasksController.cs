using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetFlow.BLL.DTOs.Task;
using MeetFlow.BLL.DTOs.TaskDraft;
using MeetFlow.BLL.Interfaces;

namespace MeetFlow_API.Controllers
{
    // Tasks are always scoped to a meeting: /api/meetings/{meetingId}/tasks
    [Route("api/meetings/{meetingId:int}/tasks")]
    [Authorize]
    public class TasksController : BaseApiController
    {
        private readonly ITaskService _taskService;
        private readonly ITaskDraftService _taskDraftService;

        public TasksController(ITaskService taskService, ITaskDraftService taskDraftService)
        {
            _taskService = taskService;
            _taskDraftService = taskDraftService;
        }

        // GET /api/meetings/{meetingId}/tasks
        [HttpGet]
        public async Task<ActionResult<List<TaskDto>>> GetForMeeting(int meetingId)
        {
            var tasks = await _taskService.GetForMeetingAsync(GetCurrentUserId(), meetingId);
            return Ok(tasks);
        }

        // POST /api/meetings/{meetingId}/tasks  — any workspace member
        [HttpPost]
        public async Task<ActionResult<TaskDto>> Create(int meetingId, CreateTaskDto dto)
        {
            var task = await _taskService.CreateAsync(GetCurrentUserId(), meetingId, dto);
            return Ok(task);
        }

        // PUT /api/meetings/{meetingId}/tasks/{taskId}  — meeting creator or workspace Owner
        [HttpPut("{taskId:int}")]
        public async Task<ActionResult<TaskDto>> Update(int meetingId, int taskId, UpdateTaskDto dto)
        {
            var task = await _taskService.UpdateAsync(GetCurrentUserId(), meetingId, taskId, dto);
            return Ok(task);
        }

        // PUT /api/meetings/{meetingId}/tasks/{taskId}/status  — assignee, meeting creator, or workspace Owner
        [HttpPut("{taskId:int}/status")]
        public async Task<ActionResult<TaskDto>> UpdateStatus(int meetingId, int taskId, UpdateTaskStatusDto dto)
        {
            var task = await _taskService.UpdateStatusAsync(GetCurrentUserId(), meetingId, taskId, dto);
            return Ok(task);
        }

        // DELETE /api/meetings/{meetingId}/tasks/{taskId}  — meeting creator or workspace Owner
        [HttpDelete("{taskId:int}")]
        public async Task<IActionResult> Delete(int meetingId, int taskId)
        {
            await _taskService.DeleteAsync(GetCurrentUserId(), meetingId, taskId);
            return NoContent();
        }

        // ============================================================================
        // OLD FLOW (Gemini, in-backend, auto-saves as real Tasks immediately) — kept
        // here fully working but disabled. To bring it back: delete the /* and */
        // below and comment out (or remove) the new ExtractFromNotes action further
        // down instead, since both use the same route + HTTP verb and can't be active
        // at the same time.
        // ============================================================================
        /*
        // POST /api/meetings/{meetingId}/tasks/extract-from-notes
        // The core MeetFlow flow: paste raw meeting notes -> AI pulls out action items ->
        // matched to real workspace members -> saved as Tasks -> WhatsApp sent to each assignee.
        [HttpPost("extract-from-notes")]
        public async Task<ActionResult<List<TaskDto>>> ExtractFromNotes(int meetingId, ExtractTasksRequestDto dto)
        {
            var tasks = await _taskService.ExtractTasksFromNotesAsync(GetCurrentUserId(), meetingId, dto.NotesText);
            return Ok(tasks);
        }
        */

        // POST /api/meetings/{meetingId}/tasks/extract-from-notes
        // NEW FLOW: talks to the external AI teammate's service. Takes ONLY meetingId
        // (no body) — the backend gathers meeting title/date/participants/notes/decisions
        // itself and sends them to the AI. Results are saved as TaskDrafts (NOT real
        // Tasks) — see TaskDraftsController for review/edit/approve/reject.
        [HttpPost("extract-from-notes")]
        public async Task<ActionResult<List<TaskDraftDto>>> ExtractFromNotes(int meetingId)
        {
            var drafts = await _taskDraftService.ExtractDraftsAsync(GetCurrentUserId(), meetingId);
            return Ok(drafts);
        }

        // GET /api/tasks/my  — every task assigned to me, across all my workspaces
        [HttpGet("/api/tasks/my")]
        public async Task<ActionResult<List<TaskDto>>> GetMyTasks()
        {
            var tasks = await _taskService.GetMyTasksAsync(GetCurrentUserId());
            return Ok(tasks);
        }
    }
}
