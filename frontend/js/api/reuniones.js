import {
  actualizarEstadoCierreSprint,
  obtenerResumenCierreSprint,
  obtenerSprintActual,
  obtenerUltimoSprintFinalizado
} from "./sprints.js";
import { actualizarElementoBacklog, crearElementoBacklog } from "./backlog.js";

let siguienteReviewId = 8200;
let siguienteRetrospectivaId = 9200;
let siguienteAccionId = 9300;
let siguienteDailyId = 7200;
let siguienteMensajeDailyId = 7400;
let siguienteImpedimentoDailyId = 7600;
const administradorSimulado = { miembroProyectoId: 11, userId: 1, nombre: "María López" };
const proyectosAdministrados = new Set(["101", "318"]);
const integrantesDaily = {
  "101": [
    { miembroProyectoId: 11, userId: 1, nombre: "María López" },
    { miembroProyectoId: 12, userId: 2, nombre: "Juan Pérez" },
    { miembroProyectoId: 13, userId: 3, nombre: "Sofía Ramírez" }
  ]
};
const dailiesSimuladas = new Map();
const historialDailiesSimuladas = {
  "101": [
    {
      dailyDisponible: true, dailyId: 7198, sprintId: 7001, fecha: "2026-10-08", estado: "FINALIZADA",
      iniciadaPor: administradorSimulado, horaInicio: "2026-10-08T09:02:00Z", finalizadaPor: administradorSimulado, horaFin: "2026-10-08T09:16:00Z",
      expectedCount: 3, attendeeCount: 3, absentCount: 0,
      participants: integrantesDaily["101"].map((integrante) => ({ ...integrante, horaIngreso: "2026-10-08T09:02:00Z", asistio: true, ausente: false })),
      messages: []
    },
    {
      dailyDisponible: true, dailyId: 7199, sprintId: 7001, fecha: "2026-10-09", estado: "FINALIZADA",
      iniciadaPor: administradorSimulado, horaInicio: "2026-10-09T09:01:00Z", finalizadaPor: administradorSimulado, horaFin: "2026-10-09T09:14:00Z",
      expectedCount: 3, attendeeCount: 2, absentCount: 1,
      participants: integrantesDaily["101"].map((integrante, indice) => ({ ...integrante, horaIngreso: indice === 2 ? null : "2026-10-09T09:01:00Z", asistio: indice !== 2, ausente: indice === 2 })),
      messages: []
    }
  ]
};

function fechaActual() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function crearDailyProgramada(projectId) {
  const integrantes = integrantesDaily[String(projectId)];
  if (!integrantes) {
    return {
      dailyDisponible: false,
      dailyId: null,
      sprintId: 1,
      fecha: fechaActual(),
      estado: null,
      iniciadaPor: null,
      horaInicio: null,
      finalizadaPor: null,
      horaFin: null,
      expectedCount: 0,
      attendeeCount: 0,
      absentCount: null,
      participants: [],
      messages: []
    };
  }

  return {
    dailyDisponible: true,
    dailyId: null,
    sprintId: 7001,
    fecha: fechaActual(),
    estado: "PROGRAMADA",
    iniciadaPor: null,
    horaInicio: null,
    finalizadaPor: null,
    horaFin: null,
    expectedCount: integrantes.length,
    attendeeCount: 0,
    absentCount: null,
    participants: [],
    messages: []
  };
}

function obtenerRegistroDaily(projectId) {
  const clave = String(projectId);
  if (!dailiesSimuladas.has(clave)) dailiesSimuladas.set(clave, crearDailyProgramada(clave));
  return dailiesSimuladas.get(clave);
}

export async function obtenerDailyHoy(projectId) {
  return structuredClone(obtenerRegistroDaily(projectId));
}

// Equivale a GET /api/proyectos/{projectId}/sprints/{sprintId}/reuniones-diarias.
export async function obtenerHistorialDailies(projectId, sprintId) {
  const actual = obtenerRegistroDaily(projectId);
  const historicas = historialDailiesSimuladas[String(projectId)] ?? [];
  return structuredClone([...historicas, actual]
    .filter((daily) => daily.sprintId === Number(sprintId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha)));
}

