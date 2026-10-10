export const API_BASE_URL = globalThis.SCRUMFLOW_API_BASE_URL ?? "http://localhost:5000";

export async function solicitarApi(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...(opciones.headers ?? {}) }
  });
  if (respuesta.ok) return respuesta.status === 204 ? null : respuesta.json();
  const cuerpo = await respuesta.json().catch(() => null);
  throw new Error(cuerpo?.message ?? "No fue posible actualizar el Product Backlog. Inténtalo nuevamente");
}
