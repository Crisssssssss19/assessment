using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionAsignaturaPlanAssessment : IEntityTypeConfiguration<AsignaturaPlanAssessment>
{
    public void Configure(EntityTypeBuilder<AsignaturaPlanAssessment> builder)
    {
        builder.ToTable("AsignaturasPlanAssessment");
        builder.HasKey(apc => apc.Id);

        // Clave única: Un RA no puede repetir el mismo rol de evaluación dentro de un mismo plan
        builder.HasIndex(apc => new { apc.PlanAssessmentId, apc.ResultadoAprendizajeId, apc.RolEvaluacion })
               .IsUnique();

        builder.Property(apc => apc.Semestre).IsRequired();
        builder.Property(apc => apc.MetaLogroPorcentaje).IsRequired();

        builder.HasOne(apc => apc.PlanAssessment)
               .WithMany(ap => ap.AsignaturasPlan)
               .HasForeignKey(apc => apc.PlanAssessmentId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(apc => apc.ResultadoAprendizaje)
               .WithMany(lo => lo.AsignaturasPlan)
               .HasForeignKey(apc => apc.ResultadoAprendizajeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(apc => apc.Asignatura)
               .WithMany(c => c.AsignaturasPlan)
               .HasForeignKey(apc => apc.AsignaturaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(apc => apc.Docente)
               .WithMany()
               .HasForeignKey(apc => apc.DocenteId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(apc => apc.LiderCalidadRa)
               .WithMany()
               .HasForeignKey(apc => apc.LiderCalidadRaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(apc => apc.Medicion)
               .WithOne(m => m.AsignaturaPlanAssessment)
               .HasForeignKey<Medicion>(m => m.AsignaturaPlanAssessmentId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(apc => apc.IndicadoresDesempeno)
               .WithOne(id => id.AsignaturaPlanAssessment)
               .HasForeignKey(id => id.AsignaturaPlanAssessmentId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