export async function iniciarDaily(projectId, sprintId) {
  const daily = obtenerRegistroDaily(projectId);
  if (!daily.dailyDisponible || daily.sprintId !== Number(sprintId)) throw new Error("No existe una Daily disponible para este momento");
  if (daily.estado !== "PROGRAMADA") throw new Error("La Daily ya fue iniciada por otro integrante");

  const horaInicio = new Date().toISOString();
  daily.dailyId = siguienteDailyId++;
  daily.estado = "EN_CURSO";
  daily.iniciadaPor = administradorSimulado;
  daily.horaInicio = horaInicio;
  daily.participants = integrantesDaily[String(projectId)].map((integrante) => ({
    ...integrante,
    horaIngreso: integrante.userId === administradorSimulado.userId ? horaInicio : null,
    asistio: integrante.userId === administradorSimulado.userId,
    ausente: false
  }));
  daily.attendeeCount = 1;
  return structuredClone(daily);
}

export async function unirseDaily(projectId, sprintId, dailyId) {
  const daily = obtenerRegistroDaily(projectId);
  if (daily.sprintId !== Number(sprintId) || daily.dailyId !== Number(dailyId) || daily.estado !== "EN_CURSO") {
    throw new Error("La Daily ya no está disponible para unirse");
  }

  const participante = daily.participants.find((actual) => actual.userId === administradorSimulado.userId);
  if (!participante) throw new Error("No perteneces al equipo esperado para esta Daily");
  if (!participante.asistio) {
    participante.horaIngreso = new Date().toISOString();
    participante.asistio = true;
    daily.attendeeCount += 1;
  }
  return { dailyId: daily.dailyId, participant: structuredClone(participante) };
}

export async function publicarMensajeDaily(projectId, sprintId, dailyId, datos) {
  const daily = obtenerRegistroDaily(projectId);
  if (daily.sprintId !== Number(sprintId) || daily.dailyId !== Number(dailyId) || daily.estado !== "EN_CURSO") {
    throw new Error("La Daily no admite nuevas publicaciones");
  }
  if (!daily.participants.some((participante) => participante.userId === administradorSimulado.userId && participante.asistio)) {
    throw new Error("Únete a la Daily antes de publicar");
  }

  const contenido = normalizarTexto(datos.contenido);
  if (!contenido || !["MENSAJE", "AVANCE", "IMPEDIMENTO"].includes(datos.tipo)) {
    throw new Error("Escribe una actualización válida y selecciona su tipo");
  }
  const message = {
    mensajeDailyId: siguienteMensajeDailyId++,
    autor: administradorSimulado,
    elementoSprintId: datos.elementoSprintId ?? null,
    tipo: datos.tipo,
    contenido,
    fechaPublicacion: new Date().toISOString()
  };
  daily.messages.push(message);
  const createdImpediment = datos.tipo === "IMPEDIMENTO" ? {
    impedimentoId: siguienteImpedimentoDailyId++,
    sprintId: daily.sprintId,
    elementoSprintId: datos.elementoSprintId ?? null,
    descripcion: contenido,
    estado: "ABIERTO",
    reportadoPor: administradorSimulado,
    fechaCreacion: message.fechaPublicacion,
    resueltoPor: null,
    fechaResolucion: null
  } : null;
  return { message: structuredClone(message), createdImpediment: structuredClone(createdImpediment) };
}

export async function finalizarDaily(projectId, sprintId, dailyId) {
  const daily = obtenerRegistroDaily(projectId);
  if (daily.sprintId !== Number(sprintId) || daily.dailyId !== Number(dailyId) || daily.estado !== "EN_CURSO") {
    throw new Error("La Daily no puede finalizarse en el estado actual");
  }
  const autorizado = daily.iniciadaPor?.userId === administradorSimulado.userId || proyectosAdministrados.has(String(projectId));
  if (!autorizado) throw new Error("No tienes permiso para finalizar esta Daily");

  daily.estado = "FINALIZADA";
  daily.horaFin = new Date().toISOString();
  daily.finalizadaPor = administradorSimulado;
  daily.participants.forEach((participante) => { participante.ausente = !participante.asistio; });
  const ausentes = daily.participants.filter((participante) => participante.ausente);
  daily.absentCount = ausentes.length;
  return {
    dailyId: daily.dailyId,
    estado: daily.estado,
    horaFin: daily.horaFin,
    finalizadaPor: structuredClone(daily.finalizadaPor),
    attendeeCount: daily.attendeeCount,
    absentCount: daily.absentCount,
    absentMembers: ausentes.map(({ miembroProyectoId, userId, nombre }) => ({ miembroProyectoId, userId, nombre }))
  };
}

