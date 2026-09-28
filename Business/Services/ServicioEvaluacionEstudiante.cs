using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.Core.Exceptions;
using AssessmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.Business.Services;

public class ServicioEvaluacionEstudiante : IServicioEvaluacionEstudiante
{
    private readonly IRepositorio<EvaluacionEstudiante> _repositorioEvaluacion;
    private readonly IRepositorio<Medicion> _repositorioMedicion;
    private readonly IServicioAlmacenamientoBlob _servicioAlmacenamientoBlob;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;
    private const string NombreContenedor = "assessment-evidencias";

    public ServicioEvaluacionEstudiante(
        IRepositorio<EvaluacionEstudiante> repositorioEvaluacion,
        IRepositorio<Medicion> repositorioMedicion,
        IServicioAlmacenamientoBlob servicioAlmacenamientoBlob,
        IUnidadDeTrabajo unidadDeTrabajo)
    {
        _repositorioEvaluacion = repositorioEvaluacion;
        _repositorioMedicion = repositorioMedicion;
        _servicioAlmacenamientoBlob = servicioAlmacenamientoBlob;
        _unidadDeTrabajo = unidadDeTrabajo;
    }

    public async Task<List<EvaluacionEstudianteRespuestaDto>> RegistrarEstudiantesAsync(
        Guid medicionId,
        RegistrarEstudiantesMedicionDto dto,
        Guid usuarioDocenteId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.AsignaturaPlanAssessment)
            .Include(m => m.EvaluacionesEstudiantes)
            .FirstOrDefaultAsync(m => m.Id == medicionId && m.EstaActivo);

        if (medicion == null)
            throw new NoEncontradoException("La medición especificada no existe.");

        if (medicion.AsignaturaPlanAssessment.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente a cargo puede registrar las notas de los estudiantes.");

        if (medicion.Estado == EstadoEvaluacion.Aprobado)
            throw new ReglaNegocioException("No se pueden modificar las notas de una medición aprobada.");

        if (dto.Estudiantes == null || dto.Estudiantes.Count == 0)
            throw new ReglaNegocioException("Debe ingresar al menos un estudiante.");

        var estudiantesExistentes = medicion.EvaluacionesEstudiantes.Where(e => e.EstaActivo).ToList();

        int count0a59 = 0;
        int count60a69 = 0;
        int count70a89 = 0;
        int count90a100 = 0;

        foreach (var item in dto.Estudiantes)
        {
            if (string.IsNullOrWhiteSpace(item.CodigoEstudiante))
                throw new ReglaNegocioException("El código del estudiante es obligatorio.");

            if (string.IsNullOrWhiteSpace(item.NombreEstudiante))
                throw new ReglaNegocioException("El nombre del estudiante es obligatorio.");

            if (item.Calificacion < 0 || item.Calificacion > 100)
                throw new ReglaNegocioException($"La calificación de {item.NombreEstudiante} ({item.Calificacion}) debe estar entre 0 y 100.");

            if (item.Calificacion < 60) count0a59++;
            else if (item.Calificacion < 70) count60a69++;
            else if (item.Calificacion < 90) count70a89++;
            else count90a100++;

            var estudianteDb = estudiantesExistentes.FirstOrDefault(e => e.CodigoEstudiante == item.CodigoEstudiante.Trim());
            if (estudianteDb != null)
            {
                estudianteDb.NombreEstudiante = item.NombreEstudiante.Trim();
                estudianteDb.Calificacion = item.Calificacion;
                estudianteDb.Observaciones = item.Observaciones;
                _repositorioEvaluacion.Actualizar(estudianteDb);
            }
            else
            {
                var nuevoEstudiante = new EvaluacionEstudiante
                {
                    MedicionId = medicionId,
                    CodigoEstudiante = item.CodigoEstudiante.Trim(),
                    NombreEstudiante = item.NombreEstudiante.Trim(),
                    Calificacion = item.Calificacion,
                    Observaciones = item.Observaciones
                };
                await _repositorioEvaluacion.AgregarAsync(nuevoEstudiante);
            }
        }

        // Actualizar totales y rangos automáticamente en la Medición
        medicion.CantidadNivel0a59 = count0a59;
        medicion.CantidadNivel60a69 = count60a69;
        medicion.CantidadNivel70a89 = count70a89;
        medicion.CantidadNivel90a100 = count90a100;
        medicion.TotalEstudiantesEvaluados = dto.Estudiantes.Count;

        _repositorioMedicion.Actualizar(medicion);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return await ObtenerEstudiantesPorMedicionAsync(medicionId);
    }

    public async Task<List<EvaluacionEstudianteRespuestaDto>> ObtenerEstudiantesPorMedicionAsync(Guid medicionId)
    {
        var estudiantes = await _repositorioEvaluacion.Consultar()
            .Where(e => e.MedicionId == medicionId && e.EstaActivo)
            .OrderBy(e => e.NombreEstudiante)
            .ToListAsync();

        return estudiantes.Select(MapearADto).ToList();
    }

