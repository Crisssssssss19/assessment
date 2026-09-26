using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionEvidencia : IEntityTypeConfiguration<Evidencia>
{
    public void Configure(EntityTypeBuilder<Evidencia> builder)
    {
        builder.ToTable("Evidencias");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.NombreArchivo).IsRequired().HasMaxLength(255);
        builder.Property(e => e.UriBlob).IsRequired().HasMaxLength(1000);
        builder.Property(e => e.TipoContenido).IsRequired().HasMaxLength(100);

        builder.HasOne(e => e.Medicion)
               .WithMany(m => m.Evidencias)
               .HasForeignKey(e => e.MedicionId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
