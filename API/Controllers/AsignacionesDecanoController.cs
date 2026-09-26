using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.DataAccess.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/asignaciones-decano")]
public class AsignacionesDecanoController : ControllerBase
{
    private readonly ContextoAplicacionDb _contexto;

    public AsignacionesDecanoController(ContextoAplicacionDb contexto)
    {
        _contexto = contexto;
    }

    public record CandidatoLiderDto(
        Guid Id,
        string NombreCompleto,
        string CorreoElectronico,
        string RolActual,
        Guid? ProgramaAsignadoId,
        string? NombreProgramaAsignado
    );
    public record ProgramaLiderDto(Guid ProgramaId, string Codigo, string NombrePrograma, Guid? LiderUsuarioId, string? NombreLider, string? CorreoLider);
    public record EstadoAsignacionesDto(
        Guid? LiderCalidadFacultadId,
        string? NombreLiderCalidadFacultad,
        string? CorreoLiderCalidadFacultad,
        List<ProgramaLiderDto> Programas,
        List<CandidatoLiderDto> CandidatosDisponibles
    );

    public record AsignarLiderFacultadDto(Guid? UsuarioId);
    public record AsignarLiderProgramaDto(Guid ProgramaId, Guid? UsuarioId);

    /// <summary>
    /// Retorna el estado actual de las asignaciones de la Facultad y de los 10 programas.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(RespuestaApi<EstadoAsignacionesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerAsignaciones()
    {
        // 1. Obtener Líder de Calidad de Facultad actual
        var liderFacultad = await _contexto.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.EstaActivo && u.Rol.Nombre == RolesSistema.LiderCalidadFacultad);

        // 2. Obtener los 10 Programas y sus Líderes asignados
        var programas = await _contexto.ProgramasAcademicos
            .Where(p => p.EstaActivo)
            .OrderBy(p => p.Nombre)
            .ToListAsync();

        var lideresPrograma = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .Where(u => u.EstaActivo && u.Rol.Nombre == RolesSistema.LiderPrograma && u.ProgramaAcademicoId != null)
            .ToListAsync();

        var listaProgramas = programas.Select(p =>
        {
            var lider = lideresPrograma.FirstOrDefault(l => l.ProgramaAcademicoId == p.Id);
            return new ProgramaLiderDto(
                p.Id,
                p.Codigo,
                p.Nombre,
                lider?.Id,
                lider != null ? $"{lider.Nombres} {lider.Apellidos}".Trim() : null,
                lider?.CorreoElectronico
            );
        }).ToList();

        // 3. Candidatos (docentes y usuarios sin rol Decano)
        var usuarios = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .Where(u => u.EstaActivo && u.Rol.Nombre != RolesSistema.Decano)
            .OrderBy(u => u.Nombres)
            .ToListAsync();

        var candidatos = usuarios.Select(u => new CandidatoLiderDto(
            u.Id,
            $"{u.Nombres} {u.Apellidos}".Trim(),
            u.CorreoElectronico,
            u.Rol.Nombre,
            u.ProgramaAcademicoId,
            u.ProgramaAcademico?.Nombre
        )).ToList();

        var resultado = new EstadoAsignacionesDto(
            liderFacultad?.Id,
            liderFacultad != null ? $"{liderFacultad.Nombres} {liderFacultad.Apellidos}" : null,
            liderFacultad?.CorreoElectronico,
            listaProgramas,
            candidatos
        );

