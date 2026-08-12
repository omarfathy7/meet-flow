using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MeetFlow.BLL.DTOs.AiDraftExtraction
{
    // What the AI service sends back — wrapped in an object (not a bare array) so the
    // contract can grow later (e.g. a "warnings" field) without breaking existing code.
    public class AiExtractionResponse
    {
        [JsonPropertyName("task_drafts")]
        public List<AiTaskDraft> TaskDrafts { get; set; } = new();
    }

    public class AiTaskDraft
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = null!;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("assignee_name")]
        public string? AssigneeName { get; set; }

        [JsonPropertyName("priority")]
        public string Priority { get; set; } = "Medium";

        // Sent as "" when unknown (per agreement with the AI teammate) — NOT null,
        // NOT omitted. Parsed defensively in the service either way.
        [JsonPropertyName("deadline")]
        public string? Deadline { get; set; }

        [JsonPropertyName("decision_index")]
        public int? DecisionIndex { get; set; }
    }
}
