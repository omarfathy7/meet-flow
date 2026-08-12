using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using TaskEntity = MeetFlow_DAL.Entities.Task;
using MeetFlow.BLL.DTOs.AiDraftExtraction;
using MeetFlow.BLL.DTOs.Task;
using MeetFlow.BLL.DTOs.TaskDraft;
using MeetFlow.BLL.Interfaces;
using MeetFlow_DAL.Common;
using MeetFlow_DAL.Entities;
using MeetFlow_DAL.Repositories;

namespace MeetFlow.BLL.Services
{
    // The whole "meeting -> AI -> draft -> review -> real task" flow lives here.
    // Nothing this class creates is a real Task until ApproveDraftAsync runs.
    public class TaskDraftService : ITaskDraftService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IExternalAiDraftService _aiDraftService;
        private readonly IWhatsAppService _whatsAppService;

        public TaskDraftService(IUnitOfWork unitOfWork, IExternalAiDraftService aiDraftService, IWhatsAppService whatsAppService)
        {
            _unitOfWork = unitOfWork;
            _aiDraftService = aiDraftService;
            _whatsAppService = whatsAppService;
        }

        public async Task<List<TaskDraftDto>> ExtractDraftsAsync(int userId, int meetingId)
        {
            var meeting = await GetMeetingOrThrowAsync(meetingId);
            await RequireMembershipAsync(userId, meeting.WorkspaceId);

            var workspaceMembers = await _unitOfWork.WorkspaceMembers.GetMembersAsync(meeting.WorkspaceId);
            var notes = await _unitOfWork.MeetingNotes.GetForMeetingAsync(meetingId);
            var decisions = await _unitOfWork.Decisions.GetForMeetingAsync(meetingId); // already ordered by CreatedAt

            var context = new AiMeetingContextRequest
            {
                MeetingTitle = meeting.Title,
                MeetingDate = meeting.MeetingDate,
                Participants = workspaceMembers
                    .Select(m => new AiParticipant { UserId = m.UserId, FullName = m.User.FullName })
                    .ToList(),
                Notes = notes.Select(n => n.Content).ToList(),
                Decisions = decisions.Select(d => d.Description).ToList()
            };

            var aiResponse = await _aiDraftService.GenerateTaskDraftsAsync(context);

            var draftEntities = aiResponse.TaskDrafts.Select(ai =>
            {
                // --- assignee_name -> AssignedTo (mapping + implicit validation) ---
                // We only search inside THIS workspace's member list, so a match can
                // never point at someone outside the workspace — that's the validation.
                var matchedMember = MatchMember(ai.AssigneeName, workspaceMembers);

                // --- decision_index -> DecisionId (mapping + validation) ---
                // Confirmed with the AI teammate: decision_index is 0-based (matches
                // normal array indexing). displayNumber = decision_index + 1 is a
                // SEPARATE, human-facing number he uses elsewhere — not used here.
                Decision? matchedDecision = null;
                if (ai.DecisionIndex is not null &&
                    ai.DecisionIndex.Value >= 0 && ai.DecisionIndex.Value < decisions.Count)
                {
                    matchedDecision = decisions[ai.DecisionIndex.Value];
                }

                // --- priority validation ---
                var priority = TaskPriorities.All.Contains(ai.Priority) ? ai.Priority : TaskPriorities.Medium;

                // --- deadline: "yyyy-MM-dd" or "" -> DateTime? at midnight ---
                DateTime? dueDate = null;
                if (!string.IsNullOrWhiteSpace(ai.Deadline) &&
                    DateTime.TryParse(ai.Deadline, out var parsedDate))
                {
                    dueDate = parsedDate.Date; // normalizes to 00:00:00
                }

                return new TaskDraft
                {
                    MeetingId = meetingId,
                    Title = ai.Title,
                    Description = ai.Description,
                    AssigneeNameRaw = ai.AssigneeName,
                    DecisionIndexRaw = ai.DecisionIndex,
                    AssignedTo = matchedMember?.UserId,
                    DecisionId = matchedDecision?.Id,
                    Priority = priority,
                    DueDate = dueDate,
                    CreatedAt = DateTime.UtcNow
                };
            }).ToList();

            await _unitOfWork.TaskDrafts.AddRangeAsync(draftEntities);
            await _unitOfWork.SaveChangesAsync();

            // Re-attach navigation objects locally so ToDraftDto below doesn't need another DB round trip.
            foreach (var draft in draftEntities)
            {
                if (draft.AssignedTo is not null)
                    draft.AssignedToNavigation = workspaceMembers.First(m => m.UserId == draft.AssignedTo).User;
                if (draft.DecisionId is not null)
                    draft.Decision = decisions.First(d => d.Id == draft.DecisionId);
            }

            return draftEntities.Select(ToDraftDto).ToList();
        }

        public async Task<List<TaskDraftDto>> GetDraftsForMeetingAsync(int userId, int meetingId)
        {
            var meeting = await GetMeetingOrThrowAsync(meetingId);
            await RequireMembershipAsync(userId, meeting.WorkspaceId);

            var drafts = await _unitOfWork.TaskDrafts.GetForMeetingAsync(meetingId);
            return drafts.Select(ToDraftDto).ToList();
        }

