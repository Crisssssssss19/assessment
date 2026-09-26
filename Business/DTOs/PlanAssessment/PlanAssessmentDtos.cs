using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Business.DTOs.PlanAssessment;

public record CrearIndicadorDesempenoDto(
    string Codigo, // Ej. "ID1", "ID2", "ID3"
    string Descripcion
);

public record ElementoAsignaturaPlanDto(
    Guid ResultadoAprendizajeId,
    Guid AsignaturaId,
    RolEvaluacionAsignatura RolEvaluacion,
    int Semestre,
    double MetaLogroPorcentaje,
    Guid DocenteId,
    Guid LiderCalidadRaId,
    List<CrearIndicadorDesempenoDto> Indicadores
);

public record CrearPlanAssessmentDto(
    Guid PeriodoAcademicoId,
    Guid? ProgramaAcademicoId,
    List<ElementoAsignaturaPlanDto> Asignaturas
);

public record DetalleIndicadorDesempenoDto(
    Guid Id,
    string Codigo,
    string Descripcion
);

public record DetalleAsignaturaPlanDto(
    Guid Id,
    Guid ResultadoAprendizajeId,
    string CodigoResultadoAprendizaje,
    Guid AsignaturaId,
    string CodigoAsignatura,
    string NombreAsignatura,
    RolEvaluacionAsignatura RolEvaluacion,
    int Semestre,
    double MetaLogroPorcentaje,
    Guid DocenteId,
    string NombreDocente,
    Guid LiderCalidadRaId,
    string NombreLiderCalidadRa,
    List<DetalleIndicadorDesempenoDto> Indicadores
);

public record PlanAssessmentRespuestaDto(
    Guid Id,
    Guid PeriodoAcademicoId,
    string CodigoPeriodoAcademico,
    Guid? ProgramaAcademicoId,
    string? NombrePrograma,
    EstadoEvaluacion Estado,
    int TotalAsignaturasConfiguradas,
    DateTime FechaCreacion,
    List<DetalleAsignaturaPlanDto> Asignaturas
);
