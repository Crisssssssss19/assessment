using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionEvaluacionEstudiante : IEntityTypeConfiguration<EvaluacionEstudiante>
{
    public void Configure(EntityTypeBuilder<EvaluacionEstudiante> builder)
    {
        builder.ToTable("EvaluacionesEstudiantes");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CodigoEstudiante).IsRequired().HasMaxLength(50);
        builder.Property(e => e.NombreEstudiante).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Calificacion).HasPrecision(5, 2).IsRequired();

        builder.Property(e => e.NombreArchivoEvidencia).HasMaxLength(255);
        builder.Property(e => e.UriBlobEvidencia).HasMaxLength(1000);
        builder.Property(e => e.TipoContenidoEvidencia).HasMaxLength(100);
        builder.Property(e => e.Observaciones).HasMaxLength(1000);

        builder.HasOne(e => e.Medicion)
               .WithMany(m => m.EvaluacionesEstudiantes)
               .HasForeignKey(e => e.MedicionId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
