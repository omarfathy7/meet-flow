using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetFlow_DAL.Entities;

namespace MeetFlow_DAL.Configurations;

public class TaskDraftConfiguration : IEntityTypeConfiguration<TaskDraft>
{
    public void Configure(EntityTypeBuilder<TaskDraft> entity)
    {
        entity.HasKey(e => e.Id).HasName("PK__TaskDrafts");

        entity.Property(e => e.Title).HasMaxLength(200);
        entity.Property(e => e.AssigneeNameRaw).HasMaxLength(150);
        entity.Property(e => e.Priority).HasMaxLength(50).HasDefaultValue("Medium");
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

        entity.HasOne(d => d.Meeting).WithMany(m => m.TaskDrafts)
            .HasForeignKey(d => d.MeetingId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_TaskDrafts_Meetings");

        entity.HasOne(d => d.AssignedToNavigation).WithMany(u => u.TaskDrafts)
            .HasForeignKey(d => d.AssignedTo)
            .OnDelete(DeleteBehavior.SetNull)
            .HasConstraintName("FK_TaskDrafts_Users");

        entity.HasOne(d => d.Decision).WithMany(dec => dec.TaskDrafts)
            .HasForeignKey(d => d.DecisionId)
            .OnDelete(DeleteBehavior.SetNull)
            .HasConstraintName("FK_TaskDrafts_Decisions");
    }
}
