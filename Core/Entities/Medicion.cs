using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Core.Entities;

public class Medicion : EntidadBase
{
    public Guid AsignaturaPlanAssessmentId { get; set; }
    public AsignaturaPlanAssessment AsignaturaPlanAssessment { get; set; } = null!;

    // Estudiantes por rangos de cumplimiento
    public int CantidadNivel0a59 { get; set; }
    public int CantidadNivel60a69 { get; set; }
    public int CantidadNivel70a89 { get; set; }
    public int CantidadNivel90a100 { get; set; }
    public int TotalEstudiantesEvaluados { get; set; }

    public string AnalisisCualitativo { get; set; } = string.Empty;
    public string PlanMejora { get; set; } = string.Empty;

    public EstadoEvaluacion Estado { get; set; } = EstadoEvaluacion.Pendiente;
    public string? ObservacionesRevision { get; set; }
    public DateTime? FechaRevision { get; set; }

    public ICollection<Evidencia> Evidencias { get; set; } = new List<Evidencia>();
}