function validarAdministrador(projectId) {
  if (!proyectosAdministrados.has(String(projectId))) {
    throw new Error("Solo un administrador del proyecto puede completar este evento");
  }
}

async function obtenerContexto(projectId) {
  const sprint = await obtenerSprintActual(projectId) ?? await obtenerUltimoSprintFinalizado(projectId);
  if (!sprint || !["EN_CIERRE", "FINALIZADO"].includes(sprint.estado)) {
    throw new Error("Las reuniones de cierre estarán disponibles cuando el Sprint esté En cierre");
  }
  const cierre = await obtenerResumenCierreSprint(projectId, sprint.sprintId);
  return { sprint, cierre };
}

function normalizarTexto(valor) {
  return valor?.trim() || null;
}

function datosReview(datos) {
  return {
    participantes: normalizarTexto(datos.participantes),
    stakeholdersExternos: normalizarTexto(datos.stakeholdersExternos),
    resultados: normalizarTexto(datos.resultados),
    retroalimentacion: normalizarTexto(datos.retroalimentacion),
    decisiones: normalizarTexto(datos.decisiones),
    conclusion: normalizarTexto(datos.conclusion)
  };
}

function datosRetrospectiva(datos) {
  return {
    participantes: normalizarTexto(datos.participantes),
    aspectosPositivos: normalizarTexto(datos.aspectosPositivos),
    problemas: normalizarTexto(datos.problemas),
    propuestas: normalizarTexto(datos.propuestas),
    conclusion: normalizarTexto(datos.conclusion),
    accionesMejora: (datos.accionesMejora ?? [])
      .map((accion, indice) => ({
        accionMejoraId: accion.accionMejoraId > 0 ? accion.accionMejoraId : siguienteAccionId++,
        descripcion: normalizarTexto(accion.descripcion),
        posicion: indice + 1,
        elementoBacklogId: accion.elementoBacklogId ?? null
      }))
      .filter((accion) => accion.descripcion)
  };
}

export async function obtenerSprintReview(projectId) {
  const { sprint, cierre } = await obtenerContexto(projectId);
  return {
    ...(cierre.review ?? {
      sprintReviewId: null,
      sprintId: sprint.sprintId,
      estado: "BORRADOR",
      participantes: null,
      stakeholdersExternos: null,
      resultados: null,
      retroalimentacion: null,
      decisiones: null,
      conclusion: null,
      completadaPor: null,
      fechaCompletada: null
    }),
    sprintGoal: sprint.sprintGoal,
    incrementItems: cierre.incrementItems,
    incompleteItems: cierre.incompleteItems,
    retrospectiveEstado: cierre.retrospective?.estado ?? null,
    sprintEstado: sprint.estado
  };
}

export async function guardarSprintReview(projectId, sprintId, datos) {
  const { sprint, cierre } = await obtenerContexto(projectId);
  if (sprint.sprintId !== Number(sprintId) || sprint.estado !== "EN_CIERRE" || cierre.review?.estado === "COMPLETADA") {
    throw new Error("La Sprint Review no puede modificarse en el estado actual");
  }
  const review = {
    ...(cierre.review ?? {}),
    sprintReviewId: cierre.review?.sprintReviewId ?? siguienteReviewId++,
    sprintId: sprint.sprintId,
    estado: "BORRADOR",
    ...datosReview(datos),
    completadaPor: null,
    fechaCompletada: null
  };
  await actualizarEstadoCierreSprint(projectId, sprintId, { review });
  return obtenerSprintReview(projectId);
}

export async function completarSprintReview(projectId, sprintId, datos) {
  validarAdministrador(projectId);
  const review = await guardarSprintReview(projectId, sprintId, datos);
  if (!review.participantes || !review.resultados || !review.conclusion) {
    throw new Error("Registra los asistentes, resultados y conclusión de la Review");
  }
  const fechaCompletada = new Date().toISOString();
  const completada = { ...review, estado: "COMPLETADA", completadaPor: administradorSimulado, fechaCompletada };
  delete completada.sprintGoal;
  delete completada.incrementItems;
  delete completada.incompleteItems;
  delete completada.retrospectiveEstado;
  delete completada.sprintEstado;
  await actualizarEstadoCierreSprint(projectId, sprintId, { review: completada });
  return {
    sprintReviewId: completada.sprintReviewId,
    sprintId: completada.sprintId,
    estado: completada.estado,
    completadaPor: completada.completadaPor,
    fechaCompletada,
    retrospectiveDisponible: true
  };
}

