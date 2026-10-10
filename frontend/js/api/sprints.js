import { obtenerProductBacklog } from "./backlog.js";

const configuracionProyectos = {
  "101": { productGoal: true, definitionOfDone: true, productOwner: true, scrumMaster: true, developers: true },
  "204": { productGoal: true, definitionOfDone: true, productOwner: true, scrumMaster: true, developers: true },
  "318": { productGoal: false, definitionOfDone: false, productOwner: false, scrumMaster: false, developers: false }
};

const sprintsSimulados = {
  "101": {
    sprintId: 7001,
    projectId: 101,
    sprintGoal: "Completar el acceso seguro y habilitar la creación de cuentas",
    fechaInicio: "2026-10-12",
    fechaFin: "2026-10-23",
    estado: "EN_CIERRE",
    dodSnapshot: "El código fue revisado. Las pruebas pasan. Los criterios de aceptación se cumplen. La funcionalidad está integrada y documentada.",
    selectedItemIds: [41, 42, 43],
    fechaActivacion: "2026-10-12T08:30:00Z",
    fechaInicioCierre: "2026-10-23T16:40:00Z",
    fechaFinalizacion: null
  },
  "204": null,
  "402": {
    sprintId: 7002,
    projectId: 402,
    sprintGoal: "Centralizar el seguimiento de oportunidades activas",
    fechaInicio: "2026-10-12",
    fechaFin: "2026-10-23",
    estado: "BORRADOR",
    dodSnapshot: null,
    selectedItemIds: [61]
  },
  "318": null
};

const sprintsFinalizadosSimulados = {
  "204": {
    sprintId: 6998,
    projectId: 204,
    sprintGoal: "Validar el flujo comercial y unificar el seguimiento de oportunidades",
    fechaInicio: "2026-09-21",
    fechaFin: "2026-10-02",
    estado: "FINALIZADO",
    dodSnapshot: "Los criterios de aceptación se cumplen y el cambio está validado por el equipo.",
    fechaActivacion: "2026-09-21T08:15:00Z",
    fechaInicioCierre: "2026-10-02T15:30:00Z",
    fechaFinalizacion: "2026-10-03T17:05:00Z",
    selectedItems: [
      { elementoBacklogId: 61, titulo: "Vista unificada de oportunidades", estimacion: 8 },
      { elementoBacklogId: 62, titulo: "Detalle de oportunidad comercial", estimacion: 5 },
      { elementoBacklogId: 63, titulo: "Filtros por etapa y responsable", estimacion: 3 }
    ],
    estimacionTotal: 16,
    cantidadElementos: 3,
    faltantesActivacion: []
  }
};

