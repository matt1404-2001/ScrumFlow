namespace ScrumFlow.Dominio.Entidades;

public sealed class ElementoBacklog
{
    public long ElementoBacklogId { get; set; }
    public long ProyectoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Prioridad { get; set; } = "MEDIA";
    public int Posicion { get; set; }
    public int? Estimacion { get; set; }
    public string? CriteriosAceptacion { get; set; }
    public bool Retirado { get; set; }
    public DateTime? FechaRetiro { get; set; }
    public Proyecto Proyecto { get; set; } = null!;
    public ICollection<ElementoSprint> ElementosSprint { get; set; } = new List<ElementoSprint>();
}
