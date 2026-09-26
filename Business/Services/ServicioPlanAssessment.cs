using AssessmentSystem.Business.DTOs.PlanAssessment;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Enums;
using AssessmentSystem.Core.Exceptions;
using AssessmentSystem.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.Business.Services;

public class ServicioPlanAssessment : IServicioPlanAssessment
{
    private readonly IRepositorio<PlanAssessment> _repositorioPlan;
    private readonly IRepositorio<PeriodoAcademico> _repositorioPeriodo;
    private readonly IRepositorio<ProgramaAcademico> _repositorioPrograma;
    private readonly IRepositorio<ResultadoAprendizaje> _repositorioRa;
    private readonly IRepositorio<Asignatura> _repositorioAsignatura;
    private readonly IRepositorio<Usuario> _repositorioUsuario;
    private readonly IUnidadDeTrabajo _unidadDeTrabajo;

    private const int TotalAsignaturasRequeridas = 21;
    private const int TotalResultadosAprendizajeRequeridos = 7;
    private const int TotalIndicadoresPorAsignatura = 3;

    public ServicioPlanAssessment(
        IRepositorio<PlanAssessment> repositorioPlan,
        IRepositorio<PeriodoAcademico> repositorioPeriodo,
        IRepositorio<ProgramaAcademico> repositorioPrograma,
        IRepositorio<ResultadoAprendizaje> repositorioRa,
        IRepositorio<Asignatura> repositorioAsignatura,
        IRepositorio<Usuario> repositorioUsuario,
        IUnidadDeTrabajo unidadDeTrabajo)
    {
        _repositorioPlan = repositorioPlan;
        _repositorioPeriodo = repositorioPeriodo;
        _repositorioPrograma = repositorioPrograma;
        _repositorioRa = repositorioRa;
        _repositorioAsignatura = repositorioAsignatura;
        _repositorioUsuario = repositorioUsuario;
        _unidadDeTrabajo = unidadDeTrabajo;
    }

    public async Task<PlanAssessmentRespuestaDto> CrearPlanAssessmentAsync(CrearPlanAssessmentDto dto, Guid usuarioActualId)
    {
        // 1. Validar o resolver período académico activo
        var periodo = await _repositorioPeriodo.ObtenerPorIdAsync(dto.PeriodoAcademicoId);
        if (periodo == null || !periodo.EstaActivo)
        {
            periodo = await _repositorioPeriodo.Consultar().FirstOrDefaultAsync(p => p.EstaActivo);
        }

        if (periodo == null)
        {
            periodo = new PeriodoAcademico
            {
                Codigo = "2026-1",
                Nombre = "Período Académico 2026 - I",
                FechaInicio = new DateTime(2026, 2, 1),
                FechaFin = new DateTime(2026, 6, 30),
                EsActual = true
            };
            await _repositorioPeriodo.AgregarAsync(periodo);
            await _unidadDeTrabajo.GuardarCambiosAsync();
        }

        // 2. Resolver Programa Académico
        Guid? progId = dto.ProgramaAcademicoId;
        if (!progId.HasValue || progId.Value == Guid.Empty)
        {
            var usuario = await _repositorioUsuario.ObtenerPorIdAsync(usuarioActualId);
            progId = usuario?.ProgramaAcademicoId ?? (await _repositorioPrograma.Consultar().FirstOrDefaultAsync(p => p.EstaActivo))?.Id;
        }

        // 3. Buscar si ya existe un plan para este período y programa
        var planExistente = await _repositorioPlan.Consultar()
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.IndicadoresDesempeno)
            .FirstOrDefaultAsync(p => p.PeriodoAcademicoId == periodo.Id && (p.ProgramaAcademicoId == progId || p.ProgramaAcademicoId == null));

        // 4. Catálogos base para fallbacks de seguridad
        var rasDisponibles = await _repositorioRa.Consultar().Where(r => r.EstaActivo).OrderBy(r => r.Codigo).ToListAsync();
        var asignaturasDisponibles = await _repositorioAsignatura.Consultar().Where(a => a.EstaActivo).OrderBy(a => a.Semestre).ToListAsync();
        var docentesDisponibles = await _repositorioUsuario.Consultar().Where(u => u.EstaActivo && u.Rol.Nombre != RolesSistema.Decano).ToListAsync();
        var primerDocenteId = docentesDisponibles.FirstOrDefault()?.Id ?? usuarioActualId;

