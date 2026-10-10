namespace ScrumFlow.Dominio.Entidades;

public sealed class ElementoSprint
{
    public long ElementoSprintId { get; set; }
    public long SprintId { get; set; }
    public long ElementoBacklogId { get; set; }
    public Sprint Sprint { get; set; } = null!;
    public ElementoBacklog ElementoBacklog { get; set; } = null!;
}
