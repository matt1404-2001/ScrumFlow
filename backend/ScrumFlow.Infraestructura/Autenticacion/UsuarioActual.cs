using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using ScrumFlow.Aplicacion.Interfaces;

namespace ScrumFlow.Infraestructura.Autenticacion;

public sealed class UsuarioActual(IHttpContextAccessor httpContextAccessor) : IUsuarioActual
{
    public long? UsuarioId
    {
        get
        {
            var valor = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
            return long.TryParse(valor, out var id) && id > 0 ? id : null;
        }
    }
}
