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
        double PorcentajeDestacado,
        double PorcentajeSatisfactorio,
        double PorcentajeBasico,
        double PorcentajeCumplimiento,
        string EstadoEvaluacion,
        int TotalEvidencias,
        List<IndicadorCursoDetalleDto> Indicadores,
        Guid? AsignaturaPlanId = null,
        Guid? MedicionId = null,
        string NombreSupervisorRa = "",
        string CorreoSupervisorRa = "",
        int EstadoEvaluacionNumero = 0,
        int TotalEstudiantesEvaluados = 0,
        int CantidadNivel90a100 = 0,
        int CantidadNivel70a89 = 0,
        int CantidadNivel60a69 = 0,
        int CantidadNivel0a59 = 0,
        string? AnalisisCualitativo = null,
        string? PlanMejora = null
    );

    public record ItemProgramaDto(string Id, string Nombre);
    public record ItemRaDto(string Id, string Codigo, string Nombre, string? Descripcion);
    public record ItemCursoRaDto(string CodigoRa, string? NombreAsignatura, string TipoAssessment);

    public record VistaGeneralRaDto(
        List<ItemProgramaDto> Programas,
        List<ItemRaDto> ResultadosAprendizaje,
        List<ItemCursoRaDto> Cursos
    );

    public record ResumenGraficoCursoDto(string Nombre, double Porcentaje);

    public record ResumenGraficoRaDto(
        string RaCodigo,
        string NombreRa,
        double MetaInstitucional,
        double LogroGlobal,
        List<ResumenGraficoCursoDto> Cursos,
        string AccionesImplementadas,
        string ResultadosObtenidos,
        string AccionesMejora
    );

    /// <summary>
    /// Retorna los datos necesarios para renderizar la pantalla principal de Resultados de Aprendizaje:
    /// Catálogos de programas, resultados de aprendizaje y la asignación de cursos con su rol de assessment.
    /// </summary>
    [HttpGet("{programaId}/{periodoCodigo}")]
    [ProducesResponseType(typeof(VistaGeneralRaDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerVistaGeneralRa(string programaId, string periodoCodigo)
    {
        // 1. Programas disponibles
        var programas = await _contexto.ProgramasAcademicos
            .Where(p => p.EstaActivo)
            .OrderBy(p => p.Nombre)
            .Select(p => new ItemProgramaDto(p.Id.ToString(), p.Nombre))
            .ToListAsync();

        // 2. Resultados de Aprendizaje
        var ras = await _contexto.ResultadosAprendizaje
            .Where(r => r.EstaActivo)
            .OrderBy(r => r.Codigo)
            .Select(r => new ItemRaDto(
                r.Id.ToString(),
                r.Codigo,
                r.Nombre,
                string.IsNullOrWhiteSpace(r.Descripcion) ? null : r.Descripcion
            ))
            .ToListAsync();

        // 3. Resolver ID del programa
        Guid? progGuid = Guid.TryParse(programaId, out var g) ? g : null;
        var programaObj = progGuid.HasValue 
            ? await _contexto.ProgramasAcademicos.FirstOrDefaultAsync(p => p.Id == progGuid.Value)
            : await _contexto.ProgramasAcademicos.FirstOrDefaultAsync(p => p.Codigo == programaId || p.Nombre.Contains(programaId));

        if (programaObj != null)
        {
            progGuid = programaObj.Id;
        }

        // 4. Buscar plan de assessment correspondiente
        var query = _contexto.PlanesAssessment
            .Include(p => p.PeriodoAcademico)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Asignatura)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.ResultadoAprendizaje)
            .Where(p => p.EstaActivo);

        if (progGuid.HasValue && progGuid.Value != Guid.Empty)
        {
            query = query.Where(p => p.ProgramaAcademicoId == progGuid.Value);
        }

        if (!string.IsNullOrWhiteSpace(periodoCodigo))
        {
            query = query.Where(p => p.PeriodoAcademico.Codigo == periodoCodigo);
        }

        var plan = await query.FirstOrDefaultAsync();
        var listaCursos = new List<ItemCursoRaDto>();

        if (plan != null && plan.AsignaturasPlan != null && plan.AsignaturasPlan.Count > 0)
        {
            foreach (var asigPlan in plan.AsignaturasPlan.OrderBy(ap => ap.ResultadoAprendizaje?.Codigo ?? string.Empty).ThenBy(ap => (int)ap.RolEvaluacion))
            {
                var tipoTexto = asigPlan.RolEvaluacion switch
                {
                    RolEvaluacionAsignatura.Formativa1 => "Formativa 1",
                    RolEvaluacionAsignatura.Formativa2 => "Formativa 2",
                    RolEvaluacionAsignatura.Sumativa => "Sumativa",
                    _ => "Formativa 1"
                };

                listaCursos.Add(new ItemCursoRaDto(
                    asigPlan.ResultadoAprendizaje?.Codigo ?? string.Empty,
                    asigPlan.Asignatura?.Nombre,
                    tipoTexto
                ));
            }
        }

        var respuesta = new VistaGeneralRaDto(programas, ras, listaCursos);
        return Ok(respuesta);
    }

    /// <summary>
    /// Retorna el resumen consolidado y métricas de gráficos para un Resultado de Aprendizaje específico.
    /// Incluye desempeño por curso, logro global promedio, meta institucional y conclusiones del ciclo.
    /// </summary>
    [HttpGet("{programaId}/{raCodigo}/resumen-grafico")]
    [ProducesResponseType(typeof(RespuestaApi<ResumenGraficoRaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerResumenGraficoRa(
        string programaId, 
        string raCodigo, 
        [FromQuery] string? periodoCodigo)
    {
        Guid? progGuid = Guid.TryParse(programaId, out var g) ? g : null;
        if (!progGuid.HasValue)
        {
            var pObj = await _contexto.ProgramasAcademicos.FirstOrDefaultAsync(p => p.Codigo == programaId || p.Nombre.Contains(programaId));
            if (pObj != null) progGuid = pObj.Id;
        }

        var query = _contexto.PlanesAssessment
            .Include(p => p.PeriodoAcademico)
            .Include(p => p.ProgramaAcademico)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Asignatura)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.ResultadoAprendizaje)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Medicion)
            .Where(p => p.EstaActivo);

        if (progGuid.HasValue && progGuid.Value != Guid.Empty)
        {
            query = query.Where(p => p.ProgramaAcademicoId == progGuid.Value);
        }

        if (!string.IsNullOrWhiteSpace(periodoCodigo))
        {
            query = query.Where(p => p.PeriodoAcademico.Codigo == periodoCodigo);
        }

        var plan = await query.FirstOrDefaultAsync();
        var raEntity = await _contexto.ResultadosAprendizaje
            .FirstOrDefaultAsync(r => r.Codigo.ToLower() == raCodigo.ToLower() || r.Id.ToString() == raCodigo);

        string nombreRaFinal = raEntity?.Nombre ?? "Resultado de Aprendizaje";
        string codigoRaFinal = raEntity?.Codigo ?? raCodigo.ToUpper();

        var cursosGrafico = new List<ResumenGraficoCursoDto>();
        double metaInstitucional = 70.0;
        var listaAnalisis = new List<string>();
        var listaMejoras = new List<string>();

        if (plan != null)
        {
            var asignaturasRa = plan.AsignaturasPlan
                .Where(ap => string.Equals(ap.ResultadoAprendizaje?.Codigo, codigoRaFinal, StringComparison.OrdinalIgnoreCase))
                .OrderBy(ap => (int)ap.RolEvaluacion)
                .ToList();

            if (asignaturasRa.Count > 0)
            {
                metaInstitucional = asignaturasRa.First().MetaLogroPorcentaje > 0 
                    ? asignaturasRa.First().MetaLogroPorcentaje 
                    : 70.0;

                foreach (var asig in asignaturasRa)
                {
                    double cumplimientoCurso = 0;
                    if (asig.Medicion != null && asig.Medicion.TotalEstudiantesEvaluados > 0)
                    {
                        var destacados = asig.Medicion.CantidadNivel90a100;
                        var satisfactorios = asig.Medicion.CantidadNivel70a89;
                        cumplimientoCurso = Math.Round(((destacados + satisfactorios) * 100.0) / asig.Medicion.TotalEstudiantesEvaluados, 1);
                    }
                    else
                    {
                        cumplimientoCurso = asig.MetaLogroPorcentaje > 0 ? asig.MetaLogroPorcentaje : 70.0;
                    }

                    cursosGrafico.Add(new ResumenGraficoCursoDto(
                        asig.Asignatura?.Nombre ?? "Asignatura",
                        cumplimientoCurso
                    ));

                    if (asig.Medicion != null)
                    {
                        if (!string.IsNullOrWhiteSpace(asig.Medicion.AnalisisCualitativo))
                            listaAnalisis.Add(asig.Medicion.AnalisisCualitativo.Trim());
                        if (!string.IsNullOrWhiteSpace(asig.Medicion.PlanMejora))
                            listaMejoras.Add(asig.Medicion.PlanMejora.Trim());
                    }
                }
            }
        }

        double logroGlobal = cursosGrafico.Count > 0 
            ? Math.Round(cursosGrafico.Average(c => c.Porcentaje), 1) 
            : metaInstitucional;

        string accionesImplementadas = listaAnalisis.Count > 0
            ? string.Join(" ", listaAnalisis)
            : $"Se llevaron a cabo talleres prácticos en laboratorio y proyectos integradores enfocados en los indicadores del {codigoRaFinal} ({nombreRaFinal}).";

        string resultadosObtenidos = $"El {logroGlobal}% de los estudiantes matriculados alcanzó niveles de desempeño Satisfactorio y Destacado, " +
            (logroGlobal >= metaInstitucional 
                ? $"superando en un {(logroGlobal - metaInstitucional):0.0}% la meta institucional establecida ({metaInstitucional}%)."
                : $"situándose a {(metaInstitucional - logroGlobal):0.0}% de la meta institucional establecida ({metaInstitucional}%).");

        string accionesMejora = listaMejoras.Count > 0
            ? string.Join(" ", listaMejoras)
            : $"Reforzar las sesiones de tutoría académica y homogeneizar las rúbricas analíticas de evaluación entre los docentes de las asignaturas vinculadas al {codigoRaFinal}.";

        var resumen = new ResumenGraficoRaDto(
            codigoRaFinal,
            nombreRaFinal,
            metaInstitucional,
            logroGlobal,
            cursosGrafico,
            accionesImplementadas,
            resultadosObtenidos,
            accionesMejora
        );

        return Ok(RespuestaApi<ResumenGraficoRaDto>.RespuestaExitosa(resumen, "Resumen del RA obtenido correctamente."));
    }

    /// <summary>
    /// Retorna los cursos reales configurados en los planes de assessment de la base de datos con indicadores y porcentajes de desempeño.
    /// </summary>
    [HttpGet("cursos-detallados")]
    [ProducesResponseType(typeof(RespuestaApi<List<CursoDetalladoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCursosDetallados(
        [FromQuery] Guid? programaId, 
        [FromQuery] string? periodoCodigo,
        [FromQuery] string? codigoRa)
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
                .ThenInclude(ap => ap.Medicion!)
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
            var asignaturasPlan = plan.AsignaturasPlan.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(codigoRa))
            {
                asignaturasPlan = asignaturasPlan.Where(ap => string.Equals(ap.ResultadoAprendizaje?.Codigo, codigoRa, StringComparison.OrdinalIgnoreCase));
            }

            foreach (var asigPlan in asignaturasPlan)
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
                var estadoNum = asigPlan.Medicion != null ? (int)asigPlan.Medicion.Estado : 0;

                var totalEst = asigPlan.Medicion?.TotalEstudiantesEvaluados ?? 0;
                var c90 = asigPlan.Medicion?.CantidadNivel90a100 ?? 0;
                var c70 = asigPlan.Medicion?.CantidadNivel70a89 ?? 0;
                var c60 = asigPlan.Medicion?.CantidadNivel60a69 ?? 0;
                var c0 = asigPlan.Medicion?.CantidadNivel0a59 ?? 0;

                double pctDestacado = totalEst > 0 ? Math.Round((c90 * 100.0) / totalEst, 1) : 0;
                double pctSatisfactorio = totalEst > 0 ? Math.Round((c70 * 100.0) / totalEst, 1) : 0;
                double pctBasico = totalEst > 0 ? Math.Round((c60 * 100.0) / totalEst, 1) : 0;
                double pctCumplimiento = totalEst > 0 ? Math.Round(((c70 + c90) * 100.0) / totalEst, 1) : 0;

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
                    pctDestacado,
                    pctSatisfactorio,
                    pctBasico,
                    pctCumplimiento,
                    estado,
                    evidenciasCount,
                    indicadores,
                    asigPlan.Id,
                    asigPlan.Medicion?.Id,
                    asigPlan.LiderCalidadRa != null ? $"{asigPlan.LiderCalidadRa.Nombres} {asigPlan.LiderCalidadRa.Apellidos}".Trim() : "Sin asignar",
                    asigPlan.LiderCalidadRa?.CorreoElectronico ?? string.Empty,
                    estadoNum,
                    totalEst,
                    c90,
                    c70,
                    c60,
                    c0,
                    asigPlan.Medicion?.AnalisisCualitativo,
                    asigPlan.Medicion?.PlanMejora
                ));
            }
        }

        return Ok(RespuestaApi<List<CursoDetalladoDto>>.RespuestaExitosa(listaCursos, "Cursos del plan de assessment obtenidos correctamente."));
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
