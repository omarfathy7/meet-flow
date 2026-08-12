using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetFlow.BLL.DTOs.Task;
using MeetFlow.BLL.DTOs.TaskDraft;
using MeetFlow.BLL.Interfaces;

namespace MeetFlow_API.Controllers
{
    // Reviewing what the AI proposed, before anything becomes a real Task.
    // /api/meetings/{meetingId}/task-drafts
    [Route("api/meetings/{meetingId:int}/task-drafts")]
    [Authorize]
    public class TaskDraftsController : BaseApiController
    {
        private readonly ITaskDraftService _taskDraftService;

        public TaskDraftsController(ITaskDraftService taskDraftService)
        {
            _taskDraftService = taskDraftService;
        }

        // GET /api/meetings/{meetingId}/task-drafts
        [HttpGet]
        public async Task<ActionResult<List<TaskDraftDto>>> GetForMeeting(int meetingId)
        {
            var drafts = await _taskDraftService.GetDraftsForMeetingAsync(GetCurrentUserId(), meetingId);
            return Ok(drafts);
        }

        // PUT /api/meetings/{meetingId}/task-drafts/{draftId}  — fix up before approving
        [HttpPut("{draftId:int}")]
        public async Task<ActionResult<TaskDraftDto>> Update(int meetingId, int draftId, UpdateTaskDraftDto dto)
        {
            var draft = await _taskDraftService.UpdateDraftAsync(GetCurrentUserId(), meetingId, draftId, dto);
            return Ok(draft);
        }

        // POST /api/meetings/{meetingId}/task-drafts/{draftId}/approve
        // Turns the draft into a real Task (and deletes the draft). WhatsApp is sent here,
        // not at extraction time — only once a human has confirmed the assignment.
        [HttpPost("{draftId:int}/approve")]
        public async Task<ActionResult<TaskDto>> Approve(int meetingId, int draftId)
        {
            var task = await _taskDraftService.ApproveDraftAsync(GetCurrentUserId(), meetingId, draftId);
            return Ok(task);
        }

        // DELETE /api/meetings/{meetingId}/task-drafts/{draftId}  — discard, nothing is created
        [HttpDelete("{draftId:int}")]
        public async Task<IActionResult> Reject(int meetingId, int draftId)
        {
            await _taskDraftService.RejectDraftAsync(GetCurrentUserId(), meetingId, draftId);
            return NoContent();
        }
    }
}