const cierresSimulados = {
  "7001": {
    boardReadOnly: true,
    review: {
      sprintReviewId: 8101,
      sprintId: 7001,
      estado: "BORRADOR",
      participantes: "María López, Juan Pérez y Sofía Ramírez",
      stakeholdersExternos: null,
      resultados: "Se presentó el registro de usuarios y se revisó el avance del acceso seguro.",
      retroalimentacion: null,
      decisiones: null,
      conclusion: null,
      completadaPor: null,
      fechaCompletada: null
    },
    retrospective: null,
    incrementItems: [
      { elementoSprintId: 502, elementoBacklogId: 42, titulo: "Registro de nuevos usuarios", dodConfirmado: true }
    ],
    incompleteItems: [
      { elementoSprintId: 501, elementoBacklogId: 41, titulo: "Inicio de sesión seguro", estado: "EN_PROGRESO" },
      { elementoSprintId: 503, elementoBacklogId: 43, titulo: "Invitaciones al equipo", estado: "PENDIENTE" }
    ]
  },
  "6998": {
    boardReadOnly: true,
    review: {
      sprintReviewId: 8098,
      sprintId: 6998,
      estado: "COMPLETADA",
      participantes: "María López, Diego Soto y Laura Méndez",
      stakeholdersExternos: "Responsable comercial",
      resultados: "El equipo presentó la vista unificada y el detalle de oportunidades con datos representativos.",
      retroalimentacion: "Priorizar filtros guardados y mejorar la lectura de oportunidades sin actividad reciente.",
      decisiones: "Los filtros guardados se incorporarán al Product Backlog para refinamiento.",
      conclusion: "El incremento permite seguir el ciclo comercial desde una única vista.",
      completadaPor: { miembroProyectoId: 21, userId: 1, nombre: "María López" },
      fechaCompletada: "2026-10-03T11:20:00Z"
    },
    retrospective: {
      sprintRetrospectiveId: 9098,
      sprintId: 6998,
      estado: "COMPLETADA",
      participantes: "María López, Diego Soto y Laura Méndez",
      aspectosPositivos: "Las validaciones tempranas con el área comercial redujeron retrabajo.",
      problemas: "La definición de los filtros llegó tarde y afectó el último elemento.",
      propuestas: "Acordar ejemplos de búsqueda antes de iniciar el desarrollo.",
      conclusion: "El equipo mantendrá una validación funcional a mitad del próximo Sprint.",
      accionesMejora: [
        { accionMejoraId: 9201, descripcion: "Preparar ejemplos de búsqueda durante el refinamiento", posicion: 1, elementoBacklogId: 70 }
      ],
      completadaPor: { miembroProyectoId: 21, userId: 1, nombre: "María López" },
      fechaCompletada: "2026-10-03T17:05:00Z"
    },
    incrementItems: [
      { elementoSprintId: 601, elementoBacklogId: 61, titulo: "Vista unificada de oportunidades", dodConfirmado: true },
      { elementoSprintId: 602, elementoBacklogId: 62, titulo: "Detalle de oportunidad comercial", dodConfirmado: true }
    ],
    incompleteItems: [
      { elementoSprintId: 603, elementoBacklogId: 63, titulo: "Filtros por etapa y responsable", estado: "EN_PROGRESO" }
    ]
  }
};

let siguienteSprintId = 7100;
let siguienteChecklistId = 900;
let siguienteComentarioId = 1200;
let siguienteImpedimentoId = 1500;

const equiposSimulados = {
  "101": {
    members: [
      { miembroProyectoId: 11, usuario: { userId: 1, nombre: "María López", correo: "maria@example.com" }, esAdministrador: true, esProductOwner: true, esScrumMaster: false, esDeveloper: false, activo: true },
      { miembroProyectoId: 12, usuario: { userId: 2, nombre: "Juan Pérez", correo: "juan@example.com" }, esAdministrador: false, esProductOwner: false, esScrumMaster: true, esDeveloper: true, activo: true },
      { miembroProyectoId: 13, usuario: { userId: 3, nombre: "Sofía Ramírez", correo: "sofia@example.com" }, esAdministrador: false, esProductOwner: false, esScrumMaster: false, esDeveloper: true, activo: true }
    ],
    definitionOfDone: "El código fue revisado. Las pruebas pasan. Los criterios de aceptación se cumplen. La funcionalidad está integrada y documentada.",
    pendingInvitations: []
  },
  "204": {
    members: [
      { miembroProyectoId: 21, usuario: { userId: 1, nombre: "María López", correo: "maria@example.com" }, esAdministrador: false, esProductOwner: true, esScrumMaster: false, esDeveloper: true, activo: true }
    ],
    definitionOfDone: "Los criterios de aceptación se cumplen y el cambio está validado por el equipo.",
    pendingInvitations: []
  }
};