        return Ok(RespuestaApi<EstadoAsignacionesDto>.RespuestaExitosa(resultado));
    }

    /// <summary>
    /// Asigna, reasigna o desasigna al Líder de Calidad de la Facultad de Ingeniería.
    /// Valida que el usuario no tenga ya otro rol asignado.
    /// </summary>
    [HttpPost("lider-facultad")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AsignarLiderFacultad([FromBody] AsignarLiderFacultadDto dto)
    {
        var rolCalidadFacultad = await _contexto.Roles.FirstOrDefaultAsync(r => r.Nombre == RolesSistema.LiderCalidadFacultad);
        var rolDocente = await _contexto.Roles.FirstOrDefaultAsync(r => r.Nombre == RolesSistema.Docente);
        if (rolCalidadFacultad == null) return NotFound(RespuestaApi<bool>.RespuestaError("Rol LiderCalidadFacultad no encontrado."));

        // Si se envía null o Guid.Empty, desasignar al líder actual y volverlo a rol Docente sin asignación
        if (dto.UsuarioId == null || dto.UsuarioId == Guid.Empty)
        {
            if (rolDocente != null)
            {
                var actuales = await _contexto.Usuarios
                    .Where(u => u.RolId == rolCalidadFacultad.Id)
                    .ToListAsync();
                foreach (var act in actuales)
                {
                    act.RolId = rolDocente.Id;
                    act.ProgramaAcademicoId = null;
                }
                await _contexto.SaveChangesAsync();
            }
            return Ok(RespuestaApi<bool>.RespuestaExitosa(true, "Se ha desasignado el Líder de Calidad de la Facultad. Ahora queda sin asignar."));
        }

        var nuevoLider = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .FirstOrDefaultAsync(u => u.Id == dto.UsuarioId.Value);

        if (nuevoLider == null) return NotFound(RespuestaApi<bool>.RespuestaError("Usuario no encontrado."));

        // Validación estricta: No puede tener ya otro rol asignado
        if (nuevoLider.Rol.Nombre == RolesSistema.Decano)
        {
            return BadRequest(RespuestaApi<bool>.RespuestaError("El usuario tiene rol de Decano y no puede ser asignado como Líder de Facultad."));
        }

        if (nuevoLider.Rol.Nombre == RolesSistema.LiderPrograma && nuevoLider.ProgramaAcademicoId != null)
        {
            return BadRequest(RespuestaApi<bool>.RespuestaError($"El usuario ya tiene asignado el rol de Líder de Programa en '{nuevoLider.ProgramaAcademico?.Nombre}'. Para asignarlo a este rol, primero debe desasignarlo de su programa actual."));
        }

        // Revertir a docentes sin asignación a los anteriores líderes de facultad
        if (rolDocente != null)
        {
            var anteriores = await _contexto.Usuarios
                .Where(u => u.RolId == rolCalidadFacultad.Id && u.Id != nuevoLider.Id)
                .ToListAsync();
            foreach (var ant in anteriores)
            {
                ant.RolId = rolDocente.Id;
                ant.ProgramaAcademicoId = null;
            }
        }

        // Asignar el rol al nuevo líder
        nuevoLider.RolId = rolCalidadFacultad.Id;
        nuevoLider.ProgramaAcademicoId = null; // Líder de facultad ve toda la facultad

        await _contexto.SaveChangesAsync();
        return Ok(RespuestaApi<bool>.RespuestaExitosa(true, $"Se ha asignado a {nuevoLider.Nombres} {nuevoLider.Apellidos} como Líder de Calidad de la Facultad."));
    }

    /// <summary>
    /// Asigna o desasigna al Líder de Programa en una de las 10 ingenierías.
    /// Valida que el usuario no tenga ya otro rol asignado.
    /// </summary>
    [HttpPost("lider-programa")]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AsignarLiderPrograma([FromBody] AsignarLiderProgramaDto dto)
    {
        var rolLiderPrograma = await _contexto.Roles.FirstOrDefaultAsync(r => r.Nombre == RolesSistema.LiderPrograma);
        var rolDocente = await _contexto.Roles.FirstOrDefaultAsync(r => r.Nombre == RolesSistema.Docente);
        if (rolLiderPrograma == null) return NotFound(RespuestaApi<bool>.RespuestaError("Rol LiderPrograma no encontrado."));

        var programa = await _contexto.ProgramasAcademicos.FindAsync(dto.ProgramaId);
        if (programa == null) return NotFound(RespuestaApi<bool>.RespuestaError("Programa académico no encontrado."));

        // Si se envía null o Guid.Empty, desasignar al líder actual de este programa y volverlo a rol Docente sin asignación
        if (dto.UsuarioId == null || dto.UsuarioId == Guid.Empty)
        {
            var liderActual = await _contexto.Usuarios
                .FirstOrDefaultAsync(u => u.ProgramaAcademicoId == programa.Id && u.RolId == rolLiderPrograma.Id);
            if (liderActual != null && rolDocente != null)
            {
                liderActual.RolId = rolDocente.Id;
                liderActual.ProgramaAcademicoId = null;
                await _contexto.SaveChangesAsync();
            }
            return Ok(RespuestaApi<bool>.RespuestaExitosa(true, $"Se ha desasignado el Líder del programa {programa.Nombre}. Ahora queda sin asignar."));
        }

        var nuevoLider = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .FirstOrDefaultAsync(u => u.Id == dto.UsuarioId.Value);

        if (nuevoLider == null) return NotFound(RespuestaApi<bool>.RespuestaError("Usuario no encontrado."));

        // Validación estricta: No puede tener ya otro rol asignado
        if (nuevoLider.Rol.Nombre == RolesSistema.Decano)
        {
            return BadRequest(RespuestaApi<bool>.RespuestaError("El usuario tiene rol de Decano y no puede ser asignado como Líder de Programa."));
        }

        if (nuevoLider.Rol.Nombre == RolesSistema.LiderCalidadFacultad)
        {
            return BadRequest(RespuestaApi<bool>.RespuestaError("El usuario ya tiene asignado el rol de Líder de Calidad de la Facultad. Para asignarlo a este programa, primero debe desasignarlo de su rol actual."));
        }

        if (nuevoLider.Rol.Nombre == RolesSistema.LiderPrograma && nuevoLider.ProgramaAcademicoId != null && nuevoLider.ProgramaAcademicoId != programa.Id)
        {
            return BadRequest(RespuestaApi<bool>.RespuestaError($"El usuario ya tiene asignado el rol de Líder de Programa en '{nuevoLider.ProgramaAcademico?.Nombre}'. Un usuario no puede tener múltiples programas o roles asignados a la vez."));
        }

        // Si había otro líder asignado a este programa, revertirlo a Docente sin asignación
        if (rolDocente != null)
        {
            var liderAnterior = await _contexto.Usuarios
                .FirstOrDefaultAsync(u => u.ProgramaAcademicoId == programa.Id && u.Id != nuevoLider.Id);
            if (liderAnterior != null)
            {
                liderAnterior.RolId = rolDocente.Id;
                liderAnterior.ProgramaAcademicoId = null;
            }
        }

        // Asignar rol y vincular programa
        nuevoLider.RolId = rolLiderPrograma.Id;
        nuevoLider.ProgramaAcademicoId = programa.Id;

        await _contexto.SaveChangesAsync();
        return Ok(RespuestaApi<bool>.RespuestaExitosa(true, $"Se ha asignado a {nuevoLider.Nombres} {nuevoLider.Apellidos} como Líder de {programa.Nombre}."));
    }
}
