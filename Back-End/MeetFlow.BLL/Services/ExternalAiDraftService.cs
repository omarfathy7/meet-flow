using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using Microsoft.Extensions.Configuration;
using MeetFlow.BLL.DTOs.AiDraftExtraction;
using MeetFlow.BLL.Interfaces;

namespace MeetFlow.BLL.Services
{
    // Setup: fill in AiService:BaseUrl (and AiService:ApiKey if his service requires it)
    // in appsettings.json. AiService:GenerateTasksPath defaults to "/ai/extract-tasks".
    // Auth is sent as a custom header "x-ai-service-key: {key}" — NOT a Bearer token —
    // matching his FastAPI service's actual auth scheme.
    public class ExternalAiDraftService : IExternalAiDraftService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public ExternalAiDraftService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<AiExtractionResponse> GenerateTaskDraftsAsync(AiMeetingContextRequest context)
        {
            var baseUrl = _config["AiService:BaseUrl"];
            if (string.IsNullOrWhiteSpace(baseUrl))
                throw new InvalidOperationException("AiService:BaseUrl is not configured in appsettings.json.");

            var path = _config["AiService:GenerateTasksPath"] ?? "/generate-tasks";
            var apiKey = _config["AiService:ApiKey"];

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}{path}")
            {
                Content = JsonContent.Create(context)
            };

            if (!string.IsNullOrWhiteSpace(apiKey))
                request.Headers.Add("X-AI-Service-Key", apiKey);

            var response = await _http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<AiExtractionResponse>(JsonOptions);
            return result ?? new AiExtractionResponse();
        }
    }
}
