namespace AssessmentSystem.Core.Entities;

public class Asignatura : EntidadBase
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int Creditos { get; set; }
    public int Semestre { get; set; }

    public Guid? ProgramaAcademicoId { get; set; }
    public ProgramaAcademico? ProgramaAcademico { get; set; }

    public ICollection<AsignaturaPlanAssessment> AsignaturasPlan { get; set; } = new List<AsignaturaPlanAssessment>();
}
