# MeetFlow

> **AI-assisted Meeting Follow-up Platform**

MeetFlow is a meeting management and follow-up platform designed to help teams organize meetings, document discussions, track decisions, and turn meeting outcomes into actionable tasks.

The project consists of a web frontend, an ASP.NET Core backend, and a dedicated AI microservice.

---

## 📌 Project Overview

Meetings often generate important decisions, responsibilities, and action items, but these outcomes can easily be lost after the meeting ends.

MeetFlow provides a centralized platform where teams can:

- Organize workspaces and team members
- Create and manage meetings
- Record meeting notes
- Record important decisions
- Generate AI-assisted draft tasks
- Review AI-generated suggestions before saving
- Assign tasks to workspace members
- Track task progress and meeting outcomes

---

## 🔄 Core Workflow

```text
Workspace
      ↓
Create Meeting
      ↓
Meeting Notes & Decisions
      ↓
AI Draft Task Extraction
      ↓
Backend Validation
      ↓
Review Suggestions
      ↓
Save Tasks
      ↓
Task Management
````

---

## ✨ Features

### 🔐 Authentication

* User registration and login
* JWT authentication
* Refresh tokens
* Password hashing
* Password recovery
* Logout and logout-all
* Protected pages and endpoints

### 🏢 Workspace Management

* Create, view, update, and delete workspaces
* Manage workspace members
* Member invitations
* Member removal
* Role management

### 📅 Meeting Management

* Create, view, update, and delete meetings
* Workspace-specific meetings
* Upcoming, past, and cancelled meetings
* Meeting details and action items

### 📝 Meeting Notes

* Create notes
* View notes
* Update notes
* Delete notes

### 📌 Decisions

* Create decisions
* View decisions
* Update decisions
* Delete decisions

### ✅ Tasks

* Create, view, update, and delete tasks
* Assign tasks to workspace members
* Task priorities
* Task status management
* Meeting-related tasks

### 🤖 AI Task Extraction

MeetFlow uses a dedicated AI microservice to extract actionable task suggestions from meeting notes and decisions.

```text
Meeting Notes + Decisions
            ↓
      .NET Backend
            ↓
      MeetFlow AI
            ↓
      Google Gemini
            ↓
     Draft Task Suggestions
            ↓
      Backend Validation
            ↓
       Review & Save
```

AI-generated results are returned as draft tasks. The backend remains responsible for validation and persistence.

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │     HTML/CSS/JS     │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │     .NET Backend    │
                    │   ASP.NET Core API  │
                    └───────┬─────┬───────┘
                            │     │
                            │     └──────────────────┐
                            │                        │
                            ▼                        ▼
                 ┌──────────────────┐     ┌────────────────────┐
                 │    SQL Server    │     │   MeetFlow AI      │
                 │                  │     │      FastAPI       │
                 │ Users            │     │                    │
                 │ Workspaces       │     │ Gemini Integration │
                 │ Meetings         │     │ Task Extraction    │
                 │ Notes            │     │                    │
                 │ Decisions        │     └──────────┬─────────┘
                 │ Tasks            │                │
                 └──────────────────┘                ▼
                                           ┌────────────────────┐
                                           │   Google Gemini    │
                                           └────────────────────┘
```

### Responsibilities

**Frontend**

* User interface
* Meeting and task workflows
* Workspace management
* Review screens

**Backend**

* Authentication and authorization
* Core business logic
* Validation
* Database persistence
* Main application APIs
* Communication with the AI service

**AI Service**

* Meeting content analysis
* Task extraction
* Gemini integration
* Structured task generation

**Database**

* Users
* Workspaces
* Meetings
* Participants
* Notes
* Decisions
* Tasks

---

# 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)

### Backend

* ASP.NET Core Web API
* .NET 8
* C#
* Entity Framework Core
* SQL Server
* JWT Authentication
* BCrypt
* Swagger / OpenAPI

### AI

* Python
* FastAPI
* Pydantic
* Uvicorn
* Google Gemini
* Docker

---

# ⚙️ Setup

## Prerequisites

* Git
* .NET 8 SDK
* SQL Server
* Python
* Docker
* Visual Studio or VS Code

## Clone

```bash
git clone https://github.com/omarfathy7/meet-flow.git
cd meet-flow
```

## Frontend

The frontend is a static HTML/CSS/JavaScript application.

Run it using VS Code Live Server or another static HTTP server.

Example:

```bash
npx serve Frontend
```

## Backend

```bash
dotnet restore
dotnet ef database update
dotnet run
```

Backend API:

```text
https://meetflow.runasp.net
```

Swagger:

```text
https://meetflow.runasp.net/swagger/index.html
```

## AI Service

```bash
cd AI
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create environment variables:

```env
GEMINI_API_KEY=your-gemini-api-key
AI_SERVICE_API_KEY=your-internal-service-key
```

Run locally:

```bash
uvicorn app.main:app --reload
```

AI Swagger:

```text
http://localhost:8000/docs
```

---

# 🚀 Deployment

### Frontend

Deployed as a static web application on Vercel.

### Backend

```text
https://meetflow.runasp.net
```

### AI Service

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net
```

Swagger:

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/docs
```

Health:

```text
https://meetflow-ai-api-gth5aub8ctbhe2h6.germanywestcentral-01.azurewebsites.net/health
```

---

# 🔒 Security

Sensitive information such as database credentials, JWT secrets, Gemini API keys, and AI service API keys must not be committed to the repository.

Production secrets are stored using environment variables or secure cloud configuration.

The frontend never communicates directly with Google Gemini.

---

# 👥 Team

| Member | Role               |
| ------ | ------------------ |
| Omar   | Data Science / AI  |
| Rawda  | Backend Developer  |
| Eman   | Frontend Developer |
| Nazeh  | UI/UX Designer     |

---
