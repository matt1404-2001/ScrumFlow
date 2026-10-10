using Microsoft.EntityFrameworkCore;
using ScrumFlow.Aplicacion.Interfaces;
using ScrumFlow.Aplicacion.Servicios;
using ScrumFlow.Dominio.Entidades;
using ScrumFlow.Infraestructura.Datos;

namespace ScrumFlow.Infraestructura.Repositorios;

public sealed class AccesoProyecto(ScrumFlowDbContext db, IUsuarioActual usuarioActual) : IAccesoProyecto
{
    public Task VerificarMiembroAsync(long proyectoId, CancellationToken ct) => VerificarAsync(proyectoId, _ => true, "No tienes acceso a este proyecto.", ct);
    public Task VerificarProductOwnerAsync(long proyectoId, CancellationToken ct) => VerificarAsync(proyectoId, miembro => miembro.EsProductOwner, "Solo el Product Owner puede actualizar el Product Goal.", ct);
    public Task VerificarAdministradorAsync(long proyectoId, CancellationToken ct) => VerificarAsync(proyectoId, miembro => miembro.EsAdministrador, "No tienes permiso para realizar esta acción.", ct);

    private async Task VerificarAsync(long proyectoId, Func<MiembroProyecto, bool> regla, string mensaje, CancellationToken ct)
    {
        if (usuarioActual.UsuarioId is null) return; // CU-01/CU-02 conectarán la identidad JWT.
        var miembro = await db.MiembrosProyecto.AsNoTracking().SingleOrDefaultAsync(x => x.ProyectoId == proyectoId && x.UsuarioId == usuarioActual.UsuarioId && x.Activo, ct);
        if (miembro is null || !regla(miembro)) throw new ErrorAplicacionException(TipoErrorAplicacion.Prohibido, mensaje);
    }
}
