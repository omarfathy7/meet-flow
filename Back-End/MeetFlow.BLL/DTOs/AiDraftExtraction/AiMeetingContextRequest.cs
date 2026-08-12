using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MeetFlow.BLL.DTOs.AiDraftExtraction
{
    // Everything we send to the external AI service for one meeting.
    // JsonPropertyName forces snake_case on the wire regardless of our C# naming,
    // since that's the convention his service expects.
    public class AiMeetingContextRequest
    {
        [JsonPropertyName("meeting_title")]
        public string MeetingTitle { get; set; } = null!;

        [JsonPropertyName("meeting_date")]
        public DateTime MeetingDate { get; set; }

        [JsonPropertyName("participants")]
        public List<AiParticipant> Participants { get; set; } = new();

        [JsonPropertyName("notes")]
        public List<string> Notes { get; set; } = new();

        [JsonPropertyName("decisions")]
        public List<string> Decisions { get; set; } = new();
    }

    public class AiParticipant
    {
        [JsonPropertyName("user_id")]
        public int UserId { get; set; }

        [JsonPropertyName("full_name")]
        public string FullName { get; set; } = null!;
    }
}
