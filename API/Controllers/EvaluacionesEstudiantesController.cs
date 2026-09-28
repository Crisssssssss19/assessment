using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Business.DTOs.Medicion;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssessmentSystem.API.Controllers;

[Authorize]
[Route("api/v1/evaluaciones-estudiantes")]
public class EvaluacionesEstudiantesController : ControladorApiBase
{
    private readonly IServicioEvaluacionEstudiante _servicioEvaluacionEstudiante;

    public EvaluacionesEstudiantesController(IServicioEvaluacionEstudiante servicioEvaluacionEstudiante)
    {
        _servicioEvaluacionEstudiante = servicioEvaluacionEstudiante;
    }

    /// <summary>
    /// Registra o actualiza la lista de estudiantes y sus notas para una medición (Docente).
    /// </summary>
    [HttpPost("medicion/{medicionId:guid}")]
    [Authorize(Roles = $"{RolesSistema.Docente},{RolesSistema.LiderCalidadRA},{RolesSistema.LiderPrograma},{RolesSistema.Decano},{RolesSistema.LiderCalidadFacultad}")]
    [ProducesResponseType(typeof(RespuestaApi<List<EvaluacionEstudianteRespuestaDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegistrarEstudiantes([FromRoute] Guid medicionId, [FromBody] RegistrarEstudiantesMedicionDto dto)
    {
        var resultado = await _servicioEvaluacionEstudiante.RegistrarEstudiantesAsync(medicionId, dto, UsuarioActualId);
        return Ok(RespuestaApi<List<EvaluacionEstudianteRespuestaDto>>.RespuestaExitosa(resultado, "Estudiantes y calificaciones registradas correctamente."));
    }

    /// <summary>
    /// Obtiene todos los estudiantes evaluados en una medición.
    /// </summary>
    [HttpGet("medicion/{medicionId:guid}")]
    [ProducesResponseType(typeof(RespuestaApi<List<EvaluacionEstudianteRespuestaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerEstudiantesPorMedicion([FromRoute] Guid medicionId)
    {
        var resultado = await _servicioEvaluacionEstudiante.ObtenerEstudiantesPorMedicionAsync(medicionId);
        return Ok(RespuestaApi<List<EvaluacionEstudianteRespuestaDto>>.RespuestaExitosa(resultado));
    }

    /// <summary>
    /// Carga el archivo de evidencia documental (PDF o DOCX, máx 15MB) para un estudiante específico (Docente).
    /// </summary>
    [HttpPost("{estudianteId:guid}/evidencia")]
    [Authorize(Roles = RolesSistema.Docente)]
    [ProducesResponseType(typeof(RespuestaApi<EvaluacionEstudianteRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CargarEvidenciaEstudiante([FromRoute] Guid estudianteId, IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest(RespuestaApi<object>.RespuestaError("Debe proporcionar un archivo válido."));
        }

        using var stream = archivo.OpenReadStream();
        var resultado = await _servicioEvaluacionEstudiante.CargarEvidenciaEstudianteAsync(
            estudianteId,
            stream,
            archivo.FileName,
            archivo.ContentType,
            UsuarioActualId);

        return Ok(RespuestaApi<EvaluacionEstudianteRespuestaDto>.RespuestaExitosa(resultado, "Evidencia del estudiante cargada exitosamente."));
    }

    /// <summary>
    /// Descarga el archivo de evaluación/evidencia de un estudiante.
    /// </summary>
    [HttpGet("{estudianteId:guid}/evidencia/descargar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DescargarEvidenciaEstudiante([FromRoute] Guid estudianteId)
    {
        var (flujoArchivo, tipoContenido, nombreArchivo) = await _servicioEvaluacionEstudiante.DescargarEvidenciaEstudianteAsync(estudianteId);
        return File(flujoArchivo, tipoContenido, nombreArchivo);
    }

    /// <summary>
    /// Elimina el archivo de evidencia de un estudiante (Docente).
    /// </summary>
    [HttpDelete("{estudianteId:guid}/evidencia")]
    [Authorize(Roles = RolesSistema.Docente)]
    [ProducesResponseType(typeof(RespuestaApi<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarEvidenciaEstudiante([FromRoute] Guid estudianteId)
    {
        var resultado = await _servicioEvaluacionEstudiante.EliminarEvidenciaEstudianteAsync(estudianteId, UsuarioActualId);
        return Ok(RespuestaApi<bool>.RespuestaExitosa(resultado, "Evidencia del estudiante eliminada correctamente."));
    }
}
