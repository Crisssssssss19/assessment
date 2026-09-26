using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Core.Entities;

public class PlanAssessment : EntidadBase
{
    public Guid PeriodoAcademicoId { get; set; }
    public PeriodoAcademico PeriodoAcademico { get; set; } = null!;

    public Guid? ProgramaAcademicoId { get; set; }
    public ProgramaAcademico? ProgramaAcademico { get; set; }

    public Guid LiderProgramaId { get; set; }
    public Usuario LiderPrograma { get; set; } = null!;

    public EstadoEvaluacion Estado { get; set; } = EstadoEvaluacion.Pendiente;
    public ICollection<AsignaturaPlanAssessment> AsignaturasPlan { get; set; } = new List<AsignaturaPlanAssessment>();
}
