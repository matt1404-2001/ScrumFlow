using ScrumFlow.Aplicacion.Modelos;

namespace ScrumFlow.Aplicacion.Interfaces;

public interface IProductBacklogServicio
{
    Task<BacklogModelo> ObtenerAsync(long proyectoId, bool incluirRetirados, CancellationToken cancellationToken);

    Task<ElementoBacklogModelo> CrearAsync(long proyectoId, CrearElementoModelo modelo, CancellationToken cancellationToken);

    Task<(long ProyectoId, string? ProductGoal)> ActualizarProductGoalAsync(long proyectoId, string? productGoal, CancellationToken cancellationToken);

    Task<ElementoBacklogModelo> ActualizarAsync(long proyectoId, long elementoId, ActualizarElementoModelo modelo, CancellationToken cancellationToken);

    Task<ResultadoRetiroModelo> RetirarAsync(long proyectoId, long elementoId, CancellationToken cancellationToken);

    Task<IReadOnlyList<OrdenElementoModelo>> ReordenarAsync(long proyectoId, IReadOnlyList<OrdenElementoModelo> orden, CancellationToken cancellationToken);

    Task<ResultadoDivisionModelo> DividirAsync(long proyectoId, long elementoId, IReadOnlyList<ParteDivisionModelo> partes, CancellationToken cancellationToken);
}