const tablerosSimulados = {
  "101": {
    items: [
      {
        elementoSprintId: 501,
        elementoBacklogId: 41,
        titulo: "Inicio de sesión seguro",
        prioridad: "ALTA",
        estimacion: 5,
        estado: "EN_PROGRESO",
        responsable: { miembroProyectoId: 12, userId: 2, nombre: "Juan Pérez" },
        fechaInicio: "2026-10-12",
        fechaLimite: "2026-10-17",
        dodConfirmado: false,
        dodConfirmadoPor: null,
        dodConfirmadoEn: null,
        descripcion: "Permitir que las personas accedan al espacio de sus proyectos con sus credenciales.",
        criteriosAceptacion: "El acceso rechaza credenciales incorrectas.\nLa sesión permanece activa al recargar la página.",
        definitionOfDone: "El código fue revisado. Las pruebas pasan. Los criterios de aceptación se cumplen. La funcionalidad está integrada y documentada.",
        checklist: [
          { checklistItemId: 801, descripcion: "Crear el endpoint de acceso", posicion: 1, completado: true },
          { checklistItemId: 802, descripcion: "Validar credenciales y errores", posicion: 2, completado: true },
          { checklistItemId: 803, descripcion: "Conectar el formulario", posicion: 3, completado: false }
        ],
        comments: [
          { comentarioId: 1001, autor: { miembroProyectoId: 11, userId: 1, nombre: "María López" }, contenido: "El flujo de error ya está validado. Falta revisar la persistencia de sesión.", fechaPublicacion: "2026-10-13T10:35:00Z" }
        ],
        impediments: []
      },
      {
        elementoSprintId: 502,
        elementoBacklogId: 42,
        titulo: "Registro de nuevos usuarios",
        prioridad: "ALTA",
        estimacion: 3,
        estado: "TERMINADO",
        responsable: { miembroProyectoId: 13, userId: 3, nombre: "Sofía Ramírez" },
        fechaInicio: "2026-10-12",
        fechaLimite: "2026-10-15",
        dodConfirmado: true,
        dodConfirmadoPor: { miembroProyectoId: 13, userId: 3, nombre: "Sofía Ramírez" },
        dodConfirmadoEn: "2026-10-15T16:20:00Z",
        descripcion: "Crear una cuenta desde la página pública y confirmar los datos ingresados.",
        criteriosAceptacion: "El correo debe tener un formato válido.\nLa contraseña y su confirmación deben coincidir.",
        definitionOfDone: "El código fue revisado. Las pruebas pasan. Los criterios de aceptación se cumplen. La funcionalidad está integrada y documentada.",
        checklist: [
          { checklistItemId: 804, descripcion: "Validar datos del formulario", posicion: 1, completado: true },
          { checklistItemId: 805, descripcion: "Crear la cuenta", posicion: 2, completado: true }
        ],
        comments: [],
        impediments: []
      },
      {
        elementoSprintId: 503,
        elementoBacklogId: 43,
        titulo: "Invitaciones al equipo",
        prioridad: "MEDIA",
        estimacion: 8,
        estado: "PENDIENTE",
        responsable: null,
        fechaInicio: null,
        fechaLimite: "2026-10-22",
        dodConfirmado: false,
        dodConfirmadoPor: null,
        dodConfirmadoEn: null,
        descripcion: "Permitir al administrador invitar personas al proyecto mediante su correo.",
        criteriosAceptacion: "La invitación queda visible como pendiente.\nNo se crean invitaciones duplicadas para el mismo proyecto.",
        definitionOfDone: "El código fue revisado. Las pruebas pasan. Los criterios de aceptación se cumplen. La funcionalidad está integrada y documentada.",
        checklist: [
          { checklistItemId: 806, descripcion: "Definir el flujo de invitación", posicion: 1, completado: false }
        ],
        comments: [],
        impediments: [
          { impedimentoId: 1401, sprintId: 7001, elementoSprintId: 503, descripcion: "Falta confirmar la plantilla del correo de invitación.", estado: "ABIERTO", reportadoPor: { miembroProyectoId: 12, userId: 2, nombre: "Juan Pérez" }, fechaCreacion: "2026-10-13T14:10:00Z", resueltoPor: null, fechaResolucion: null }
        ]
      }
    ]
  }
};

function obtenerConfiguracion(projectId) {
  return configuracionProyectos[String(projectId)] ?? configuracionProyectos["101"];
}

function diasEntre(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return null;
  return Math.round((new Date(`${fechaFin}T00:00:00`) - new Date(`${fechaInicio}T00:00:00`)) / 86400000) + 1;
}

