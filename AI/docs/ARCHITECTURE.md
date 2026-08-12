# MeetFlow AI Architecture

## Overview

MeetFlow AI is an independent FastAPI microservice responsible for extracting actionable task drafts from meeting notes and decisions.

The AI service is separated from the main .NET backend. The backend sends meeting data to the AI service, while the AI service communicates with Google Gemini and returns structured task drafts.

---

## Architecture

```text
.NET Backend
      |
      | HTTPS
      | POST /ai/extract-tasks
      | X-AI-Service-Key
      v
+-----------------------+
|   MeetFlow AI API     |
|       FastAPI         |
+-----------+-----------+
            |
            v
+-----------------------+
|     TaskService       |
+-----------+-----------+
            |
            v
+-----------------------+
|     GeminiClient      |
+-----------+-----------+
            |
            v
+-----------------------+
|    Google Gemini      |
+-----------------------+
````

---

## Components

### FastAPI Application

File:

```text
app/main.py
```

Responsibilities:

* Create the FastAPI application
* Define API endpoints
* Validate incoming requests
* Return structured responses
* Connect authentication and service layers

Main endpoints:

```text
GET  /
GET  /health
POST /ai/extract-tasks
```

---

### Configuration

File:

```text
app/config.py
```

Loads configuration from environment variables.

Required variables:

```text
GEMINI_API_KEY
AI_SERVICE_API_KEY
```

The application fails during startup when required credentials are missing.

---

### Authentication

File:

```text
app/dependencies/auth.py
```

The protected task extraction endpoint requires:

```http
X-AI-Service-Key: <AI_SERVICE_API_KEY>
```

The value is compared against the configured `AI_SERVICE_API_KEY`.

---

### Task Service

File:

```text
app/services/task_service.py
```

Responsible for:

* Processing meeting information
* Preparing the AI request
* Requesting task extraction
* Converting the result into structured task drafts

---

### Gemini Client

File:

```text
app/infrastructure/gemini_client.py
```

Responsible for communication with Google Gemini.

The Gemini API key remains inside the AI service and is never exposed to the frontend.

---

### Models

Directory:

```text
app/models/
```

Contains the Pydantic request and response models used by the API.

These models validate incoming requests and structure outgoing responses.

---

## Request Flow

```text
1. .NET Backend prepares meeting data
              |
              v
2. POST /ai/extract-tasks
              |
              v
3. X-AI-Service-Key validation
              |
              v
4. FastAPI request validation
              |
              v
5. TaskService
              |
              v
6. GeminiClient
              |
              v
7. Google Gemini
              |
              v
8. Structured task drafts
              |
              v
9. .NET Backend
```

---

## Security Boundary

The AI service is intended to be called by the main backend.

```text
.NET Backend
      |
      | X-AI-Service-Key
      v
MeetFlow AI
```

The following values are secrets:

```text
GEMINI_API_KEY
AI_SERVICE_API_KEY
```

They must be stored using environment variables or cloud secret configuration and must never be committed to the repository.

---

## Database Responsibility

MeetFlow AI does not own the main application database.

The .NET backend remains responsible for:

* Meetings
* Participants
* Notes
* Decisions
* Tasks
* Persistence

The AI service only generates task drafts and returns them to the backend.

```text
MeetFlow AI
     |
     | task_drafts
     v
.NET Backend
     |
     v
Database
```

---

## Deployment Architecture

```text
Source Code
     |
     v
Docker Build
     |
     v
Docker Hub
     |
     v
Azure App Service
     |
     v
Public HTTPS API
```

Production image:

```text
docker.io/erinyeagerr/meetflow-ai:latest
```

Production platform:

```text
Azure App Service
Linux
Germany West Central
```

---

## Design Benefits

Separating the AI functionality into its own service provides:

* Independent AI deployments
* Clear separation of responsibilities
* Easier AI provider replacement
* Independent scaling
* Reduced exposure of AI credentials
* Cleaner backend architecture
