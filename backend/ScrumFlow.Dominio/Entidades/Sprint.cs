namespace ScrumFlow.Dominio.Entidades;

public sealed class Sprint
{
    public long SprintId { get; set; }
    public long ProyectoId { get; set; }
    public string Estado { get; set; } = "BORRADOR";
    public ICollection<ElementoSprint> ElementosSprint { get; set; } = new List<ElementoSprint>();
}