async function crearResumen(projectId, sprint) {
  const backlog = await obtenerProductBacklog(projectId);
  const seleccionados = backlog.items.filter((item) => sprint.selectedItemIds.includes(item.elementoBacklogId));
  const configuracion = obtenerConfiguracion(projectId);
  const faltantesActivacion = [];
  const duracion = diasEntre(sprint.fechaInicio, sprint.fechaFin);

  if (!sprint.sprintGoal?.trim()) faltantesActivacion.push("Define el Sprint Goal");
  if (!sprint.fechaInicio || !sprint.fechaFin) faltantesActivacion.push("Completa las fechas del Sprint");
  if (duracion !== null && duracion < 1) faltantesActivacion.push("La fecha de fin debe ser posterior a la fecha de inicio");
  if (duracion !== null && duracion > 28) faltantesActivacion.push("El Sprint no puede durar más de cuatro semanas");
  if (!seleccionados.length) faltantesActivacion.push("Selecciona al menos un elemento del Product Backlog");
  if (seleccionados.some((item) => !item.preparado)) faltantesActivacion.push("Todos los elementos seleccionados deben tener descripción y estimación");
  if (!configuracion.productGoal) faltantesActivacion.push("Define el Product Goal");
  if (!configuracion.definitionOfDone) faltantesActivacion.push("Configura la Definition of Done");
  if (!configuracion.productOwner) faltantesActivacion.push("Asigna un Product Owner");
  if (!configuracion.scrumMaster) faltantesActivacion.push("Asigna un Scrum Master");
  if (!configuracion.developers) faltantesActivacion.push("Asigna al menos un Developer");

  return {
    sprintId: sprint.sprintId,
    projectId: sprint.projectId,
    sprintGoal: sprint.sprintGoal,
    fechaInicio: sprint.fechaInicio,
    fechaFin: sprint.fechaFin,
    estado: sprint.estado,
    dodSnapshot: sprint.dodSnapshot,
    fechaActivacion: sprint.fechaActivacion ?? null,
    fechaInicioCierre: sprint.fechaInicioCierre ?? null,
    fechaFinalizacion: sprint.fechaFinalizacion ?? null,
    selectedItems: seleccionados.map(({ elementoBacklogId, titulo, estimacion }) => ({ elementoBacklogId, titulo, estimacion })),
    estimacionTotal: seleccionados.reduce((total, item) => total + (item.estimacion ?? 0), 0),
    cantidadElementos: seleccionados.length,
    faltantesActivacion
  };
}

export async function obtenerSprintActual(projectId) {
  const sprint = sprintsSimulados[String(projectId)];
  return sprint ? crearResumen(projectId, sprint) : null;
}

export async function obtenerUltimoSprintFinalizado(projectId) {
  return structuredClone(sprintsFinalizadosSimulados[String(projectId)] ?? null);
}

export async function obtenerResumenCierreSprint(projectId, sprintId) {
  const sprint = sprintsSimulados[String(projectId)] ?? sprintsFinalizadosSimulados[String(projectId)];
  if (!sprint || sprint.sprintId !== Number(sprintId) || !["EN_CIERRE", "FINALIZADO"].includes(sprint.estado)) {
    throw new Error("No se encontró el cierre del Sprint solicitado");
  }
  const cierre = cierresSimulados[String(sprintId)];
  if (!cierre) throw new Error("No se encontró el resumen de cierre del Sprint");
  return structuredClone(cierre);
}

export async function crearBorradorSprint(projectId, datos = {}) {
  const clave = String(projectId);
  if (sprintsSimulados[clave]) throw new Error("Ya existe un Sprint sin finalizar en este proyecto");
  sprintsSimulados[clave] = {
    sprintId: siguienteSprintId++,
    projectId: Number(projectId),
    sprintGoal: datos.sprintGoal ?? null,
    fechaInicio: datos.fechaInicio ?? null,
    fechaFin: datos.fechaFin ?? null,
    estado: "BORRADOR",
    dodSnapshot: null,
    selectedItemIds: []
  };
  return crearResumen(projectId, sprintsSimulados[clave]);
}

export async function actualizarBorradorSprint(projectId, sprintId, cambios) {
  const sprint = sprintsSimulados[String(projectId)];
  if (!sprint || sprint.sprintId !== Number(sprintId) || sprint.estado !== "BORRADOR") {
    throw new Error("El Sprint ya no admite cambios en la planificación");
  }
  Object.assign(sprint, cambios);
  return crearResumen(projectId, sprint);
}

export async function activarSprint(projectId, sprintId) {
  const sprint = sprintsSimulados[String(projectId)];
  if (!sprint) throw new Error("No se encontró el Sprint solicitado");
  const resumen = await crearResumen(projectId, sprint);
  if (sprint.sprintId !== Number(sprintId) || resumen.faltantesActivacion.length) {
    throw new Error("Completa las condiciones pendientes antes de activar el Sprint");
  }
  sprint.estado = "ACTIVO";
  sprint.dodSnapshot = equiposSimulados[String(projectId)]?.definitionOfDone ?? null;
  await asegurarTablero(projectId, sprint);
  return crearResumen(projectId, sprint);
}

