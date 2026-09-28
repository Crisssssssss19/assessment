namespace AssessmentSystem.Business.DTOs.Medicion;

public record ItemEstudianteDto(
    string CodigoEstudiante,
    string NombreEstudiante,
    decimal Calificacion,
    string? Observaciones
);

public record RegistrarEstudiantesMedicionDto(
    List<ItemEstudianteDto> Estudiantes
);

public record EvaluacionEstudianteRespuestaDto(
    Guid Id,
    Guid MedicionId,
    string CodigoEstudiante,
    string NombreEstudiante,
    decimal Calificacion,
    string RangoDesempeno,
    string? NombreArchivoEvidencia,
    string? UriBlobEvidencia,
    string? TipoContenidoEvidencia,
    long? TamanoArchivoBytes,
    string? Observaciones
);
