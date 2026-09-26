using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.DataAccess.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/datos-iniciales")]
public class DatosInicialesController : ControllerBase
{
    private readonly ContextoAplicacionDb _contexto;

    public DatosInicialesController(ContextoAplicacionDb contexto)
    {
        _contexto = contexto;
    }

    public record ItemDto(Guid Id, string Codigo, string Nombre, string? Descripcion = null, int? Semestre = null);
    public record DatosInicialesDto(
        List<ItemDto> Programas,
        List<ItemDto> Periodos,
        List<ItemDto> ResultadosAprendizaje,
        List<ItemDto> Asignaturas,
        List<ItemDto> Docentes,
        List<ItemDto> SupervisoresCalidadRa
    );

    /// <summary>
    /// Retorna los catálogos base (incluyendo las 10 ingenierías) para la configuración del Plan de Assessment.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(RespuestaApi<DatosInicialesDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerDatosIniciales()
    {
        var programas = await _contexto.ProgramasAcademicos
            .Where(p => p.EstaActivo)
            .OrderBy(p => p.Nombre)
            .Select(p => new ItemDto(p.Id, p.Codigo, p.Nombre, p.Facultad, null))
            .ToListAsync();

        var periodos = await _contexto.PeriodosAcademicos
            .Where(p => p.EstaActivo)
            .Select(p => new ItemDto(p.Id, p.Codigo, p.Nombre, null, null))
            .ToListAsync();

        var ras = await _contexto.ResultadosAprendizaje
            .Where(r => r.EstaActivo)
            .OrderBy(r => r.Codigo)
            .Select(r => new ItemDto(r.Id, r.Codigo, r.Nombre, r.Descripcion, null))
            .ToListAsync();

        var asignaturas = await _contexto.Asignaturas
            .Where(a => a.EstaActivo)
            .OrderBy(a => a.Semestre).ThenBy(a => a.Nombre)
            .Select(a => new ItemDto(a.Id, a.Codigo, a.Nombre, null, a.Semestre))
            .ToListAsync();

        var docentes = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.EstaActivo && 
                        u.Rol.Nombre != RolesSistema.Decano && 
                        u.Rol.Nombre != RolesSistema.LiderCalidadFacultad && 
                        u.Rol.Nombre != RolesSistema.LiderPrograma)
            .OrderBy(u => u.Nombres)
            .Select(u => new ItemDto(u.Id, u.CorreoElectronico, $"{u.Nombres} {u.Apellidos}".Trim(), null, null))
            .ToListAsync();

        var supervisores = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.EstaActivo && 
                        u.Rol.Nombre != RolesSistema.Decano && 
                        u.Rol.Nombre != RolesSistema.LiderCalidadFacultad && 
                        u.Rol.Nombre != RolesSistema.LiderPrograma)
            .OrderBy(u => u.Nombres)
            .Select(u => new ItemDto(u.Id, u.CorreoElectronico, $"{u.Nombres} {u.Apellidos}".Trim(), null, null))
            .ToListAsync();

        var datos = new DatosInicialesDto(programas, periodos, ras, asignaturas, docentes, supervisores);
        return Ok(RespuestaApi<DatosInicialesDto>.RespuestaExitosa(datos));
    }
}
