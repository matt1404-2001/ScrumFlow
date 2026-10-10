using Microsoft.AspNetCore.Mvc;
using ScrumFlow.Api.DTOs;
using ScrumFlow.Aplicacion.Interfaces;
using ScrumFlow.Aplicacion.Modelos;
using ScrumFlow.Dominio.Enumeraciones;

namespace ScrumFlow.Api.Controladores;

[ApiController]
[Route("api/proyectos/{projectId:long}")]
public sealed class BacklogController(IProductBacklogServicio servicio) : ControllerBase
{
    [HttpGet("backlog")]
    public async Task<ActionResult<BacklogResponseDto>> Obtener(long projectId, [FromQuery] bool includeRetired = false, CancellationToken ct = default)
    {
        var resultado = await servicio.ObtenerAsync(projectId, includeRetired, ct);
        return Ok(Mapear(resultado));
    }

    [HttpPost("backlog")]
    public async Task<ActionResult<ElementoBacklogDto>> Crear(long projectId, CrearElementoDto dto, CancellationToken ct)
    {
        var resultado = await servicio.CrearAsync(projectId, new(dto.Titulo ?? string.Empty, dto.Descripcion, ParsearPrioridad(dto.Prioridad)), ct);
        return CreatedAtAction(nameof(Obtener), new { projectId }, Mapear(resultado));
    }

    [HttpPut("objetivo-producto")]
    public async Task<ActionResult<ProductGoalResponseDto>> ActualizarGoal(long projectId, ProductGoalDto dto, CancellationToken ct)
    {
        var resultado = await servicio.ActualizarProductGoalAsync(projectId, dto.ProductGoal, ct);
        return Ok(new ProductGoalResponseDto(resultado.ProyectoId, resultado.ProductGoal));
    }

    [HttpPatch("backlog/{itemId:long}")]
    public async Task<ActionResult<ElementoBacklogDto>> Actualizar(long projectId, long itemId, ActualizarElementoDto dto, CancellationToken ct)
    {
        var modelo = new ActualizarElementoModelo(dto.TituloEspecificado, dto.Titulo, dto.DescripcionEspecificada, dto.Descripcion, dto.PrioridadEspecificada, dto.Prioridad is null ? null : ParsearPrioridad(dto.Prioridad), dto.EstimacionEspecificada, dto.Estimacion, dto.CriteriosEspecificados, dto.CriteriosAceptacion);
        return Ok(Mapear(await servicio.ActualizarAsync(projectId, itemId, modelo, ct)));
    }

    [HttpDelete("backlog/{itemId:long}")]
    public async Task<ActionResult<RetiroResponseDto>> Retirar(long projectId, long itemId, CancellationToken ct)
    {
        var resultado = await servicio.RetirarAsync(projectId, itemId, ct);
        return Ok(new RetiroResponseDto(resultado.ElementoBacklogId, resultado.Resultado));
    }

    [HttpPut("backlog/orden")]
    public async Task<ActionResult<IReadOnlyList<OrdenElementoModelo>>> Reordenar(long projectId, OrdenRequestDto dto, CancellationToken ct)
    {
        var orden = dto.Items?.Select(x => new OrdenElementoModelo(x.ElementoBacklogId, x.Posicion)).ToList() ?? [];
        return Ok(await servicio.ReordenarAsync(projectId, orden, ct));
    }

    private static Prioridad ParsearPrioridad(string? valor) => valor switch
    {
        "BAJA" => Prioridad.Baja,
        "MEDIA" => Prioridad.Media,
        "ALTA" => Prioridad.Alta,
        _ => throw new InvalidOperationException("La prioridad no es válida.")
    };

    private static BacklogResponseDto Mapear(BacklogModelo modelo) => new(modelo.ProjectId, modelo.ProductGoal, modelo.Items.Select(Mapear).ToList());
    private static ElementoBacklogDto Mapear(ElementoBacklogModelo modelo) => new(modelo.ElementoBacklogId, modelo.Titulo, modelo.Descripcion, modelo.Prioridad, modelo.Posicion, modelo.Estimacion, modelo.CriteriosAceptacion, modelo.Preparado, modelo.FaltantesPreparacion, modelo.Retirado, modelo.SprintActualId);
}
