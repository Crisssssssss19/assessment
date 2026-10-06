using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssessmentSystem.API.Controllers;

[Authorize]
[Route("api/v1/evidencias")]
public class EvidenciasController : ControladorApiBase
{
    private readonly IServicioEvidencia _servicioEvidencia;

    public EvidenciasController(IServicioEvidencia servicioEvidencia)
    {
        _servicioEvidencia = servicioEvidencia;
    }

    /// <summary>
    /// Carga una evidencia documental (PDF o DOCX, máx 15MB) asociada a una medición.
    /// </summary>
    [HttpPost("cargar/{medicionId:guid}")]
    [Authorize(Roles = RolesSistema.Docente)]
    [ProducesResponseType(typeof(RespuestaApi<EvidenciaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CargarEvidencia([FromRoute] Guid medicionId, IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest(RespuestaApi<object>.RespuestaError("Debe proporcionar un archivo válido."));
        }

        using var stream = archivo.OpenReadStream();
        var resultado = await _servicioEvidencia.CargarEvidenciaAsync(
            medicionId,
            stream,
            archivo.FileName,
            archivo.ContentType,
            UsuarioActualId);

        return CreatedAtAction(
            nameof(DescargarEvidencia),
            new { id = resultado.Id },
            RespuestaApi<EvidenciaDto>.RespuestaExitosa(resultado, "Evidencia cargada exitosamente."));
    }

    /// <summary>
    /// Descarga un archivo de evidencia desde Azure Blob Storage / Azurite.
    /// </summary>
    [HttpGet("{id:guid}/descargar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DescargarEvidencia([FromRoute] Guid id)
    {
        var (flujoArchivo, tipoContenido, nombreArchivo) = await _servicioEvidencia.DescargarEvidenciaAsync(id);
        return File(flujoArchivo, tipoContenido, nombreArchivo);
    }

    /// <summary>
    /// Elimina una evidencia cargada.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = RolesSistema.Docente)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarEvidencia([FromRoute] Guid id)
    {
        var resultado = await _servicioEvidencia.EliminarEvidenciaAsync(id, UsuarioActualId);
        return Ok(RespuestaApi<bool>.RespuestaExitosa(resultado, "Evidencia eliminada correctamente."));
    }
}
