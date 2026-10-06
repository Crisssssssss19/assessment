using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionPlanAssessment : IEntityTypeConfiguration<PlanAssessment>
{
    public void Configure(EntityTypeBuilder<PlanAssessment> builder)
    {
        builder.ToTable("PlanesAssessment");
        builder.HasKey(p => p.Id);

        // Clave única compuesta: Periodo + Programa
        builder.HasIndex(p => new { p.PeriodoAcademicoId, p.ProgramaAcademicoId });

        builder.HasOne(p => p.PeriodoAcademico)
               .WithMany(ap => ap.PlanesAssessment)
               .HasForeignKey(p => p.PeriodoAcademicoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.ProgramaAcademico)
               .WithMany(pa => pa.PlanesAssessment)
               .HasForeignKey(p => p.ProgramaAcademicoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.LiderPrograma)
               .WithMany()
               .HasForeignKey(p => p.LiderProgramaId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
