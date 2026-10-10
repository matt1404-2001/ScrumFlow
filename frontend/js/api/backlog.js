const backlogsSimulados = {
  "101": {
    projectId: 101,
    productGoal: "Simplificar la organización y el seguimiento del trabajo Scrum.",
    items: [
      {
        elementoBacklogId: 41,
        titulo: "Inicio de sesión seguro",
        descripcion: "Permitir que las personas accedan al espacio de sus proyectos con sus credenciales.",
        prioridad: "ALTA",
        posicion: 1,
        estimacion: 5,
        criteriosAceptacion: "El acceso rechaza credenciales incorrectas.\nLa sesión permanece activa al recargar la página.",
        preparado: true,
        faltantesPreparacion: [],
        retirado: false,
        sprintActualId: null,
        historialSprintIds: []
      },
      {
        elementoBacklogId: 42,
        titulo: "Registro de nuevos usuarios",
        descripcion: "Crear una cuenta desde la página pública y confirmar los datos ingresados.",
        prioridad: "ALTA",
        posicion: 2,
        estimacion: 3,
        criteriosAceptacion: "El correo debe tener un formato válido.\nLa contraseña y su confirmación deben coincidir.",
        preparado: true,
        faltantesPreparacion: [],
        retirado: false,
        sprintActualId: null,
        historialSprintIds: []
      },
      {
        elementoBacklogId: 43,
        titulo: "Invitaciones al equipo",
        descripcion: "Permitir al administrador invitar personas al proyecto mediante su correo.",
        prioridad: "MEDIA",
        posicion: 3,
        estimacion: 8,
        criteriosAceptacion: "La invitación queda visible como pendiente.\nNo se crean invitaciones duplicadas para el mismo proyecto.",
        preparado: true,
        faltantesPreparacion: [],
        retirado: false,
        sprintActualId: null,
        historialSprintIds: []
      },
      {
        elementoBacklogId: 44,
        titulo: "Exportar resumen del proyecto",
        descripcion: null,
        prioridad: "BAJA",
        posicion: 4,
        estimacion: null,
        criteriosAceptacion: null,
        preparado: false,
        faltantesPreparacion: ["descripcion", "estimacion"],
        retirado: false,
        sprintActualId: null,
        historialSprintIds: [6998]
      }
    ]
  },
  "204": {
    projectId: 204,
    productGoal: "Reducir el tiempo necesario para dar seguimiento a oportunidades.",
    items: [
      {
        elementoBacklogId: 61,
        titulo: "Vista unificada de oportunidades",
        descripcion: "Consultar las oportunidades activas y su información principal en un único lugar.",
        prioridad: "ALTA",
        posicion: 1,
        estimacion: 8,
        criteriosAceptacion: "Las oportunidades se muestran en orden de actualización.",
        preparado: true,
        faltantesPreparacion: [],
        retirado: false,
        sprintActualId: null
      }
    ]
  },
  "318": { projectId: 318, productGoal: null, items: [] }
};
const proyectosAdministrados = new Set(["101", "318"]);
const proyectosConProductOwner = new Set(["101", "204"]);

let siguienteId = 100;

function obtenerDatos(projectId) {
  const datos = backlogsSimulados[String(projectId)];
  if (!datos) throw new Error("No fue posible encontrar el proyecto.");
  return datos;
}

function recalcularPreparacion(item) {
  const faltantes = [];
  if (!item.descripcion?.trim()) faltantes.push("descripcion");
  if (!item.estimacion) faltantes.push("estimacion");
  item.faltantesPreparacion = faltantes;
  item.preparado = faltantes.length === 0;
}

function normalizarPosiciones(items) {
  items.forEach((item, indice) => { item.posicion = indice + 1; });
}

export async function obtenerProductBacklog(projectId) {
  return structuredClone(obtenerDatos(projectId));
}

export async function actualizarProductGoal(projectId, productGoal) {
  if (!proyectosConProductOwner.has(String(projectId))) throw new Error("Solo el Product Owner puede actualizar el Product Goal");
  const backlog = obtenerDatos(projectId);
  backlog.productGoal = productGoal.trim() || null;
  return { projectId: backlog.projectId, productGoal: backlog.productGoal };
}

export async function crearElementoBacklog(projectId, datos) {
  const backlog = obtenerDatos(projectId);
  const item = {
    elementoBacklogId: siguienteId++,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion?.trim() || null,
    prioridad: datos.prioridad,
    posicion: backlog.items.length + 1,
    estimacion: null,
    criteriosAceptacion: null,
    preparado: false,
    faltantesPreparacion: ["estimacion"],
    retirado: false,
    sprintActualId: null
  };
  recalcularPreparacion(item);
  backlog.items.push(item);
  return structuredClone(item);
}

export async function actualizarElementoBacklog(projectId, itemId, cambios) {
  const item = obtenerDatos(projectId).items.find((actual) => actual.elementoBacklogId === Number(itemId));
  Object.assign(item, cambios);
  recalcularPreparacion(item);
  return structuredClone(item);
}

export async function reordenarProductBacklog(projectId, orden) {
  const backlog = obtenerDatos(projectId);
  const posiciones = new Map(orden.map((item) => [item.elementoBacklogId, item.posicion]));
  backlog.items.sort((a, b) => posiciones.get(a.elementoBacklogId) - posiciones.get(b.elementoBacklogId));
  normalizarPosiciones(backlog.items);
  return backlog.items.map(({ elementoBacklogId, posicion }) => ({ elementoBacklogId, posicion }));
}

export async function dividirElementoBacklog(projectId, itemId, partes) {
  const backlog = obtenerDatos(projectId);
  const indice = backlog.items.findIndex((item) => item.elementoBacklogId === Number(itemId));
  const original = backlog.items[indice];
  const nuevos = partes.map((parte) => {
    const item = {
      elementoBacklogId: siguienteId++,
      titulo: parte.titulo.trim(),
      descripcion: null,
      prioridad: original.prioridad,
      posicion: 0,
      estimacion: null,
      criteriosAceptacion: null,
      preparado: false,
      faltantesPreparacion: ["descripcion", "estimacion"],
      retirado: false,
      sprintActualId: null
    };
    return item;
  });
  backlog.items.splice(indice, 1, ...nuevos);
  normalizarPosiciones(backlog.items);
  return { originalItemId: original.elementoBacklogId, originalRetirado: true, createdItems: structuredClone(nuevos) };
}

// Equivale a DELETE /api/proyectos/{projectId}/backlog/{itemId}.
export async function retirarElementoBacklog(projectId, itemId) {
  if (!proyectosAdministrados.has(String(projectId))) throw new Error("No tienes permiso para realizar esta acción.");
  const backlog = obtenerDatos(projectId);
  const indice = backlog.items.findIndex((item) => item.elementoBacklogId === Number(itemId));
  const item = backlog.items[indice];
  if (!item) throw new Error("No fue posible encontrar el elemento.");
  if (item.sprintActualId) throw new Error("El elemento no puede retirarse mientras pertenezca a un Sprint activo");

  if (item.historialSprintIds?.length || item.retirado) {
    item.retirado = true;
    return { elementoBacklogId: item.elementoBacklogId, resultado: "RETIRADO" };
  }

  backlog.items.splice(indice, 1);
  normalizarPosiciones(backlog.items);
  return { elementoBacklogId: item.elementoBacklogId, resultado: "ELIMINADO" };
}
