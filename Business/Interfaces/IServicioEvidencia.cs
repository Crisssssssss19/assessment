using AssessmentSystem.Business.DTOs.Medicion;

namespace AssessmentSystem.Business.Interfaces;

public interface IServicioEvidencia
{
    Task<EvidenciaDto> CargarEvidenciaAsync(Guid medicionId, Stream flujoArchivo, string nombreArchivo, string tipoContenido, Guid usuarioDocenteId);
    Task<(Stream FlujoArchivo, string TipoContenido, string NombreArchivo)> DescargarEvidenciaAsync(Guid evidenciaId);
    Task<bool> EliminarEvidenciaAsync(Guid evidenciaId, Guid usuarioDocenteId);
}
