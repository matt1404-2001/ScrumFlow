namespace ScrumFlow.Api.DTOs;

public sealed class CrearElementoDto
{
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Prioridad { get; set; }
}

public sealed class ProductGoalDto
{
    public string? ProductGoal { get; set; }
}

public sealed class ActualizarElementoDto
{
    private string? _titulo;
    private string? _descripcion;
    private string? _prioridad;
    private int? _estimacion;
    private string? _criteriosAceptacion;
    public string? Titulo { get => _titulo; set { _titulo = value; TituloEspecificado = true; } }
    public string? Descripcion { get => _descripcion; set { _descripcion = value; DescripcionEspecificada = true; } }
    public string? Prioridad { get => _prioridad; set { _prioridad = value; PrioridadEspecificada = true; } }
    public int? Estimacion { get => _estimacion; set { _estimacion = value; EstimacionEspecificada = true; } }
    public string? CriteriosAceptacion { get => _criteriosAceptacion; set { _criteriosAceptacion = value; CriteriosEspecificados = true; } }
    public bool TituloEspecificado { get; private set; }
    public bool DescripcionEspecificada { get; private set; }
    public bool PrioridadEspecificada { get; private set; }
    public bool EstimacionEspecificada { get; private set; }
    public bool CriteriosEspecificados { get; private set; }
}

public sealed class OrdenDto
{
    public long ElementoBacklogId { get; set; }
    public int Posicion { get; set; }
}

public sealed class OrdenRequestDto
{
    public List<OrdenDto>? Items { get; set; }
}

public sealed record ElementoBacklogDto(long ElementoBacklogId, string Titulo, string? Descripcion, string Prioridad, int Posicion, int? Estimacion, string? CriteriosAceptacion, bool Preparado, IReadOnlyList<string> FaltantesPreparacion, bool Retirado, long? SprintActualId);
public sealed record BacklogResponseDto(long ProjectId, string? ProductGoal, IReadOnlyList<ElementoBacklogDto> Items);
public sealed record ProductGoalResponseDto(long ProjectId, string? ProductGoal);
public sealed record RetiroResponseDto(long ElementoBacklogId, string Resultado);
