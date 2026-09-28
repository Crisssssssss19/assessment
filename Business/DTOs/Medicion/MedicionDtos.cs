using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Business.DTOs.Medicion;

public record CrearMedicionDto(
    Guid AsignaturaPlanAssessmentId,
    int CantidadNivel0a59,
    int CantidadNivel60a69,
    int CantidadNivel70a89,
    int CantidadNivel90a100,
    string AnalisisCualitativo,
    string PlanMejora
);

public record RevisarMedicionDto(
    bool Aprobado,
    string? Observaciones,
    string? PlanMejora = null
);

public record EvidenciaDto(
    Guid Id,
    string NombreArchivo,
    string UriBlob,
    string TipoContenido,
    long TamanoArchivoBytes
);

public record MedicionRespuestaDto(
    Guid Id,
    Guid AsignaturaPlanAssessmentId,
    int CantidadNivel0a59,
    int CantidadNivel60a69,
    int CantidadNivel70a89,
    int CantidadNivel90a100,
    int TotalEstudiantesEvaluados,
    double PorcentajeNivel0a59,
    double PorcentajeNivel60a69,
    double PorcentajeNivel70a89,
    double PorcentajeNivel90a100,
    string AnalisisCualitativo,
    string PlanMejora,
    EstadoEvaluacion Estado,
    string? ObservacionesRevision,
    DateTime? FechaRevision,
    List<EvidenciaDto> Evidencias
);