        public async Task<TaskDraftDto> UpdateDraftAsync(int userId, int meetingId, int draftId, UpdateTaskDraftDto dto)
        {
            var meeting = await GetMeetingOrThrowAsync(meetingId);
            await RequireMeetingEditRightsAsync(userId, meeting);

            var draft = await GetDraftOrThrowAsync(draftId, meetingId);

            if (dto.AssignedTo is not null)
                await RequireMembershipAsync(dto.AssignedTo.Value, meeting.WorkspaceId); // re-validate on every edit

            if (!TaskPriorities.All.Contains(dto.Priority))
                throw new InvalidOperationException($"Priority must be one of: {string.Join(", ", TaskPriorities.All)}.");

            draft.Title = dto.Title;
            draft.Description = dto.Description;
            draft.AssignedTo = dto.AssignedTo;
            draft.DecisionId = dto.DecisionId;
            draft.Priority = dto.Priority;
            draft.DueDate = dto.DueDate;

            await _unitOfWork.SaveChangesAsync();

            var refreshed = await _unitOfWork.TaskDrafts.GetByIdAsync(draftId);
            return ToDraftDto(refreshed!);
        }

        public async Task<TaskDto> ApproveDraftAsync(int userId, int meetingId, int draftId)
        {
            var meeting = await GetMeetingOrThrowAsync(meetingId);
            await RequireMeetingEditRightsAsync(userId, meeting);

            var draft = await GetDraftOrThrowAsync(draftId, meetingId);

            // Re-validate the assignee is still a workspace member — membership could have
            // changed between when the draft was created and now.
            if (draft.AssignedTo is not null)
                await RequireMembershipAsync(draft.AssignedTo.Value, meeting.WorkspaceId);

            var task = new TaskEntity
            {
                MeetingId = meetingId,
                DecisionId = draft.DecisionId,
                Title = draft.Title,
                Description = draft.Description,
                AssignedTo = draft.AssignedTo,
                DueDate = draft.DueDate,
                Priority = draft.Priority,
                Status = TaskStatuses.Todo,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Tasks.AddAsync(task);
            _unitOfWork.TaskDrafts.Remove(draft);
            await _unitOfWork.SaveChangesAsync();

            // Only now — once a human has approved it — does the assignee get pinged.
            if (draft.AssignedTo is not null)
            {
                var assignee = await _unitOfWork.Users.GetByIdAsync(draft.AssignedTo.Value);
                if (!string.IsNullOrWhiteSpace(assignee?.PhoneNumber))
                {
                    try
                    {
                        await _whatsAppService.SendTaskAssignedMessageAsync(assignee.PhoneNumber!, task.Title, task.DueDate);
                    }
                    catch
                    {
                        // Task is already saved either way — a failed WhatsApp send shouldn't fail the approval.
                    }
                }
            }

            return new TaskDto
            {
                Id = task.Id,
                MeetingId = task.MeetingId,
                Title = task.Title,
                Description = task.Description,
                AssignedTo = task.AssignedTo,
                AssignedToName = draft.AssignedToNavigation?.FullName,
                DueDate = task.DueDate,
                Priority = task.Priority,
                Status = task.Status,
                CreatedAt = task.CreatedAt
            };
        }

        public async Task RejectDraftAsync(int userId, int meetingId, int draftId)
        {
            var meeting = await GetMeetingOrThrowAsync(meetingId);
            await RequireMeetingEditRightsAsync(userId, meeting);

            var draft = await GetDraftOrThrowAsync(draftId, meetingId);
            _unitOfWork.TaskDrafts.Remove(draft);
            await _unitOfWork.SaveChangesAsync();
        }

        // ---------- helpers ----------

        private static WorkspaceMember? MatchMember(string? nameHint, List<WorkspaceMember> members)
        {
            if (string.IsNullOrWhiteSpace(nameHint)) return null;

            // Exact match first (case-insensitive), then a loose "contains" fallback.
            var exact = members.FirstOrDefault(m => string.Equals(m.User.FullName, nameHint, StringComparison.OrdinalIgnoreCase));
            if (exact is not null) return exact;

            return members.FirstOrDefault(m => m.User.FullName.Contains(nameHint, StringComparison.OrdinalIgnoreCase));
        }

        private async Task<WorkspaceMember> RequireMembershipAsync(int userId, int workspaceId)
        {
            var membership = await _unitOfWork.WorkspaceMembers.GetAsync(workspaceId, userId);
            if (membership is null)
                throw new UnauthorizedAccessException("You are not a member of this workspace.");
            return membership;
        }

        private async Task RequireMeetingEditRightsAsync(int userId, Meeting meeting)
        {
            if (meeting.CreatedBy == userId) return;

            var membership = await _unitOfWork.WorkspaceMembers.GetAsync(meeting.WorkspaceId, userId);
            if (membership is null || membership.Role != WorkspaceRoles.Owner)
                throw new UnauthorizedAccessException("Only the meeting's creator or the workspace owner can do this.");
        }

        private async Task<Meeting> GetMeetingOrThrowAsync(int meetingId) =>
            await _unitOfWork.Meetings.GetByIdAsync(meetingId)
                ?? throw new KeyNotFoundException("Meeting not found.");

        private async Task<TaskDraft> GetDraftOrThrowAsync(int draftId, int expectedMeetingId)
        {
            var draft = await _unitOfWork.TaskDrafts.GetByIdAsync(draftId)
                ?? throw new KeyNotFoundException("Task draft not found.");

            if (draft.MeetingId != expectedMeetingId)
                throw new KeyNotFoundException("Task draft not found.");

            return draft;
        }

        private static TaskDraftDto ToDraftDto(TaskDraft d) => new()
        {
            Id = d.Id,
            MeetingId = d.MeetingId,
            Title = d.Title,
            Description = d.Description,
            AssigneeNameRaw = d.AssigneeNameRaw,
            DecisionIndexRaw = d.DecisionIndexRaw,
            AssignedTo = d.AssignedTo,
            AssignedToName = d.AssignedToNavigation?.FullName,
            DecisionId = d.DecisionId,
            DecisionDescription = d.Decision?.Description,
            Priority = d.Priority,
            DueDate = d.DueDate,
            CreatedAt = d.CreatedAt
        };
    }
}
