using Microsoft.EntityFrameworkCore;
using ScrumFlow.Aplicacion.Interfaces;
using ScrumFlow.Aplicacion.Modelos;
using ScrumFlow.Dominio.Entidades;
using ScrumFlow.Dominio.Enumeraciones;

namespace ScrumFlow.Aplicacion.Servicios;

public sealed class ProductBacklogServicio(IProductBacklogDbContext db, IAccesoProyecto acceso) : IProductBacklogServicio
{
    public async Task<BacklogModelo> ObtenerAsync(long proyectoId, bool incluirRetirados, CancellationToken ct)
    {
        await acceso.VerificarMiembroAsync(proyectoId, ct);
        var proyecto = await db.Proyectos.AsNoTracking().Include(p => p.ElementosBacklog).ThenInclude(i => i.ElementosSprint).ThenInclude(e => e.Sprint)
            .SingleOrDefaultAsync(p => p.ProyectoId == proyectoId, ct) ?? throw NoEncontrado("No fue posible encontrar el proyecto.");
        return new(proyectoId, proyecto.ProductGoal, proyecto.ElementosBacklog.Where(i => incluirRetirados || !i.Retirado)
            .OrderBy(i => i.Posicion).Select(Mapear).ToList());
    }

    public async Task<ElementoBacklogModelo> CrearAsync(long proyectoId, CrearElementoModelo modelo, CancellationToken ct)
    {
        await acceso.VerificarMiembroAsync(proyectoId, ct);
        ValidarTitulo(modelo.Titulo);
        var proyectoExiste = await db.Proyectos.AnyAsync(p => p.ProyectoId == proyectoId, ct);
        if (!proyectoExiste) throw NoEncontrado("No fue posible encontrar el proyecto.");
        var posicion = (await db.ElementosBacklog.Where(i => i.ProyectoId == proyectoId && !i.Retirado).MaxAsync(i => (int?)i.Posicion, ct) ?? 0) + 1;
        var entidad = new ElementoBacklog { ProyectoId = proyectoId, Titulo = modelo.Titulo.Trim(), Descripcion = Normalizar(modelo.Descripcion), Prioridad = ATexto(modelo.Prioridad), Posicion = posicion };
        db.ElementosBacklog.Add(entidad);
        await db.SaveChangesAsync(ct);
        return Mapear(entidad);
    }

    public async Task<(long ProyectoId, string? ProductGoal)> ActualizarProductGoalAsync(long proyectoId, string? productGoal, CancellationToken ct)
    {
        await acceso.VerificarProductOwnerAsync(proyectoId, ct);
        var proyecto = await db.Proyectos.SingleOrDefaultAsync(p => p.ProyectoId == proyectoId, ct) ?? throw NoEncontrado("No fue posible encontrar el proyecto.");
        proyecto.ProductGoal = Normalizar(productGoal);
        await db.SaveChangesAsync(ct);
        return (proyectoId, proyecto.ProductGoal);
    }

    public async Task<ElementoBacklogModelo> ActualizarAsync(long proyectoId, long elementoId, ActualizarElementoModelo modelo, CancellationToken ct)
    {
        await acceso.VerificarMiembroAsync(proyectoId, ct);
        if (!modelo.TituloEspecificado && !modelo.DescripcionEspecificada && !modelo.PrioridadEspecificada && !modelo.EstimacionEspecificada && !modelo.CriteriosEspecificados)
            throw Invalido("La solicitud debe incluir al menos un campo.");
        var entidad = await db.ElementosBacklog.SingleOrDefaultAsync(i => i.ProyectoId == proyectoId && i.ElementoBacklogId == elementoId, ct) ?? throw NoEncontrado("No fue posible encontrar el elemento.");
        if (entidad.Retirado) throw Conflicto("El elemento ya fue retirado del Product Backlog.");
        if (modelo.TituloEspecificado) { ValidarTitulo(modelo.Titulo); entidad.Titulo = modelo.Titulo!.Trim(); }
        if (modelo.DescripcionEspecificada) entidad.Descripcion = Normalizar(modelo.Descripcion);
        if (modelo.PrioridadEspecificada) entidad.Prioridad = ATexto(modelo.Prioridad!.Value);
        if (modelo.EstimacionEspecificada && modelo.Estimacion is <= 0) throw Invalido("La estimación debe ser mayor que cero.");
        if (modelo.EstimacionEspecificada) entidad.Estimacion = modelo.Estimacion;
        if (modelo.CriteriosEspecificados) entidad.CriteriosAceptacion = Normalizar(modelo.CriteriosAceptacion);
        await db.SaveChangesAsync(ct);
        return Mapear(entidad);
    }