        // 5. Preparar las 21 asignaturas estructuradas (7 RAs x 3 cursos: F1, F2, Sumativa)
        var listaAsignaturasFinal = new List<AsignaturaPlanAssessment>();

        if (dto.Asignaturas != null && dto.Asignaturas.Count > 0)
        {
            foreach (var asigDto in dto.Asignaturas)
            {
                var raId = asigDto.ResultadoAprendizajeId != Guid.Empty ? asigDto.ResultadoAprendizajeId : (rasDisponibles.FirstOrDefault()?.Id ?? Guid.NewGuid());
                var asigId = asigDto.AsignaturaId != Guid.Empty ? asigDto.AsignaturaId : (asignaturasDisponibles.FirstOrDefault()?.Id ?? Guid.NewGuid());
                var docId = asigDto.DocenteId != Guid.Empty ? asigDto.DocenteId : primerDocenteId;
                var supId = asigDto.LiderCalidadRaId != Guid.Empty ? asigDto.LiderCalidadRaId : primerDocenteId;

                var indicadores = (asigDto.Indicadores != null && asigDto.Indicadores.Count == TotalIndicadoresPorAsignatura)
                    ? asigDto.Indicadores.Select(i => new IndicadorDesempeno { Codigo = i.Codigo, Descripcion = i.Descripcion }).ToList()
                    : new List<IndicadorDesempeno>
                    {
                        new() { Codigo = "ID1", Descripcion = "Reconoce conceptos técnicos fundamentales y su relación con problemas de la ingeniería." },
                        new() { Codigo = "ID2", Descripcion = "Interpreta datos experimentales o resultados científicos para analizar una situación técnica." },
                        new() { Codigo = "ID3", Descripcion = "Propone explicaciones o soluciones iniciales a un problema a partir de conocimientos científicos." }
                    };

                listaAsignaturasFinal.Add(new AsignaturaPlanAssessment
                {
                    ResultadoAprendizajeId = raId,
                    AsignaturaId = asigId,
                    RolEvaluacion = asigDto.RolEvaluacion,
                    Semestre = asigDto.Semestre > 0 ? asigDto.Semestre : 1,
                    MetaLogroPorcentaje = asigDto.MetaLogroPorcentaje > 0 ? asigDto.MetaLogroPorcentaje : 70.0,
                    DocenteId = docId,
                    LiderCalidadRaId = supId,
                    IndicadoresDesempeno = indicadores
                });
            }
        }
        else
        {
            // Generar estructura completa de 21 asignaturas con los 7 RAs
            int asigIndex = 0;
            foreach (var ra in rasDisponibles.Take(7))
            {
                var supRa = docentesDisponibles.FirstOrDefault()?.Id ?? usuarioActualId;
                for (int rol = 1; rol <= 3; rol++)
                {
                    var asig = asignaturasDisponibles[asigIndex % asignaturasDisponibles.Count];
                    asigIndex++;

                    listaAsignaturasFinal.Add(new AsignaturaPlanAssessment
                    {
                        ResultadoAprendizajeId = ra.Id,
                        AsignaturaId = asig.Id,
                        RolEvaluacion = (RolEvaluacionAsignatura)rol,
                        Semestre = asig.Semestre,
                        MetaLogroPorcentaje = 70.0,
                        DocenteId = docentesDisponibles[rol % docentesDisponibles.Count].Id,
                        LiderCalidadRaId = supRa,
                        IndicadoresDesempeno = new List<IndicadorDesempeno>
                        {
                            new() { Codigo = "ID1", Descripcion = "Reconoce conceptos técnicos fundamentales y su relación con problemas de la ingeniería." },
                            new() { Codigo = "ID2", Descripcion = "Interpreta datos experimentales o resultados científicos para analizar una situación técnica." },
                            new() { Codigo = "ID3", Descripcion = "Propone explicaciones o soluciones iniciales a un problema a partir de conocimientos científicos." }
                        }
                    });
                }
            }
        }

