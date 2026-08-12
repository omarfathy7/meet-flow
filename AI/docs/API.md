# MeetFlow AI API

## Base URL

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net
````

---

## Authentication

Protected endpoints require the following HTTP header:

```http
X-AI-Service-Key: <AI_SERVICE_API_KEY>
```

The actual API key must be stored as a secret/environment variable and must never be committed to the repository.

---

## Endpoints

### GET /

Returns basic information about the AI service.

#### Response

```json
{
  "service": "MeetFlow AI",
  "status": "running"
}
```

---

### GET /health

Checks whether the AI service is running.

#### Response

```json
{
  "service": "MeetFlow AI",
  "status": "healthy"
}
```

#### Status

```text
200 OK
```

---

### POST /ai/extract-tasks

Extracts actionable task drafts from meeting notes and decisions.

#### Full URL

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/ai/extract-tasks
```

#### Headers

```http
Content-Type: application/json
X-AI-Service-Key: <AI_SERVICE_API_KEY>
```

#### Request Body

```json
{
  "meeting_title": "Team Meeting",
  "meeting_date": "2026-08-11",
  "participants": [
    {
      "user_id": 1,
      "full_name": "Omar"
    },
    {
      "user_id": 2,
      "full_name": "Ahmed"
    }
  ],
  "notes": [
    "Omar will prepare the frontend.",
    "Ahmed will prepare the database."
  ],
  "decisions": [
    "Frontend deadline is Friday."
  ]
}
```

#### Successful Response

**HTTP 200**

```json
{
  "task_drafts": [
    {
      "title": "Prepare the frontend",
      "description": "Omar will prepare the frontend.",
      "assignee_name": "Omar",
      "priority": "Medium",
      "deadline": "2026-08-14",
      "decision_index": 0
    },
    {
      "title": "Prepare the database",
      "description": "Ahmed will prepare the database.",
      "assignee_name": "Ahmed",
      "priority": "Medium",
      "deadline": null,
      "decision_index": null
    }
  ]
}
```

### decision_index

`decision_index` is zero-based.

```text
0 → first decision
1 → second decision
2 → third decision
```

The backend/frontend can display `decision_index + 1` when a user-facing decision number is required.

---

## Error Responses

### 401 Unauthorized

Missing API key:

```json
{
  "detail": "Missing AI service API key"
}
```

Invalid API key:

```json
{
  "detail": "Invalid AI service API key"
}
```

---

### 422 Unprocessable Content

Returned when the request body does not match the expected Pydantic schema.

Common causes:

* Missing required fields
* Invalid participant objects
* `user_id` is not an integer
* Missing `full_name`
* `notes` is not a list
* `decisions` is not a list

---

### 500 Internal Server Error

Returned when task extraction fails internally.

```json
{
  "detail": "AI task extraction failed"
}
```

---

## Swagger

Production Swagger UI:

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/docs
```

OpenAPI specification:

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/openapi.json
```

---

## Integration Flow

```text
.NET Backend
     |
     | POST /ai/extract-tasks
     | X-AI-Service-Key
     v
MeetFlow AI
     |
     v
Google Gemini
     |
     v
Task Drafts
     |
     v
.NET Backend
```
