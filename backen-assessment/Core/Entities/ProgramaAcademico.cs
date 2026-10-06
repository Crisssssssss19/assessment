namespace AssessmentSystem.Core.Entities;

public class ProgramaAcademico : EntidadBase
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Facultad { get; set; } = "Facultad de Ingeniería";
    public ICollection<PlanAssessment> PlanesAssessment { get; set; } = new List<PlanAssessment>();
}