export async function obtenerSprintRetrospective(projectId) {
  const { sprint, cierre } = await obtenerContexto(projectId);
  if (cierre.review?.estado !== "COMPLETADA") {
    throw new Error("Completa la Sprint Review antes de iniciar la Retrospectiva");
  }
  return structuredClone(cierre.retrospective ?? {
    sprintRetrospectiveId: null,
    sprintId: sprint.sprintId,
    estado: "BORRADOR",
    participantes: null,
    aspectosPositivos: null,
    problemas: null,
    propuestas: null,
    conclusion: null,
    accionesMejora: [],
    completadaPor: null,
    fechaCompletada: null,
    sprintEstado: sprint.estado
  });
}

export async function guardarSprintRetrospective(projectId, sprintId, datos) {
  const { sprint, cierre } = await obtenerContexto(projectId);
  if (sprint.sprintId !== Number(sprintId) || sprint.estado !== "EN_CIERRE" || cierre.review?.estado !== "COMPLETADA" || cierre.retrospective?.estado === "COMPLETADA") {
    throw new Error("La Sprint Retrospective no puede modificarse en el estado actual");
  }
  const retrospective = {
    ...(cierre.retrospective ?? {}),
    sprintRetrospectiveId: cierre.retrospective?.sprintRetrospectiveId ?? siguienteRetrospectivaId++,
    sprintId: sprint.sprintId,
    estado: "BORRADOR",
    ...datosRetrospectiva(datos),
    completadaPor: null,
    fechaCompletada: null
  };
  await actualizarEstadoCierreSprint(projectId, sprintId, { retrospective });
  return obtenerSprintRetrospective(projectId);
}

export async function convertirAccionMejora(projectId, sprintId, actionId, datos) {
  const { cierre } = await obtenerContexto(projectId);
  const retrospective = cierre.retrospective;
  const accion = retrospective?.accionesMejora.find((actual) => actual.accionMejoraId === Number(actionId));
  if (!accion || accion.elementoBacklogId) throw new Error("La acción de mejora ya no puede convertirse");
  if (!normalizarTexto(datos.titulo) || !datos.prioridad) throw new Error("Indica un título y una prioridad para el elemento");
  const elementoBacklog = await crearElementoBacklog(projectId, datos);
  accion.elementoBacklogId = elementoBacklog.elementoBacklogId;
  await actualizarEstadoCierreSprint(projectId, sprintId, { retrospective });
  return {
    accionMejoraId: accion.accionMejoraId,
    elementoBacklog
  };
}

export async function completarSprintRetrospective(projectId, sprintId, datos) {
  validarAdministrador(projectId);
  const retrospective = await guardarSprintRetrospective(projectId, sprintId, datos);
  const hayObservacion = retrospective.aspectosPositivos || retrospective.problemas || retrospective.propuestas;
  if (!retrospective.participantes || !hayObservacion || !retrospective.accionesMejora.length || !retrospective.conclusion) {
    throw new Error("Registra los participantes, observaciones, acciones y conclusión de la Retrospectiva");
  }
  const fechaCompletada = new Date().toISOString();
  const completada = {
    ...retrospective,
    estado: "COMPLETADA",
    completadaPor: administradorSimulado,
    fechaCompletada
  };
  delete completada.sprintEstado;
  const { cierre } = await obtenerContexto(projectId);
  await Promise.all(cierre.incompleteItems.map((item) => actualizarElementoBacklog(projectId, item.elementoBacklogId, { sprintActualId: null })));
  await actualizarEstadoCierreSprint(projectId, sprintId, {
    retrospective: completada,
    finalizarSprint: true,
    fechaFinalizacion: fechaCompletada
  });
  return {
    retrospective: {
      sprintRetrospectiveId: completada.sprintRetrospectiveId,
      sprintId: completada.sprintId,
      estado: completada.estado,
      completadaPor: completada.completadaPor,
      fechaCompletada
    },
    sprint: { sprintId: Number(sprintId), estado: "FINALIZADO", fechaFinalizacion: fechaCompletada },
    returnedBacklogItemIds: cierre.incompleteItems.map((item) => item.elementoBacklogId)
  };
}
