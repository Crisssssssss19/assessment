using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.Core.Exceptions;
using AssessmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.Business.Services;

public class ServicioMedicion : IServicioMedicion
{
    private readonly IRepositorio<Medicion> _repositorioMedicion;
    private readonly IRepositorio<AsignaturaPlanAssessment> _repositorioAsignaturaPlan;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;

    public ServicioMedicion(
        IRepositorio<Medicion> repositorioMedicion,
        IRepositorio<AsignaturaPlanAssessment> repositorioAsignaturaPlan,
        IUnidadDeTrabajo unidadDeTrabajo)
    {
        _repositorioMedicion = repositorioMedicion;
        _repositorioAsignaturaPlan = repositorioAsignaturaPlan;
        _unidadDeTrabajo = unidadDeTrabajo;
    }

    public async Task<MedicionRespuestaDto> RegistrarMedicionAsync(CrearMedicionDto dto, Guid usuarioDocenteId)
    {
        var asignaturaPlan = await _repositorioAsignaturaPlan.Consultar()
            .FirstOrDefaultAsync(ap => ap.Id == dto.AsignaturaPlanAssessmentId && ap.EstaActivo);

        if (asignaturaPlan == null)
            throw new NoEncontradoException("La asignación de la asignatura especificada no existe.");

        if (asignaturaPlan.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente asignado a este curso puede registrar la medición.");

        var totalEstudiantes = dto.CantidadNivel0a59 + dto.CantidadNivel60a69 + dto.CantidadNivel70a89 + dto.CantidadNivel90a100;
        if (totalEstudiantes <= 0)
            throw new ReglaNegocioException("El número total de estudiantes evaluados debe ser mayor a 0.");

        if (string.IsNullOrWhiteSpace(dto.AnalisisCualitativo))
            throw new ReglaNegocioException("El análisis cualitativo es obligatorio.");

        if (string.IsNullOrWhiteSpace(dto.PlanMejora))
            throw new ReglaNegocioException("El plan de mejora es obligatorio.");

        var medicionExistente = await _repositorioMedicion.Consultar()
            .FirstOrDefaultAsync(m => m.AsignaturaPlanAssessmentId == dto.AsignaturaPlanAssessmentId && m.EstaActivo);

        Medicion medicion;
        if (medicionExistente != null)
        {
            if (medicionExistente.Estado == EstadoEvaluacion.Aprobado)
                throw new ReglaNegocioException("No se puede modificar una medición que ya ha sido aprobada.");

            medicionExistente.CantidadNivel0a59 = dto.CantidadNivel0a59;
            medicionExistente.CantidadNivel60a69 = dto.CantidadNivel60a69;
            medicionExistente.CantidadNivel70a89 = dto.CantidadNivel70a89;
            medicionExistente.CantidadNivel90a100 = dto.CantidadNivel90a100;
            medicionExistente.TotalEstudiantesEvaluados = totalEstudiantes;
            medicionExistente.AnalisisCualitativo = dto.AnalisisCualitativo;
            medicionExistente.PlanMejora = dto.PlanMejora;
            medicionExistente.Estado = EstadoEvaluacion.EnRevision;
            _repositorioMedicion.Actualizar(medicionExistente);
            medicion = medicionExistente;
        }
        else
        {
            medicion = new Medicion
            {
                AsignaturaPlanAssessmentId = dto.AsignaturaPlanAssessmentId,
                CantidadNivel0a59 = dto.CantidadNivel0a59,
                CantidadNivel60a69 = dto.CantidadNivel60a69,
                CantidadNivel70a89 = dto.CantidadNivel70a89,
                CantidadNivel90a100 = dto.CantidadNivel90a100,
                TotalEstudiantesEvaluados = totalEstudiantes,
                AnalisisCualitativo = dto.AnalisisCualitativo,
                PlanMejora = dto.PlanMejora,
                Estado = EstadoEvaluacion.EnRevision
            };
            await _repositorioMedicion.AgregarAsync(medicion);
        }

        await _unidadDeTrabajo.GuardarCambiosAsync();
        return await ObtenerPorIdAsync(medicion.Id);
    }

    public async Task<MedicionRespuestaDto> RevisarMedicionAsync(Guid medicionId, RevisarMedicionDto dto, Guid usuarioLiderCalidadId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(m => m.Id == medicionId && m.EstaActivo);

        if (medicion == null)
            throw new NoEncontradoException("La medición especificada no existe.");

        if (medicion.AsignaturaPlanAssessment.LiderCalidadRaId != usuarioLiderCalidadId)
            throw new ReglaNegocioException("Solo el Líder de Calidad asignado a este Resultado de Aprendizaje puede revisar esta medición.");

        if (!dto.Aprobado && string.IsNullOrWhiteSpace(dto.Observaciones))
            throw new ReglaNegocioException("Las observaciones son obligatorias cuando se devuelve un informe de medición.");

        medicion.Estado = dto.Aprobado ? EstadoEvaluacion.Aprobado : EstadoEvaluacion.Devuelto;
        medicion.ObservacionesRevision = dto.Observaciones;
        medicion.FechaRevision = DateTime.UtcNow;

        _repositorioMedicion.Actualizar(medicion);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return await ObtenerPorIdAsync(medicion.Id);
    }

    public async Task<MedicionRespuestaDto> ObtenerPorIdAsync(Guid medicionId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.Evidencias)
            .FirstOrDefaultAsync(m => m.Id == medicionId && m.EstaActivo);

        if (medicion == null)
            throw new NoEncontradoException("La medición solicitada no existe.");

        return MapearADto(medicion);
    }

    public async Task<MedicionRespuestaDto?> ObtenerPorAsignaturaPlanIdAsync(Guid asignaturaPlanId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.Evidencias)
            .FirstOrDefaultAsync(m => m.AsignaturaPlanAssessmentId == asignaturaPlanId && m.EstaActivo);

        return medicion == null ? null : MapearADto(medicion);
    }

    private static MedicionRespuestaDto MapearADto(Medicion m)
    {
        var total = m.TotalEstudiantesEvaluados > 0 ? m.TotalEstudiantesEvaluados : 1;
        return new MedicionRespuestaDto(
            m.Id,
            m.AsignaturaPlanAssessmentId,
            m.CantidadNivel0a59,
            m.CantidadNivel60a69,
            m.CantidadNivel70a89,
            m.CantidadNivel90a100,
            m.TotalEstudiantesEvaluados,
            Math.Round((double)m.CantidadNivel0a59 / total * 100, 2),
            Math.Round((double)m.CantidadNivel60a69 / total * 100, 2),
            Math.Round((double)m.CantidadNivel70a89 / total * 100, 2),
            Math.Round((double)m.CantidadNivel90a100 / total * 100, 2),
            m.AnalisisCualitativo,
            m.PlanMejora,
            m.Estado,
            m.ObservacionesRevision,
            m.FechaRevision,
            m.Evidencias.Where(e => e.EstaActivo).Select(e => new EvidenciaDto(
                e.Id,
                e.NombreArchivo,
                e.UriBlob,
                e.TipoContenido,
                e.TamanoArchivoBytes
            )).ToList()
        );
    }
}
