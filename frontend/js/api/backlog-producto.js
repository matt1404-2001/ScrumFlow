import { solicitarApi } from "../configuracion/api.js";

export async function obtenerProductBacklog(projectId) {
  return solicitarApi(`/api/proyectos/${projectId}/backlog`);
}

export async function actualizarProductGoal(projectId, productGoal) {
  return solicitarApi(`/api/proyectos/${projectId}/objetivo-producto`, {
    method: "PUT",
    body: JSON.stringify({ productGoal: productGoal.trim() || null })
  });
}

export async function crearElementoBacklog(projectId, datos) {
  return solicitarApi(`/api/proyectos/${projectId}/backlog`, {
    method: "POST",
    body: JSON.stringify({ titulo: datos.titulo, descripcion: datos.descripcion || null, prioridad: datos.prioridad })
  });
}

export async function actualizarElementoBacklog(projectId, itemId, cambios) {
  return solicitarApi(`/api/proyectos/${projectId}/backlog/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(cambios)
  });
}

export async function reordenarProductBacklog(projectId, orden) {
  return solicitarApi(`/api/proyectos/${projectId}/backlog/orden`, {
    method: "PUT",
    body: JSON.stringify({ items: orden })
  });
}

export async function retirarElementoBacklog(projectId, itemId) {
  return solicitarApi(`/api/proyectos/${projectId}/backlog/${itemId}`, { method: "DELETE" });
}
