namespace ScrumFlow.Aplicacion.Servicios;

public enum TipoErrorAplicacion { SolicitudInvalida, NoAutorizado, Prohibido, NoEncontrado, Conflicto }

public sealed class ErrorAplicacionException(TipoErrorAplicacion tipo, string mensaje) : Exception(mensaje)
{
    public TipoErrorAplicacion Tipo { get; } = tipo;
}
