using AssessmentSystem.Business.DTOs.Medicion;

namespace AssessmentSystem.Business.Interfaces;

public interface IServicioMedicion
{
    Task<MedicionRespuestaDto> RegistrarMedicionAsync(CrearMedicionDto dto, Guid usuarioDocenteId);
    Task<MedicionRespuestaDto> RevisarMedicionAsync(Guid medicionId, RevisarMedicionDto dto, Guid usuarioLiderCalidadId);
    Task<MedicionRespuestaDto> ObtenerPorIdAsync(Guid medicionId);
    Task<MedicionRespuestaDto?> ObtenerPorAsignaturaPlanIdAsync(Guid asignaturaPlanId);
    Task<ObservacionMedicionRespuestaDto> AgregarObservacionAsync(Guid medicionId, CrearObservacionDto dto, Guid usuarioId);
    Task<List<ObservacionMedicionRespuestaDto>> ObtenerHistorialObservacionesAsync(Guid medicionId);
}
