using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssessmentSystem.DataAccess.Configurations;

public class ConfiguracionUsuario : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Nombres).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Apellidos).IsRequired().HasMaxLength(100);
        builder.Property(u => u.CorreoElectronico).IsRequired().HasMaxLength(150);
        builder.HasIndex(u => u.CorreoElectronico).IsUnique();

        builder.Property(u => u.ClaveHash).IsRequired();

        builder.HasOne(u => u.Rol)
               .WithMany(r => r.Usuarios)
               .HasForeignKey(u => u.RolId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.ProgramaAcademico)
               .WithMany()
               .HasForeignKey(u => u.ProgramaAcademicoId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
