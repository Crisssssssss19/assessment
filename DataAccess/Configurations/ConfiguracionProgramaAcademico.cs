using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionProgramaAcademico : IEntityTypeConfiguration<ProgramaAcademico>
{
    public void Configure(EntityTypeBuilder<ProgramaAcademico> builder)
    {
        builder.ToTable("ProgramasAcademicos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Codigo).IsRequired().HasMaxLength(20);
        builder.HasIndex(p => p.Codigo).IsUnique();

        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(p => p.Facultad).IsRequired().HasMaxLength(150);
    }
}
