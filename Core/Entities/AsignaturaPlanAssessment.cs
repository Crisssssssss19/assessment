using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Core.Entities;

public class AsignaturaPlanAssessment : EntidadBase
{
    public Guid PlanAssessmentId { get; set; }
    public PlanAssessment PlanAssessment { get; set; } = null!;

    public Guid ResultadoAprendizajeId { get; set; }
    public ResultadoAprendizaje ResultadoAprendizaje { get; set; } = null!;

    public Guid AsignaturaId { get; set; }
    public Asignatura Asignatura { get; set; } = null!;

    public RolEvaluacionAsignatura RolEvaluacion { get; set; } // Formativa1, Formativa2, Sumativa

    public int Semestre { get; set; } // Semestre del curso (1 a 10)
    public double MetaLogroPorcentaje { get; set; } // Meta de logro que aplica para los 3 indicadores (ej. 70.0%)

    public Guid DocenteId { get; set; }
    public Usuario Docente { get; set; } = null!;

    public Guid LiderCalidadRaId { get; set; }
    public Usuario LiderCalidadRa { get; set; } = null!;

    public ICollection<IndicadorDesempeno> IndicadoresDesempeno { get; set; } = new List<IndicadorDesempeno>();
    public Medicion? Medicion { get; set; }
}
