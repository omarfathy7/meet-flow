# MeetFlow AI Deployment

## Production Environment

MeetFlow AI is deployed as a containerized FastAPI application on Azure App Service.

### Azure App Service

- Application: `meetflow-ai-api`
- Operating System: Linux
- Region: Germany West Central
- App Service Plan: `ASP-meetflowrg-b64a`
- Pricing Plan: Free (F1)
- Container Image: `docker.io/erinyeagerr/meetflow-ai:latest`

---

## Public API

### Base URL

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net
````

### Health Endpoint

```text
GET /health
```

Full URL:

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/health
```

Expected response:

```json
{
  "service": "MeetFlow AI",
  "status": "healthy"
}
```

### Swagger

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/docs
```

---

## Docker Image

### Docker Hub Repository

```text
erinyeagerr/meetflow-ai
```

### Image Tag

```text
latest
```

### Full Image

```text
docker.io/erinyeagerr/meetflow-ai:latest
```

---

## Build the Docker Image

From the AI service root directory:

```powershell
docker build -t meetflow-ai:latest .
```

---

## Tag the Image

```powershell
docker tag meetflow-ai:latest erinyeagerr/meetflow-ai:latest
```

---

## Push to Docker Hub

```powershell
docker push erinyeagerr/meetflow-ai:latest
```

---

## Required Environment Variables

The production AI service requires:

```text
GEMINI_API_KEY
AI_SERVICE_API_KEY
WEBSITES_PORT=8000
```

### GEMINI_API_KEY

The Google Gemini API key used by the AI service.

### AI_SERVICE_API_KEY

The internal secret used by the .NET backend to authenticate requests to the AI service.

### WEBSITES_PORT

The port used by the FastAPI application:

```text
8000
```

The actual secret values must never be committed to GitHub.

---

## Container Startup

The FastAPI application runs using Uvicorn:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The application listens on:

```text
0.0.0.0:8000
```

This allows Azure App Service to route incoming requests to the container.

---

## Deployment Verification

After deployment, verify the service in the following order.

### 1. Check the Application Status

In Azure App Service, verify that the application is running and that the container runtime is healthy.

Expected state:

```text
Runtime status: Healthy
```

### 2. Check the Health Endpoint

Open:

```text
/health
```

Expected HTTP status:

```text
200 OK
```

Expected response:

```json
{
  "service": "MeetFlow AI",
  "status": "healthy"
}
```

### 3. Open Swagger

Open:

```text
/docs
```

Verify that the following endpoints are available:

```text
GET  /
GET  /health
POST /ai/extract-tasks
```

### 4. Test Task Extraction

Send a valid `POST` request to:

```text
/ai/extract-tasks
```

with:

```http
Content-Type: application/json
X-AI-Service-Key: <AI_SERVICE_API_KEY>
```

Expected result:

```text
200 OK
```

with a structured `task_drafts` response.

---

## Updating the Production Image

After changing the AI source code:

### 1. Rebuild

```powershell
docker build -t meetflow-ai:latest .
```

### 2. Tag

```powershell
docker tag meetflow-ai:latest erinyeagerr/meetflow-ai:latest
```

### 3. Push

```powershell
docker push erinyeagerr/meetflow-ai:latest
```

### 4. Verify Azure

After the new image is pulled by Azure, verify:

```text
Runtime status: Healthy
```

Then test:

```text
/health
```

and:

```text
/docs
```

---

## Troubleshooting

### Container Fails During Startup

Check the container logs.

A missing Gemini API key produces:

```text
RuntimeError: GEMINI_API_KEY is missing
```

Add the missing environment variable to Azure App Service and restart the application.

### 401 Unauthorized

Check the request header:

```http
X-AI-Service-Key: <AI_SERVICE_API_KEY>
```

The value must match the `AI_SERVICE_API_KEY` configured in Azure.

### 422 Unprocessable Content

The request body does not match the API schema.

Common causes:

* Missing required fields
* Invalid participant structure
* `user_id` is not an integer
* Missing `full_name`
* `notes` is not a list
* `decisions` is not a list

### 500 Internal Server Error

Check the AI service logs for failures during task extraction or communication with Gemini.

### 403 Web App Stopped

If Azure reports:

```text
Error 403 - This web app is stopped.
```

check the Web App status in Azure Portal.

If the application was administratively stopped, start it again.

If Azure reports:

```text
Quota exceeded
```

check the App Service plan and Azure subscription/service quotas.

---

## Security

Production secrets must be configured through environment variables or Azure App Service configuration.

Never commit:

```text
GEMINI_API_KEY
AI_SERVICE_API_KEY
```

to GitHub.

The Gemini API key remains inside the AI service and is never exposed to the frontend.

The .NET backend only communicates with the AI service using:

```http
X-AI-Service-Key
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
MeetFlow AI API
    |
    v
.NET Backend
```

---

## Current Deployment

```text
Service:
MeetFlow AI

Framework:
FastAPI

Runtime:
Uvicorn

Container:
Docker

Registry:
Docker Hub

Cloud:
Azure App Service

Region:
Germany West Central

Port:
8000

Production Image:
docker.io/erinyeagerr/meetflow-ai:latest
```