        // 6. Guardar o actualizar en base de datos
        if (planExistente != null)
        {
            planExistente.LiderProgramaId = usuarioActualId;
            planExistente.FechaActualizacion = DateTime.UtcNow;
            planExistente.EstaActivo = true;
            planExistente.ProgramaAcademicoId = progId;

            // Reemplazar asignaturas
            planExistente.AsignaturasPlan.Clear();
            foreach (var asig in listaAsignaturasFinal)
            {
                planExistente.AsignaturasPlan.Add(asig);
            }

            _repositorioPlan.Actualizar(planExistente);
            await _unidadDeTrabajo.GuardarCambiosAsync();
            return await ObtenerPorIdAsync(planExistente.Id);
        }
        else
        {
            var plan = new PlanAssessment
            {
                PeriodoAcademicoId = periodo.Id,
                ProgramaAcademicoId = progId,
                LiderProgramaId = usuarioActualId,
                Estado = EstadoEvaluacion.Pendiente,
                AsignaturasPlan = listaAsignaturasFinal
            };

            await _repositorioPlan.AgregarAsync(plan);
            await _unidadDeTrabajo.GuardarCambiosAsync();
            return await ObtenerPorIdAsync(plan.Id);
        }
    }

    public async Task<PlanAssessmentRespuestaDto> ObtenerPorIdAsync(Guid id)
    {
        var plan = await _repositorioPlan.Consultar()
            .Include(p => p.PeriodoAcademico)
            .Include(p => p.ProgramaAcademico)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.ResultadoAprendizaje)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Asignatura)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Docente)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.LiderCalidadRa)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.IndicadoresDesempeno)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo);

        if (plan == null)
        {
            throw new NoEncontradoException($"El Plan de Assessment con ID '{id}' no fue encontrado.");
        }

        return MapearADto(plan);
    }

    public async Task<PlanAssessmentRespuestaDto?> ObtenerPorPeriodoAcademicoAsync(Guid periodoAcademicoId)
    {
        var plan = await _repositorioPlan.Consultar()
            .Include(p => p.PeriodoAcademico)
            .Include(p => p.ProgramaAcademico)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.ResultadoAprendizaje)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Asignatura)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.Docente)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.LiderCalidadRa)
            .Include(p => p.AsignaturasPlan)
                .ThenInclude(ap => ap.IndicadoresDesempeno)
            .FirstOrDefaultAsync(p => p.PeriodoAcademicoId == periodoAcademicoId && p.EstaActivo);

        return plan == null ? null : MapearADto(plan);
    }

    private static PlanAssessmentRespuestaDto MapearADto(PlanAssessment plan)
    {
        return new PlanAssessmentRespuestaDto(
            plan.Id,
            plan.PeriodoAcademicoId,
            plan.PeriodoAcademico?.Codigo ?? string.Empty,
            plan.ProgramaAcademicoId,
            plan.ProgramaAcademico?.Nombre,
            plan.Estado,
            plan.AsignaturasPlan.Count,
            plan.FechaCreacion,
            plan.AsignaturasPlan.Select(ap => new DetalleAsignaturaPlanDto(
                ap.Id,
                ap.ResultadoAprendizajeId,
                ap.ResultadoAprendizaje?.Codigo ?? string.Empty,
                ap.AsignaturaId,
                ap.Asignatura?.Codigo ?? string.Empty,
                ap.Asignatura?.Nombre ?? string.Empty,
                ap.RolEvaluacion,
                ap.Semestre,
                ap.MetaLogroPorcentaje,
                ap.DocenteId,
                $"{ap.Docente?.Nombres} {ap.Docente?.Apellidos}".Trim(),
                ap.LiderCalidadRaId,
                $"{ap.LiderCalidadRa?.Nombres} {ap.LiderCalidadRa?.Apellidos}".Trim(),
                ap.IndicadoresDesempeno.Select(i => new DetalleIndicadorDesempenoDto(
                    i.Id,
                    i.Codigo,
                    i.Descripcion
                )).ToList()
            )).ToList()
        );
    }
}
