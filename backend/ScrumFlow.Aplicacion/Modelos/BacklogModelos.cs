using ScrumFlow.Dominio.Enumeraciones;

namespace ScrumFlow.Aplicacion.Modelos;

public sealed record CrearElementoModelo(string Titulo, string? Descripcion, Prioridad Prioridad);

public sealed record ActualizarElementoModelo(
    bool TituloEspecificado, string? Titulo,
    bool DescripcionEspecificada, string? Descripcion,
    bool PrioridadEspecificada, Prioridad? Prioridad,
    bool EstimacionEspecificada, int? Estimacion,
    bool CriteriosEspecificados, string? CriteriosAceptacion);

public sealed record OrdenElementoModelo(long ElementoBacklogId, int Posicion);

public sealed record ElementoBacklogModelo(
    long ElementoBacklogId, string Titulo, string? Descripcion, string Prioridad,
    int Posicion, int? Estimacion, string? CriteriosAceptacion, bool Preparado,
    IReadOnlyList<string> FaltantesPreparacion, bool Retirado, long? SprintActualId);

public sealed record BacklogModelo(long ProjectId, string? ProductGoal, IReadOnlyList<ElementoBacklogModelo> Items);

public sealed record ResultadoRetiroModelo(long ElementoBacklogId, string Resultado);
