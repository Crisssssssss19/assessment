using System.Security.Claims;
using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Business.DTOs.PlanAssessment;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.DataAccess.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/planes-assessment")]
public class PlanesAssessmentController : ControllerBase
{
    private readonly IServicioPlanAssessment _servicioPlan;
    private readonly ContextoAplicacionDb _contexto;

    public PlanesAssessmentController(IServicioPlanAssessment servicioPlan, ContextoAplicacionDb contexto)
    {
        _servicioPlan = servicioPlan;
        _contexto = contexto;
    }

    public record IndicadorCursoDetalleDto(string Codigo, string Descripcion);
    public record CursoDetalladoDto(
        Guid AsignaturaId,
        string CodigoAsignatura,
        string NombreAsignatura,
        int Semestre,
        int Creditos,
        string PeriodoAcademico,
        string ProgramaAcademico,
        string CodigoRa,
        string NombreRa,
        string DescripcionRa,
        string TipoAssessment, // Formativa 1, Formativa 2, Sumativa
        int TipoAssessmentNumero,
        double MetaLogroPorcentaje,
        string NombreDocente,
        string CorreoDocente,
        string NombreSupervisorRa,
        string CorreoSupervisorRa,
        string EstadoEvaluacion,
        int TotalEvidencias,
        List<IndicadorCursoDetalleDto> Indicadores
    );

    /// <summary>
    /// Retorna los cursos reales configurados en los planes de assessment de la base de datos.
    /// Si aún no se ha guardado un plan, retorna una lista vacía para que sea configurado desde cero por el Líder de Programa.
    /// </summary>
    [HttpGet("cursos-detallados")]
    [ProducesResponseType(typeof(RespuestaApi<List<CursoDetalladoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCursosDetallados([FromQuery] Guid? programaId, [FromQuery] string? periodoCodigo)
    {
        var query = _contexto.PlanesAssessment
            .Include(p => p.PeriodoAcademico)
            .Include(p => p.ProgramaAcademico)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Asignatura)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.ResultadoAprendizaje)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Docente)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.LiderCalidadRa)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.IndicadoresDesempeno)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Medicion)
                    .ThenInclude(m => m.Evidencias)
            .Where(p => p.EstaActivo);

        if (programaId.HasValue && programaId.Value != Guid.Empty)
        {
            query = query.Where(p => p.ProgramaAcademicoId == programaId.Value);
        }

        if (!string.IsNullOrEmpty(periodoCodigo))
        {
            query = query.Where(p => p.PeriodoAcademico.Codigo == periodoCodigo);
        }

        var planes = await query.ToListAsync();
        var listaCursos = new List<CursoDetalladoDto>();

        foreach (var plan in planes)
        {
            foreach (var asigPlan in plan.AsignaturasPlan)
            {
                var tipoNum = (int)asigPlan.RolEvaluacion;
                var tipoTexto = asigPlan.RolEvaluacion switch
                {
                    RolEvaluacionAsignatura.Formativa1 => "Formativa 1",
                    RolEvaluacionAsignatura.Formativa2 => "Formativa 2",
                    RolEvaluacionAsignatura.Sumativa => "Sumativa",
                    _ => "Formativa 1"
                };

                var evidenciasCount = asigPlan.Medicion?.Evidencias?.Count ?? 0;
                var estado = asigPlan.Medicion?.Estado.ToString() ?? "Pendiente";

                var indicadores = asigPlan.IndicadoresDesempeno.Select(i => 
                    new IndicadorCursoDetalleDto(i.Codigo, i.Descripcion)).ToList();

                listaCursos.Add(new CursoDetalladoDto(
                    asigPlan.AsignaturaId,
                    asigPlan.Asignatura?.Codigo ?? string.Empty,
                    asigPlan.Asignatura?.Nombre ?? string.Empty,
                    asigPlan.Semestre,
                    asigPlan.Asignatura?.Creditos ?? 3,
                    plan.PeriodoAcademico?.Codigo ?? "2026-1",
                    plan.ProgramaAcademico?.Nombre ?? "Ingeniería",
                    asigPlan.ResultadoAprendizaje?.Codigo ?? string.Empty,
                    asigPlan.ResultadoAprendizaje?.Nombre ?? string.Empty,
                    asigPlan.ResultadoAprendizaje?.Descripcion ?? string.Empty,
                    tipoTexto,
                    tipoNum,
                    asigPlan.MetaLogroPorcentaje,
                    asigPlan.Docente != null ? $"{asigPlan.Docente.Nombres} {asigPlan.Docente.Apellidos}".Trim() : "Sin asignar",
                    asigPlan.Docente?.CorreoElectronico ?? string.Empty,
                    asigPlan.LiderCalidadRa != null ? $"{asigPlan.LiderCalidadRa.Nombres} {asigPlan.LiderCalidadRa.Apellidos}".Trim() : "Sin asignar",
                    asigPlan.LiderCalidadRa?.CorreoElectronico ?? string.Empty,
                    estado,
                    evidenciasCount,
                    indicadores
                ));
            }
        }

        return Ok(RespuestaApi<List<CursoDetalladoDto>>.RespuestaExitosa(listaCursos));
    }

    /// <summary>
    /// Crea un nuevo Plan de Assessment configurando las 21 asignaturas y sus 3 indicadores de desempeño.
    /// El Decano únicamente tiene permisos de consulta; la creación y edición está reservada para Líder de Programa y Calidad.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RespuestaApi<PlanAssessmentRespuestaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CrearPlanAssessment([FromBody] CrearPlanAssessmentDto dto)
    {
        var rolUsuario = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rolUsuario == RolesSistema.Decano)
        {
            return StatusCode(StatusCodes.Status403Forbidden, RespuestaApi<object>.RespuestaError(
                "Acceso denegado: El Decano tiene permisos de visualización general y asignación de líderes, pero no puede crear ni editar los Planes de Assessment. La configuración está reservada para el Líder de Programa y Líder de Calidad."));
        }

        var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var usuarioActualId = string.IsNullOrEmpty(claimId) ? Guid.NewGuid() : Guid.Parse(claimId);

        var resultado = await _servicioPlan.CrearPlanAssessmentAsync(dto, usuarioActualId);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = resultado.Id }, RespuestaApi<PlanAssessmentRespuestaDto>.RespuestaExitosa(resultado, "Plan de Assessment creado y configurado exitosamente."));
    }

    /// <summary>
    /// Obtiene el detalle de un Plan de Assessment por su ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RespuestaApi<PlanAssessmentRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId(Guid id)
    {
        var resultado = await _servicioPlan.ObtenerPorIdAsync(id);
        return Ok(RespuestaApi<PlanAssessmentRespuestaDto>.RespuestaExitosa(resultado));
    }

    /// <summary>
    /// Obtiene el Plan de Assessment activo para un período académico.
    /// </summary>
    [HttpGet("periodo/{periodoId:guid}")]
    [ProducesResponseType(typeof(RespuestaApi<PlanAssessmentRespuestaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorPeriodo(Guid periodoId)
    {
        var resultado = await _servicioPlan.ObtenerPorPeriodoAcademicoAsync(periodoId);
        if (resultado == null)
        {
            return NotFound(RespuestaApi<object>.RespuestaError("No se encontró ningún plan de assessment para el período académico especificado."));
        }
        return Ok(RespuestaApi<PlanAssessmentRespuestaDto>.RespuestaExitosa(resultado));
    }
}
