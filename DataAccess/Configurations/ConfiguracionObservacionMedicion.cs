using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionObservacionMedicion : IEntityTypeConfiguration<ObservacionMedicion>
{
    public void Configure(EntityTypeBuilder<ObservacionMedicion> builder)
    {
        builder.ToTable("ObservacionesMediciones");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.RolEmisor).IsRequired().HasMaxLength(50);
        builder.Property(o => o.Contenido).IsRequired().HasMaxLength(4000);

        builder.HasOne(o => o.Medicion)
               .WithMany(m => m.ObservacionesHistorial)
               .HasForeignKey(o => o.MedicionId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Usuario)
               .WithMany()
               .HasForeignKey(o => o.UsuarioId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
