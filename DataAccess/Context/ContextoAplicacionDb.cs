using System.Reflection;
using AssessmentSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.DataAccess.Context;

public class ContextoAplicacionDb : DbContext
{
    public ContextoAplicacionDb(DbContextOptions<ContextoAplicacionDb> opciones) : base(opciones)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<ProgramaAcademico> ProgramasAcademicos => Set<ProgramaAcademico>();
    public DbSet<PeriodoAcademico> PeriodosAcademicos => Set<PeriodoAcademico>();
    public DbSet<ResultadoAprendizaje> ResultadosAprendizaje => Set<ResultadoAprendizaje>();
    public DbSet<Asignatura> Asignaturas => Set<Asignatura>();
    public DbSet<PlanAssessment> PlanesAssessment => Set<PlanAssessment>();
    public DbSet<AsignaturaPlanAssessment> AsignaturasPlanAssessment => Set<AsignaturaPlanAssessment>();
    public DbSet<IndicadorDesempeno> IndicadoresDesempeno => Set<IndicadorDesempeno>();
    public DbSet<Medicion> Mediciones => Set<Medicion>();
    public DbSet<Evidencia> Evidencias => Set<Evidencia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
