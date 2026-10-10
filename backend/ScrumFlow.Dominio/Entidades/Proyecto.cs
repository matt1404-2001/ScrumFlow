namespace ScrumFlow.Dominio.Entidades;

public sealed class Proyecto
{
    public long ProyectoId { get; set; }
    public string? ProductGoal { get; set; }
    public ICollection<ElementoBacklog> ElementosBacklog { get; set; } = new List<ElementoBacklog>();
    public ICollection<MiembroProyecto> Miembros { get; set; } = new List<MiembroProyecto>();
}
