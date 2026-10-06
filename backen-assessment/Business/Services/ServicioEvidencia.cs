using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Exceptions;
using AssessmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.Business.Services;

public class ServicioEvidencia : IServicioEvidencia
{
    private readonly IRepositorio<Evidencia> _repositorioEvidencia;
    private readonly IRepositorio<Medicion> _repositorioMedicion;
    private readonly IServicioAlmacenamientoBlob _servicioAlmacenamientoBlob;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private const string NombreContenedor = "assessment-evidencias";

    public ServicioEvidencia(
        IRepositorio<Evidencia> repositorioEvidencia,
        IRepositorio<Medicion> repositorioMedicion,
        IServicioAlmacenamientoBlob servicioAlmacenamientoBlob,
        IUnidadDeTrabajo unidadDeTrabajo)
    {
        _repositorioEvidencia = repositorioEvidencia;
        _repositorioMedicion = repositorioMedicion;
        _servicioAlmacenamientoBlob = servicioAlmacenamientoBlob;
        _unidadDeTrabajo = unidadDeTrabajo;
    }

    public async Task<EvidenciaDto> CargarEvidenciaAsync(Guid medicionId, Stream flujoArchivo, string nombreArchivo, string tipoContenido, Guid usuarioDocenteId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(m => m.Id == medicionId && m.EstaActivo);

        if (medicion == null)
            throw new NoEncontradoException("La medición especificada no existe.");

        if (medicion.AsignaturaPlanAssessment.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente a cargo puede subir evidencias a esta medición.");

        var uriBlob = await _servicioAlmacenamientoBlob.CargarArchivoAsync(flujoArchivo, nombreArchivo, tipoContenido, NombreContenedor);

        var evidencia = new Evidencia
        {
            MedicionId = medicionId,
            NombreArchivo = nombreArchivo,
            UriBlob = uriBlob,
            TipoContenido = tipoContenido,
            TamanoArchivoBytes = flujoArchivo.Length
        };

        await _repositorioEvidencia.AgregarAsync(evidencia);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return new EvidenciaDto(
            evidencia.Id,
            evidencia.NombreArchivo,
            evidencia.UriBlob,
            evidencia.TipoContenido,
            evidencia.TamanoArchivoBytes
        );
    }

    public async Task<(Stream FlujoArchivo, string TipoContenido, string NombreArchivo)> DescargarEvidenciaAsync(Guid evidenciaId)
    {
        var evidencia = await _repositorioEvidencia.ObtenerPorIdAsync(evidenciaId);
        if (evidencia == null || !evidencia.EstaActivo)
            throw new NoEncontradoException("La evidencia solicitada no existe.");

        var flujo = await _servicioAlmacenamientoBlob.DescargarArchivoAsync(evidencia.UriBlob, NombreContenedor);
        return (flujo, evidencia.TipoContenido, evidencia.NombreArchivo);
    }

    public async Task<bool> EliminarEvidenciaAsync(Guid evidenciaId, Guid usuarioDocenteId)
    {
        var evidencia = await _repositorioEvidencia.Consultar()
            .Include(e => e.Medicion)
                .ThenInclude(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(e => e.Id == evidenciaId && e.EstaActivo);

        if (evidencia == null)
            throw new NoEncontradoException("La evidencia solicitada no existe.");

        if (evidencia.Medicion.AsignaturaPlanAssessment.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente a cargo puede eliminar esta evidencia.");

        await _servicioAlmacenamientoBlob.EliminarArchivoAsync(evidencia.UriBlob, NombreContenedor);
        _repositorioEvidencia.Eliminar(evidencia);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return true;
    }
}
