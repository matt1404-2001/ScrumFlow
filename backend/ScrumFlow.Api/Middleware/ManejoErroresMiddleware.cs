using System.Text.Json;
using ScrumFlow.Aplicacion.Servicios;

namespace ScrumFlow.Api.Middleware;

public sealed class ManejoErroresMiddleware(RequestDelegate siguiente, ILogger<ManejoErroresMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext contexto)
    {
        try { await siguiente(contexto); }
        catch (ErrorAplicacionException error)
        {
            contexto.Response.StatusCode = error.Tipo switch
            {
                TipoErrorAplicacion.SolicitudInvalida => StatusCodes.Status422UnprocessableEntity,
                TipoErrorAplicacion.NoAutorizado => StatusCodes.Status401Unauthorized,
                TipoErrorAplicacion.Prohibido => StatusCodes.Status403Forbidden,
                TipoErrorAplicacion.NoEncontrado => StatusCodes.Status404NotFound,
                TipoErrorAplicacion.Conflicto => StatusCodes.Status409Conflict,
                _ => StatusCodes.Status400BadRequest
            };
            await EscribirAsync(contexto, error.Message);
        }
        catch (InvalidOperationException error)
        {
            contexto.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            await EscribirAsync(contexto, error.Message);
        }
        catch (Exception error)
        {
            logger.LogError(error, "Error no controlado en la API");
            contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await EscribirAsync(contexto, "No fue posible actualizar el Product Backlog. Inténtalo nuevamente");
        }
    }

    private static async Task EscribirAsync(HttpContext contexto, string mensaje)
    {
        contexto.Response.ContentType = "application/json";
        await contexto.Response.WriteAsync(JsonSerializer.Serialize(new { code = contexto.Response.StatusCode.ToString(), message = mensaje }));
    }
}
