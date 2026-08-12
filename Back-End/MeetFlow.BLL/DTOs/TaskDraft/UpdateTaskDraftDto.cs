using System;

namespace MeetFlow.BLL.DTOs.TaskDraft
{
    // For fixing up a draft before approving it — e.g. the AI matched the wrong
    // person, or got the priority wrong. The frontend sends real IDs here (it already
    // has the member/decision lists loaded), not raw AI text.
    public class UpdateTaskDraftDto
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public int? AssignedTo { get; set; }
        public int? DecisionId { get; set; }
        public string Priority { get; set; } = null!;
        public DateTime? DueDate { get; set; }
    }
}
