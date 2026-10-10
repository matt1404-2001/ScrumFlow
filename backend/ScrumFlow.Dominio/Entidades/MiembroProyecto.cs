namespace ScrumFlow.Dominio.Entidades;

public sealed class MiembroProyecto
{
    public long MiembroProyectoId { get; set; }
    public long ProyectoId { get; set; }
    public long UsuarioId { get; set; }
    public bool EsAdministrador { get; set; }
    public bool EsProductOwner { get; set; }
    public bool EsDeveloper { get; set; }
    public bool Activo { get; set; }
    public Proyecto Proyecto { get; set; } = null!;
}
