using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionMedicion : IEntityTypeConfiguration<Medicion>
{
    public void Configure(EntityTypeBuilder<Medicion> builder)
    {
        builder.ToTable("Mediciones");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.AnalisisCualitativo).IsRequired().HasMaxLength(4000);
        builder.Property(m => m.PlanMejora).IsRequired().HasMaxLength(4000);
        builder.Property(m => m.ObservacionesRevision).HasMaxLength(4000);
    }
}
