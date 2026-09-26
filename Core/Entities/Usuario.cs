namespace AssessmentSystem.Core.Entities;

public class Usuario : EntidadBase
{
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string ClaveHash { get; set; } = string.Empty;

    public Guid RolId { get; set; }
    public Rol Rol { get; set; } = null!;

    // Si el usuario es Líder de Programa, se asocia a su programa académico asignado
    public Guid? ProgramaAcademicoId { get; set; }
    public ProgramaAcademico? ProgramaAcademico { get; set; }
}