    public async Task<EvaluacionEstudianteRespuestaDto> CargarEvidenciaEstudianteAsync(
        Guid evaluacionEstudianteId,
        Stream flujoArchivo,
        string nombreArchivo,
        string tipoContenido,
        Guid usuarioDocenteId)
    {
        var evaluacion = await _repositorioEvaluacion.Consultar()
            .Include(e => e.Medicion)
                .ThenInclude(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(e => e.Id == evaluacionEstudianteId && e.EstaActivo);

        if (evaluacion == null)
            throw new NoEncontradoException("La evaluación del estudiante no existe.");

        if (evaluacion.Medicion.AsignaturaPlanAssessment.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente a cargo puede subir evidencias a este estudiante.");

        if (evaluacion.Medicion.Estado == EstadoEvaluacion.Aprobado)
            throw new ReglaNegocioException("No se pueden modificar evidencias de una medición aprobada.");

        // Si ya tenía archivo previo, eliminarlo del blob storage
        if (!string.IsNullOrWhiteSpace(evaluacion.UriBlobEvidencia))
        {
            await _servicioAlmacenamientoBlob.EliminarArchivoAsync(evaluacion.UriBlobEvidencia, NombreContenedor);
        }

        var uriBlob = await _servicioAlmacenamientoBlob.CargarArchivoAsync(flujoArchivo, nombreArchivo, tipoContenido, NombreContenedor);

        evaluacion.NombreArchivoEvidencia = nombreArchivo;
        evaluacion.UriBlobEvidencia = uriBlob;
        evaluacion.TipoContenidoEvidencia = tipoContenido;
        evaluacion.TamanoArchivoBytes = flujoArchivo.Length;

        _repositorioEvaluacion.Actualizar(evaluacion);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return MapearADto(evaluacion);
    }

    public async Task<(Stream FlujoArchivo, string TipoContenido, string NombreArchivo)> DescargarEvidenciaEstudianteAsync(Guid evaluacionEstudianteId)
    {
        var evaluacion = await _repositorioEvaluacion.ObtenerPorIdAsync(evaluacionEstudianteId);
        if (evaluacion == null || !evaluacion.EstaActivo || string.IsNullOrWhiteSpace(evaluacion.UriBlobEvidencia))
            throw new NoEncontradoException("El estudiante no cuenta con un archivo de evidencia registrado.");

        var flujo = await _servicioAlmacenamientoBlob.DescargarArchivoAsync(evaluacion.UriBlobEvidencia, NombreContenedor);
        return (flujo, evaluacion.TipoContenidoEvidencia ?? "application/octet-stream", evaluacion.NombreArchivoEvidencia ?? "evidencia_estudiante.pdf");
    }

    public async Task<bool> EliminarEvidenciaEstudianteAsync(Guid evaluacionEstudianteId, Guid usuarioDocenteId)
    {
        var evaluacion = await _repositorioEvaluacion.Consultar()
            .Include(e => e.Medicion)
                .ThenInclude(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(e => e.Id == evaluacionEstudianteId && e.EstaActivo);

        if (evaluacion == null)
            throw new NoEncontradoException("La evaluación del estudiante no existe.");

        if (evaluacion.Medicion.AsignaturaPlanAssessment.DocenteId != usuarioDocenteId)
            throw new ReglaNegocioException("Solo el docente a cargo puede eliminar evidencias de este estudiante.");

        if (!string.IsNullOrWhiteSpace(evaluacion.UriBlobEvidencia))
        {
            await _servicioAlmacenamientoBlob.EliminarArchivoAsync(evaluacion.UriBlobEvidencia, NombreContenedor);
        }

        evaluacion.NombreArchivoEvidencia = null;
        evaluacion.UriBlobEvidencia = null;
        evaluacion.TipoContenidoEvidencia = null;
        evaluacion.TamanoArchivoBytes = null;

        _repositorioEvaluacion.Actualizar(evaluacion);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return true;
    }

    private static EvaluacionEstudianteRespuestaDto MapearADto(EvaluacionEstudiante e)
    {
        string rango = e.Calificacion switch
        {
            < 60 => "0 - 59 (Insuficiente)",
            < 70 => "60 - 69 (Básico)",
            < 90 => "70 - 89 (Medio / Competente)",
            _ => "90 - 100 (Excelente / Avanzado)"
        };

        return new EvaluacionEstudianteRespuestaDto(
            e.Id,
            e.MedicionId,
            e.CodigoEstudiante,
            e.NombreEstudiante,
            e.Calificacion,
            rango,
            e.NombreArchivoEvidencia,
            e.UriBlobEvidencia,
            e.TipoContenidoEvidencia,
            e.TamanoArchivoBytes,
            e.Observaciones
        );
    }
}
