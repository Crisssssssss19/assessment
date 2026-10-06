using AssessmentSystem.Core.Interfaces;
using AssessmentSystem.DataAccess.Context;
using Microsoft.EntityFrameworkCore.Storage;

namespace AssessmentSystem.DataAccess.Repositories;

public class UnidadDeTrabajo : IUnidadDeTrabajo
{
    private readonly ContextoAplicacionDb _contexto;
    private IDbContextTransaction? _transaccionActual;

    public UnidadDeTrabajo(ContextoAplicacionDb contexto)
    {
        _contexto = contexto;
    }

    public async Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default)
    {
        return await _contexto.SaveChangesAsync(cancellationToken);
    }

    public async Task IniciarTransaccionAsync()
    {
        if (_transaccionActual != null) return;
        _transaccionActual = await _contexto.Database.BeginTransactionAsync();
    }

    public async Task ConfirmarTransaccionAsync()
    {
        try
        {
            await _contexto.SaveChangesAsync();
            if (_transaccionActual != null)
            {
                await _transaccionActual.CommitAsync();
            }
        }
        catch
        {
            await RevertirTransaccionAsync();
            throw;
        }
        finally
        {
            if (_transaccionActual != null)
            {
                await _transaccionActual.DisposeAsync();
                _transaccionActual = null;
            }
        }
    }

    public async Task RevertirTransaccionAsync()
    {
        if (_transaccionActual != null)
        {
            await _transaccionActual.RollbackAsync();
            await _transaccionActual.DisposeAsync();
            _transaccionActual = null;
        }
    }

    public void Dispose()
    {
        _transaccionActual?.Dispose();
        _contexto.Dispose();
        GC.SuppressFinalize(this);
    }
}
