namespace AssessmentSystem.Core.Interfaces;

public interface IUnidadDeTrabajo : IDisposable
{
    Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default);
    Task IniciarTransaccionAsync();
    Task ConfirmarTransaccionAsync();
    Task RevertirTransaccionAsync();
}
