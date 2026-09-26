using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionIndicadorDesempeno : IEntityTypeConfiguration<IndicadorDesempeno>
{
    public void Configure(EntityTypeBuilder<IndicadorDesempeno> builder)
    {
        builder.ToTable("IndicadoresDesempeno");
        builder.HasKey(id => id.Id);

        builder.Property(id => id.Codigo).IsRequired().HasMaxLength(20);
        builder.Property(id => id.Descripcion).IsRequired().HasMaxLength(1000);

        builder.HasOne(id => id.AsignaturaPlanAssessment)
               .WithMany(ap => ap.IndicadoresDesempeno)
               .HasForeignKey(id => id.AsignaturaPlanAssessmentId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
