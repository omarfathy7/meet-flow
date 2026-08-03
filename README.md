# Meet-Flow

> **> AI-assisted Meeting Follow-up Platform**

Meet-Flow is a meeting management and follow-up platform designed to help teams organize meetings, document important discussions, track decisions, and turn meeting outcomes into actionable tasks.

The platform simplifies the complete meeting lifecycle — from creating and managing meetings to documenting outcomes, reviewing AI-generated task suggestions, and tracking follow-up activities.

---

# 📌 Project Overview

Meetings often generate important decisions, action items, and responsibilities, but these outcomes can easily be lost after the meeting ends.

Meet-Flow solves this problem by providing a centralized platform where teams can:

- Organize workspaces and team members
- Create and manage meetings
- Document meeting notes
- Record important decisions
- Generate AI-assisted draft tasks
- Review AI suggestions before saving
- Assign tasks to workspace members
- Track task progress and meeting outcomes

The project is being developed incrementally through multiple phases, with additional collaboration, notification, and integration features planned for future releases.

---

# 🎯 Project Goals

- Validate one complete meeting follow-up workflow.
- Keep the MVP simple, usable, and easy to demonstrate.
- Make the backend the source of truth for validation and persistence.
- Ensure every AI-generated task is reviewed before being saved.

---

# 🔄 MVP Flow

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
Review Screen
      ↓
Save Tasks
      ↓
Dashboard
      ↓
In-App Notifications
```

---

# ✨ Current Features

## 🔐 Authentication & User Management

- User registration
- User login
- JWT-based authentication
- Secure password hashing

---

## 🏢 Workspace Management

- Create workspaces
- View workspace details
- Update workspaces
- Delete workspaces
- Manage workspace members
- Owner and member roles

---

## 📅 Meeting Management

- Create meetings
- View meetings
- View meeting details
- Update meetings
- Delete meetings
- Associate meetings with workspaces

> Future phases may include meeting invitations and online meeting integrations.

---

## 📝 Meeting Notes

- Create meeting notes
- View meeting notes
- Update meeting notes
- Delete meeting notes

---

## 📌 Decision Management

- Create meeting decisions
- View decisions
- Update decisions
- Delete decisions

---

## ✅ Task Management

- Create tasks
- View tasks
- Update tasks
- Delete tasks
- Assign tasks to workspace members
- Track task status

---

## 🧠 AI-Powered Draft Task Extraction

MeetFlow uses AI to assist users by extracting **draft tasks** from meeting notes and decisions.

Every AI-generated task follows a validation workflow before becoming part of the system.

```text
Meeting Notes + Decisions
            ↓
      AI Extraction
            ↓
   Draft Task Suggestions
            ↓
   Backend Validation
            ↓
      Review Screen
            ↓
     User Confirmation
            ↓
        Save Tasks
```

---

# 👥 Team

| Member | Role |
|---------|------|
| Omar | Data Science |
| Rawda | Backend Developer |
| Eman | Frontend Developer |
| Nazeh | UI/UX Designer |
