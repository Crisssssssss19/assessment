using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssessmentSystem.API.Controllers;

[Authorize]
[Route("api/v1/mediciones")]
public class MedicionesController : ControladorApiBase
{
    private readonly IServicioMedicion _servicioMedicion;

    public MedicionesController(IServicioMedicion servicioMedicion)
    {
        _servicioMedicion = servicioMedicion;
    }

    /// <summary>
    /// Registra la medición de un curso por rangos de cumplimiento (Docente).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = RolesSistema.Docente)]
    [ProducesResponseType(typeof(RespuestaApi<MedicionRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarMedicion([FromBody] CrearMedicionDto dto)
    {
        var resultado = await _servicioMedicion.RegistrarMedicionAsync(dto, UsuarioActualId);
        return Ok(RespuestaApi<MedicionRespuestaDto>.RespuestaExitosa(resultado, "Medición registrada correctamente."));
    }

    /// <summary>
    /// Revisa y aprueba o devuelve una medición con observaciones obligatorias (Líder de Calidad por RA).
    /// </summary>
    [HttpPost("{id:guid}/revision")]
    [Authorize(Roles = RolesSistema.LiderCalidadRA)]
    [ProducesResponseType(typeof(RespuestaApi<MedicionRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevisarMedicion([FromRoute] Guid id, [FromBody] RevisarMedicionDto dto)
    {
        var resultado = await _servicioMedicion.RevisarMedicionAsync(id, dto, UsuarioActualId);
        var mensaje = dto.Aprobado ? "Medición aprobada exitosamente." : "Medición devuelta con observaciones para corrección.";
        return Ok(RespuestaApi<MedicionRespuestaDto>.RespuestaExitosa(resultado, mensaje));
    }

    /// <summary>
    /// Obtiene el detalle y resultados de una medición.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RespuestaApi<MedicionRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] Guid id)
    {
        var resultado = await _servicioMedicion.ObtenerPorIdAsync(id);
        return Ok(RespuestaApi<MedicionRespuestaDto>.RespuestaExitosa(resultado));
    }
}
