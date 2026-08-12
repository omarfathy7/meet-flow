using System;
using System.Collections.Generic;

namespace MeetFlow_DAL.Entities;

// A proposed task from the AI, waiting for a human to review/edit/approve or reject it
// before it becomes a real row in the Tasks table. Nothing here is "official" yet.
public partial class TaskDraft
{
    public int Id { get; set; }

    public int MeetingId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    // What the AI returned, kept for transparency/debugging even after mapping.
    public string? AssigneeNameRaw { get; set; }
    public int? DecisionIndexRaw { get; set; }

    // What we resolved those into — null means "AI mentioned someone/something,
    // but we couldn't confidently match it" and the reviewer should fill it in manually.
    public int? AssignedTo { get; set; }
    public int? DecisionId { get; set; }

    public string Priority { get; set; } = null!;

    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Meeting Meeting { get; set; } = null!;

    public virtual User? AssignedToNavigation { get; set; }

    public virtual Decision? Decision { get; set; }
}
