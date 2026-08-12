using System;

namespace MeetFlow.BLL.DTOs.TaskDraft
{
    public class TaskDraftDto
    {
        public int Id { get; set; }
        public int MeetingId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }

        // Raw AI output, kept so the reviewer can see what the AI actually said —
        // useful when AssignedTo/DecisionId below are null (no confident match found).
        public string? AssigneeNameRaw { get; set; }
        public int? DecisionIndexRaw { get; set; }

        public int? AssignedTo { get; set; }
        public string? AssignedToName { get; set; }

        public int? DecisionId { get; set; }
        public string? DecisionDescription { get; set; }

        public string Priority { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