    public async Task<ResultadoRetiroModelo> RetirarAsync(long proyectoId, long elementoId, CancellationToken ct)
    {
        await acceso.VerificarAdministradorAsync(proyectoId, ct);
        var entidad = await db.ElementosBacklog.Include(i => i.ElementosSprint).ThenInclude(e => e.Sprint)
            .SingleOrDefaultAsync(i => i.ProyectoId == proyectoId && i.ElementoBacklogId == elementoId, ct) ?? throw NoEncontrado("No fue posible encontrar el elemento.");
        if (entidad.ElementosSprint.Any(e => e.Sprint.Estado == "ACTIVO")) throw Conflicto("El elemento no puede retirarse mientras pertenezca a un Sprint activo");
        if (entidad.Retirado) return new(elementoId, "RETIRADO");
        if (entidad.ElementosSprint.Count > 0)
        {
            entidad.Retirado = true;
            entidad.FechaRetiro = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return new(elementoId, "RETIRADO");
        }
        db.ElementosBacklog.Remove(entidad);
        await NormalizarPosicionesAsync(proyectoId, elementoId, ct);
        await db.SaveChangesAsync(ct);
        return new(elementoId, "ELIMINADO");
    }

    public async Task<IReadOnlyList<OrdenElementoModelo>> ReordenarAsync(long proyectoId, IReadOnlyList<OrdenElementoModelo> orden, CancellationToken ct)
    {
        await acceso.VerificarMiembroAsync(proyectoId, ct);
        var activos = await db.ElementosBacklog.Where(i => i.ProyectoId == proyectoId && !i.Retirado).ToListAsync(ct);
        if (orden.Count != activos.Count || orden.Select(x => x.ElementoBacklogId).Distinct().Count() != orden.Count || orden.Select(x => x.Posicion).OrderBy(x => x).SequenceEqual(Enumerable.Range(1, orden.Count)) == false)
            throw Invalido("El orden debe incluir una posición única para cada elemento activo.");
        var porId = activos.ToDictionary(i => i.ElementoBacklogId);
        foreach (var item in orden)
        {
            if (!porId.TryGetValue(item.ElementoBacklogId, out var entidad)) throw Invalido("El orden contiene un elemento que no pertenece al proyecto.");
            entidad.Posicion = item.Posicion;
        }
        await db.SaveChangesAsync(ct);
        return orden.OrderBy(x => x.Posicion).ToList();
    }

    private async Task NormalizarPosicionesAsync(long proyectoId, long elementoExcluidoId, CancellationToken ct)
    {
        var restantes = await db.ElementosBacklog.Where(i => i.ProyectoId == proyectoId && !i.Retirado && i.ElementoBacklogId != elementoExcluidoId).OrderBy(i => i.Posicion).ToListAsync(ct);
        for (var indice = 0; indice < restantes.Count; indice++) restantes[indice].Posicion = indice + 1;
    }

    private static ElementoBacklogModelo Mapear(ElementoBacklog i)
    {
        var faltantes = new List<string>();
        if (string.IsNullOrWhiteSpace(i.Descripcion)) faltantes.Add("descripcion");
        if (!i.Estimacion.HasValue) faltantes.Add("estimacion");
        return new(i.ElementoBacklogId, i.Titulo, i.Descripcion, i.Prioridad, i.Posicion, i.Estimacion, i.CriteriosAceptacion, faltantes.Count == 0, faltantes, i.Retirado, i.ElementosSprint.FirstOrDefault(e => e.Sprint.Estado == "ACTIVO")?.SprintId);
    }

    private static string ATexto(Prioridad prioridad) => prioridad switch { Prioridad.Baja => "BAJA", Prioridad.Media => "MEDIA", Prioridad.Alta => "ALTA", _ => throw Invalido("La prioridad no es válida.") };
    private static string? Normalizar(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
    private static void ValidarTitulo(string? titulo) { if (string.IsNullOrWhiteSpace(titulo)) throw Invalido("Ingresa un título para el elemento"); }
    private static ErrorAplicacionException Invalido(string mensaje) => new(TipoErrorAplicacion.SolicitudInvalida, mensaje);
    private static ErrorAplicacionException NoEncontrado(string mensaje) => new(TipoErrorAplicacion.NoEncontrado, mensaje);
    private static ErrorAplicacionException Conflicto(string mensaje) => new(TipoErrorAplicacion.Conflicto, mensaje);
}
