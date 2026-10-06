using System.Linq.Expressions;
using AssessmentSystem.Core.Entities;

namespace AssessmentSystem.Core.Interfaces;

public interface IRepositorio<T> where T : EntidadBase
{
    Task<T?> ObtenerPorIdAsync(Guid id);
    Task<IEnumerable<T>> ObtenerTodosAsync();
    IQueryable<T> Consultar(params Expression<Func<T, object>>[] inclusiones);
    Task AgregarAsync(T entidad);
    Task AgregarRangoAsync(IEnumerable<T> entidades);
    void Actualizar(T entidad);
    void Eliminar(T entidad);
    Task<bool> ExisteAsync(Expression<Func<T, bool>> predicado);
}
