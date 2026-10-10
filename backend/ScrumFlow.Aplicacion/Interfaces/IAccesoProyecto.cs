namespace ScrumFlow.Aplicacion.Interfaces;

public interface IAccesoProyecto
{
    Task VerificarMiembroAsync(long proyectoId, CancellationToken cancellationToken);
    Task VerificarDeveloperAsync(long proyectoId, CancellationToken cancellationToken);
    Task VerificarProductOwnerAsync(long proyectoId, CancellationToken cancellationToken);
    Task VerificarAdministradorAsync(long proyectoId, CancellationToken cancellationToken);
}
