using AssessmentSystem.Business.DTOs.PlanAssessment;

namespace AssessmentSystem.Business.Interfaces;

public interface IServicioPlanAssessment
{
    Task<PlanAssessmentRespuestaDto> CrearPlanAssessmentAsync(CrearPlanAssessmentDto dto, Guid usuarioActualId);
    Task<PlanAssessmentRespuestaDto> ObtenerPorIdAsync(Guid id);
    Task<PlanAssessmentRespuestaDto?> ObtenerPorPeriodoAcademicoAsync(Guid periodoAcademicoId);
}