function obtenerSprintActivo(projectId, sprintId) {
  const sprint = sprintsSimulados[String(projectId)];
  if (!sprint || sprint.sprintId !== Number(sprintId) || sprint.estado !== "ACTIVO") {
    throw new Error("El Sprint ya no admite cambios en el tablero");
  }
  return sprint;
}

function buscarElemento(projectId, sprintId, sprintItemId) {
  obtenerSprintActivo(projectId, sprintId);
  const item = tablerosSimulados[String(projectId)]?.items.find((actual) => actual.elementoSprintId === Number(sprintItemId));
  if (!item) throw new Error("No se encontró el elemento del Sprint");
  return item;
}

function resumirMiembro(miembro) {
  return miembro ? {
    miembroProyectoId: miembro.miembroProyectoId,
    userId: miembro.usuario.userId,
    nombre: miembro.usuario.nombre
  } : null;
}

async function asegurarTablero(projectId, sprint) {
  const clave = String(projectId);
  if (tablerosSimulados[clave]) return;
  const backlog = await obtenerProductBacklog(projectId);
  tablerosSimulados[clave] = {
    items: backlog.items
      .filter((item) => sprint.selectedItemIds.includes(item.elementoBacklogId))
      .map((item, indice) => ({
        elementoSprintId: Number(`${sprint.sprintId}${indice + 1}`),
        elementoBacklogId: item.elementoBacklogId,
        titulo: item.titulo,
        prioridad: item.prioridad,
        estimacion: item.estimacion,
        estado: "PENDIENTE",
        responsable: null,
        fechaInicio: null,
        fechaLimite: null,
        dodConfirmado: false,
        dodConfirmadoPor: null,
        dodConfirmadoEn: null,
        descripcion: item.descripcion,
        criteriosAceptacion: item.criteriosAceptacion,
        definitionOfDone: sprint.dodSnapshot,
        checklist: [],
        comments: [],
        impediments: []
      }))
  };
}

export async function obtenerEquipoProyecto(projectId) {
  const equipo = equiposSimulados[String(projectId)] ?? { members: [], definitionOfDone: null, pendingInvitations: [] };
  return structuredClone(equipo);
}

export async function obtenerTableroSprint(projectId, sprintId) {
  const sprint = obtenerSprintActivo(projectId, sprintId);
  await asegurarTablero(projectId, sprint);
  const items = tablerosSimulados[String(projectId)].items;
  const estados = ["PENDIENTE", "EN_PROGRESO", "TERMINADO"];
  const counts = {
    pendiente: items.filter((item) => item.estado === "PENDIENTE").length,
    enProgreso: items.filter((item) => item.estado === "EN_PROGRESO").length,
    terminado: items.filter((item) => item.estado === "TERMINADO").length
  };
  const impedimentosAbiertos = items.flatMap((item) => item.impediments).filter((impedimento) => impedimento.estado === "ABIERTO");

  return structuredClone({
    sprintId: sprint.sprintId,
    sprintGoal: sprint.sprintGoal,
    estado: sprint.estado,
    readOnly: false,
    progressPercentage: items.length ? (counts.terminado / items.length) * 100 : 0,
    counts,
    columns: estados.map((estado) => ({ estado, items: items.filter((item) => item.estado === estado) })),
    impedimentosAbiertos
  });
}

export async function obtenerElementoSprint(projectId, sprintId, sprintItemId) {
  return structuredClone(buscarElemento(projectId, sprintId, sprintItemId));
}

