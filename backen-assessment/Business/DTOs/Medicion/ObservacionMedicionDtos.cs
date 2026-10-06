using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Business.DTOs.Medicion;

public record CrearObservacionDto(
    string Contenido,
    EstadoEvaluacion? NuevoEstado = null
);

public record ObservacionMedicionRespuestaDto(
    Guid Id,
    Guid MedicionId,
    Guid UsuarioId,
    string NombreAutor,
    string CorreoAutor,
    string RolEmisor,
    string Contenido,
    EstadoEvaluacion EstadoResultante,
    DateTime FechaCreacion
);
