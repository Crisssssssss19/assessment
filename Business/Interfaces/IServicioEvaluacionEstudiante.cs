using AssessmentSystem.Business.DTOs.Medicion;

namespace AssessmentSystem.Business.Interfaces;

public interface IServicioEvaluacionEstudiante
{
    Task<List<EvaluacionEstudianteRespuestaDto>> RegistrarEstudiantesAsync(Guid medicionId, RegistrarEstudiantesMedicionDto dto, Guid usuarioDocenteId);
    Task<List<EvaluacionEstudianteRespuestaDto>> ObtenerEstudiantesPorMedicionAsync(Guid medicionId);
    Task<EvaluacionEstudianteRespuestaDto> CargarEvidenciaEstudianteAsync(Guid evaluacionEstudianteId, Stream flujoArchivo, string nombreArchivo, string tipoContenido, Guid usuarioDocenteId);
    Task<(Stream FlujoArchivo, string TipoContenido, string NombreArchivo)> DescargarEvidenciaEstudianteAsync(Guid evaluacionEstudianteId);
    Task<bool> EliminarEvidenciaEstudianteAsync(Guid evaluacionEstudianteId, Guid usuarioDocenteId);
}
