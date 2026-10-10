const proyectosSimulados = [
  {
    projectId: 101,
    nombre: "Sistema de Gestión Scrum",
    descripcion: "Plataforma académica para organizar el trabajo y los eventos de un equipo Scrum.",
    esAdministrador: true,
    esProductOwner: true,
    estado: "Sprint activo"
  },
  {
    projectId: 204,
    nombre: "Portal de Ventas",
    descripcion: "Mejoras al proceso comercial y seguimiento de oportunidades del equipo.",
    esAdministrador: false,
    esProductOwner: true,
    estado: "Sin Sprint activo"
  },
  {
    projectId: 318,
    nombre: "Experiencia de Clientes",
    descripcion: "Iniciativas para simplificar el acompañamiento y la atención posterior a la compra.",
    esAdministrador: true,
    esProductOwner: false,
    estado: "Sin Sprint activo"
  }
];

const invitacionesSimuladas = [
  {
    invitationId: 42,
    project: { projectId: 412, nombre: "Aplicación de Inventario" },
    invitadoPor: { nombre: "Carlos Méndez" },
    estado: "PENDIENTE",
    fechaCreacion: "2026-10-08T14:30:00Z"
  },
  {
    invitationId: 43,
    project: { projectId: 506, nombre: "Mejora de Operaciones" },
    invitadoPor: { nombre: "Ana Torres" },
    estado: "PENDIENTE",
    fechaCreacion: "2026-10-09T09:15:00Z"
  }
];

export async function obtenerProyectos() {
  return structuredClone(proyectosSimulados);
}

// Equivale a GET /api/invitaciones?estado=PENDIENTE.
export async function obtenerInvitacionesPendientes() {
  return structuredClone(invitacionesSimuladas.filter(({ estado }) => estado === "PENDIENTE"));
}

// Equivale a PATCH /api/invitaciones/{invitationId} con { decision }.
export async function responderInvitacion(invitationId, decision) {
  const indice = invitacionesSimuladas.findIndex((invitacion) => invitacion.invitationId === Number(invitationId));
  const invitacion = invitacionesSimuladas[indice];

  if (!invitacion || invitacion.estado !== "PENDIENTE") {
    throw new Error("La invitación ya no está disponible.");
  }

  invitacion.estado = decision === "ACEPTAR" ? "ACEPTADA" : "RECHAZADA";

  return {
    invitationId: invitacion.invitationId,
    estado: invitacion.estado,
    fechaRespuesta: new Date().toISOString(),
    membership: decision === "ACEPTAR"
      ? { projectId: invitacion.project.projectId, esAdministrador: false }
      : null,
    proyecto: decision === "ACEPTAR"
      ? {
          projectId: invitacion.project.projectId,
          nombre: invitacion.project.nombre,
          descripcion: "Proyecto Scrum al que ahora perteneces.",
          esAdministrador: false,
          estado: "Sin Sprint activo"
        }
      : null
  };
}

export async function crearProyecto(datos) {
  const proyecto = {
    projectId: Date.now(),
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    esAdministrador: true,
    estado: "Sin Sprint activo"
  };

  proyectosSimulados.unshift(proyecto);
  return structuredClone(proyecto);
}

// Equivale a GET /api/proyectos/{projectId}.
export async function obtenerProyecto(projectId) {
  const proyecto = proyectosSimulados.find(({ projectId: id }) => id === Number(projectId));
  if (!proyecto) throw new Error("No fue posible encontrar el proyecto.");
  return structuredClone({
    projectId: proyecto.projectId,
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion ?? null,
    productGoal: null,
    definitionOfDone: null,
    currentUserMembership: {
      esAdministrador: proyecto.esAdministrador,
      esProductOwner: proyecto.esProductOwner
    }
  });
}

// Equivale a PATCH /api/proyectos/{projectId} con nombre y/o descripcion.
export async function actualizarProyecto(projectId, cambios) {
  const proyecto = proyectosSimulados.find(({ projectId: id }) => id === Number(projectId));
  if (!proyecto) throw new Error("No fue posible encontrar el proyecto.");
  if (!proyecto.esAdministrador) throw new Error("No tienes permiso para realizar esta acción.");

  const nombre = cambios.nombre?.trim();
  if (Object.hasOwn(cambios, "nombre") && !nombre) throw new Error("Ingresa un nombre para el proyecto");
  if (nombre) proyecto.nombre = nombre;
  if (Object.hasOwn(cambios, "descripcion")) proyecto.descripcion = cambios.descripcion?.trim() || null;
  return obtenerProyecto(projectId);
}
