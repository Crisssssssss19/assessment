namespace AssessmentSystem.Core.Entities;

public class PeriodoAcademico : EntidadBase
{
    public string Codigo { get; set; } = string.Empty; // Ej. "2026-1"
    public string Nombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public bool EsActual { get; set; }
    public ICollection<PlanAssessment> PlanesAssessment { get; set; } = new List<PlanAssessment>();
}