export async function actualizarElementoSprint(projectId, sprintId, sprintItemId, cambios) {
  const sprint = obtenerSprintActivo(projectId, sprintId);
  const item = buscarElemento(projectId, sprintId, sprintItemId);
  const equipo = equiposSimulados[String(projectId)]?.members ?? [];
  const responsable = cambios.responsableMiembroId == null
    ? null
    : equipo.find((miembro) => miembro.miembroProyectoId === Number(cambios.responsableMiembroId) && miembro.activo);

  if (cambios.responsableMiembroId != null && !responsable) throw new Error("Selecciona un integrante del proyecto");
  if (cambios.fechaInicio && (cambios.fechaInicio < sprint.fechaInicio || cambios.fechaInicio > sprint.fechaFin)) throw new Error("Las fechas deben encontrarse dentro del Sprint");
  if (cambios.fechaLimite && (cambios.fechaLimite < sprint.fechaInicio || cambios.fechaLimite > sprint.fechaFin)) throw new Error("Las fechas deben encontrarse dentro del Sprint");
  if (cambios.fechaInicio && cambios.fechaLimite && cambios.fechaInicio > cambios.fechaLimite) throw new Error("La fecha de inicio no puede ser posterior a la fecha límite");
  if (cambios.estado === "TERMINADO" && !cambios.confirmarDod && !item.dodConfirmado) throw new Error("Confirma la Definition of Done antes de terminar el elemento");

  if (Object.hasOwn(cambios, "responsableMiembroId")) item.responsable = resumirMiembro(responsable);
  if (Object.hasOwn(cambios, "fechaInicio")) item.fechaInicio = cambios.fechaInicio;
  if (Object.hasOwn(cambios, "fechaLimite")) item.fechaLimite = cambios.fechaLimite;
  if (cambios.checklist) {
    item.checklist = cambios.checklist.map((entrada, indice) => ({
      checklistItemId: entrada.checklistItemId ?? siguienteChecklistId++,
      descripcion: entrada.descripcion.trim(),
      posicion: indice + 1,
      completado: entrada.completado
    }));
  }
  if (cambios.estado) {
    if (item.estado === "TERMINADO" && cambios.estado !== "TERMINADO") {
      item.dodConfirmado = false;
      item.dodConfirmadoPor = null;
      item.dodConfirmadoEn = null;
    }
    item.estado = cambios.estado;
  }
  if (cambios.estado === "TERMINADO" && cambios.confirmarDod) {
    const miembro = equiposSimulados[String(projectId)].members[0];
    item.dodConfirmado = true;
    item.dodConfirmadoPor = resumirMiembro(miembro);
    item.dodConfirmadoEn = new Date().toISOString();
  }
  return structuredClone(item);
}

export async function crearComentarioSprint(projectId, sprintId, sprintItemId, datos) {
  const item = buscarElemento(projectId, sprintId, sprintItemId);
  const miembro = equiposSimulados[String(projectId)].members[0];
  const comentario = {
    comentarioId: siguienteComentarioId++,
    autor: resumirMiembro(miembro),
    contenido: datos.contenido.trim(),
    fechaPublicacion: new Date().toISOString()
  };
  if (!comentario.contenido) throw new Error("Escribe un comentario antes de publicarlo");
  item.comments.push(comentario);
  return structuredClone(comentario);
}

export async function crearImpedimentoSprint(projectId, sprintId, datos) {
  const item = buscarElemento(projectId, sprintId, datos.elementoSprintId);
  const miembro = equiposSimulados[String(projectId)].members[0];
  const impedimento = {
    impedimentoId: siguienteImpedimentoId++,
    sprintId: Number(sprintId),
    elementoSprintId: item.elementoSprintId,
    descripcion: datos.descripcion.trim(),
    estado: "ABIERTO",
    reportadoPor: resumirMiembro(miembro),
    fechaCreacion: new Date().toISOString(),
    resueltoPor: null,
    fechaResolucion: null
  };
  if (!impedimento.descripcion) throw new Error("Describe el impedimento antes de registrarlo");
  item.impediments.push(impedimento);
  return structuredClone(impedimento);
}

export async function resolverImpedimentoSprint(projectId, sprintId, impedimentId) {
  obtenerSprintActivo(projectId, sprintId);
  const items = tablerosSimulados[String(projectId)]?.items ?? [];
  const impedimento = items.flatMap((item) => item.impediments).find((actual) => actual.impedimentoId === Number(impedimentId));
  if (!impedimento) throw new Error("No se encontró el impedimento");
  const miembro = equiposSimulados[String(projectId)].members[0];
  impedimento.estado = "RESUELTO";
  impedimento.resueltoPor = resumirMiembro(miembro);
  impedimento.fechaResolucion = new Date().toISOString();
  return structuredClone(impedimento);
}
