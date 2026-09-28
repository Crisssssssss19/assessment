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
    private readonly IRepositorio<ObservacionMedicion> _repositorioObservacion;
    private readonly IRepositorio<Usuario> _repositorioUsuario;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;

    public ServicioMedicion(
        IRepositorio<Medicion> repositorioMedicion,
        IRepositorio<AsignaturaPlanAssessment> repositorioAsignaturaPlan,
        IRepositorio<ObservacionMedicion> repositorioObservacion,
        IRepositorio<Usuario> repositorioUsuario,
        IUnidadDeTrabajo unidadDeTrabajo)
    {
        _repositorioMedicion = repositorioMedicion;
        _repositorioAsignaturaPlan = repositorioAsignaturaPlan;
        _repositorioObservacion = repositorioObservacion;
        _repositorioUsuario = repositorioUsuario;
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

        // Registrar entrada automática en bitácora
        var usuarioDocente = await _repositorioUsuario.ObtenerPorIdAsync(usuarioDocenteId);
        if (usuarioDocente != null)
        {
            var entradaBitacora = new ObservacionMedicion
            {
                MedicionId = medicion.Id,
                UsuarioId = usuarioDocenteId,
                RolEmisor = "Docente",
                Contenido = "El docente envió el informe y las evidencias para revisión del Líder de Calidad.",
                EstadoResultante = EstadoEvaluacion.EnRevision
            };
            await _repositorioObservacion.AgregarAsync(entradaBitacora);
            await _unidadDeTrabajo.GuardarCambiosAsync();
        }

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

        var nuevoEstado = dto.Aprobado ? EstadoEvaluacion.Aprobado : EstadoEvaluacion.Devuelto;
        medicion.Estado = nuevoEstado;
        medicion.ObservacionesRevision = dto.Observaciones;
        medicion.FechaRevision = DateTime.UtcNow;

        _repositorioMedicion.Actualizar(medicion);

        // Guardar entrada histórica en la bitácora
        var entradaHistorial = new ObservacionMedicion
        {
            MedicionId = medicionId,
            UsuarioId = usuarioLiderCalidadId,
            RolEmisor = RolesSistema.LiderCalidadRA,
            Contenido = dto.Observaciones ?? (dto.Aprobado ? "Medición aprobada satisfactoriamente." : "Medición devuelta para corrección."),
            EstadoResultante = nuevoEstado
        };
        await _repositorioObservacion.AgregarAsync(entradaHistorial);

        await _unidadDeTrabajo.GuardarCambiosAsync();

        return await ObtenerPorIdAsync(medicion.Id);
    }

    public async Task<ObservacionMedicionRespuestaDto> AgregarObservacionAsync(Guid medicionId, CrearObservacionDto dto, Guid usuarioId)
    {
        var medicion = await _repositorioMedicion.Consultar()
            .Include(m => m.AsignaturaPlanAssessment)
            .FirstOrDefaultAsync(m => m.Id == medicionId && m.EstaActivo);

        if (medicion == null)
            throw new NoEncontradoException("La medición especificada no existe.");

        var usuario = await _repositorioUsuario.Consultar()
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.EstaActivo);

        if (usuario == null)
            throw new NoEncontradoException("Usuario no válido.");

        var esDocente = medicion.AsignaturaPlanAssessment.DocenteId == usuarioId;
        var esSupervisor = medicion.AsignaturaPlanAssessment.LiderCalidadRaId == usuarioId;

        if (!esDocente && !esSupervisor && usuario.Rol.Nombre != RolesSistema.Decano && usuario.Rol.Nombre != RolesSistema.LiderCalidadFacultad)
        {
            throw new ReglaNegocioException("No tienes permisos para participar en la bitácora de esta medición.");
        }

        if (string.IsNullOrWhiteSpace(dto.Contenido))
            throw new ReglaNegocioException("El contenido de la observación o respuesta no puede estar vacío.");

        var estadoActual = dto.NuevoEstado ?? medicion.Estado;
        if (dto.NuevoEstado.HasValue)
        {
            medicion.Estado = dto.NuevoEstado.Value;
            _repositorioMedicion.Actualizar(medicion);
        }

        var observacion = new ObservacionMedicion
        {
            MedicionId = medicionId,
            UsuarioId = usuarioId,
            RolEmisor = usuario.Rol.Nombre,
            Contenido = dto.Contenido.Trim(),
            EstadoResultante = estadoActual
        };

        await _repositorioObservacion.AgregarAsync(observacion);
        await _unidadDeTrabajo.GuardarCambiosAsync();

        return new ObservacionMedicionRespuestaDto(
            observacion.Id,
            observacion.MedicionId,
            usuario.Id,
            usuario.NombreCompleto,
            usuario.CorreoElectronico,
            observacion.RolEmisor,
            observacion.Contenido,
            observacion.EstadoResultante,
            observacion.FechaCreacion
        );
    }

    public async Task<List<ObservacionMedicionRespuestaDto>> ObtenerHistorialObservacionesAsync(Guid medicionId)
    {
        var observaciones = await _repositorioObservacion.Consultar()
            .Include(o => o.Usuario)
            .Where(o => o.MedicionId == medicionId && o.EstaActivo)
            .OrderBy(o => o.FechaCreacion)
            .ToListAsync();

        return observaciones.Select(o => new ObservacionMedicionRespuestaDto(
            o.Id,
            o.MedicionId,
            o.UsuarioId,
            o.Usuario?.NombreCompleto ?? "Usuario",
            o.Usuario?.CorreoElectronico ?? "",
            o.RolEmisor,
            o.Contenido,
            o.EstadoResultante,
            o.FechaCreacion
        )).ToList();
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
