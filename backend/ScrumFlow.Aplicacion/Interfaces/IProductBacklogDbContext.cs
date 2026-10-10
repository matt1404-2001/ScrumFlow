using Microsoft.EntityFrameworkCore;
using ScrumFlow.Dominio.Entidades;

namespace ScrumFlow.Aplicacion.Interfaces;

public interface IProductBacklogDbContext
{
    DbSet<Proyecto> Proyectos { get; }
    DbSet<ElementoBacklog> ElementosBacklog { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
