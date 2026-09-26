using System.Linq.Expressions;
using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Interfaces;
using AssessmentSystem.DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.DataAccess.Repositories;

public class Repositorio<T> : IRepositorio<T> where T : EntidadBase
{
    protected readonly ContextoAplicacionDb _contexto;
    protected readonly DbSet<T> _dbSet;

    public Repositorio(ContextoAplicacionDb contexto)
    {
        _contexto = contexto;
        _dbSet = contexto.Set<T>();
    }

    public async Task<T?> ObtenerPorIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> ObtenerTodosAsync()
    {
        return await _dbSet.Where(e => e.EstaActivo).ToListAsync();
    }

    public IQueryable<T> Consultar(params Expression<Func<T, object>>[] inclusiones)
    {
        IQueryable<T> consulta = _dbSet;
        foreach (var inclusion in inclusiones)
        {
            consulta = consulta.Include(inclusion);
        }
        return consulta;
    }

    public async Task AgregarAsync(T entidad)
    {
        await _dbSet.AddAsync(entidad);
    }

    public async Task AgregarRangoAsync(IEnumerable<T> entidades)
    {
        await _dbSet.AddRangeAsync(entidades);
    }

    public void Actualizar(T entidad)
    {
        entidad.FechaActualizacion = DateTime.UtcNow;
        _dbSet.Update(entidad);
    }

    public void Eliminar(T entidad)
    {
        entidad.EstaActivo = false;
        entidad.FechaActualizacion = DateTime.UtcNow;
        _dbSet.Update(entidad); // Borrado lógico
    }

    public async Task<bool> ExisteAsync(Expression<Func<T, bool>> predicado)
    {
        return await _dbSet.AnyAsync(predicado);
    }
}
