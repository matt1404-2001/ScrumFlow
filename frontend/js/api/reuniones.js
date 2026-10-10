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
const administradorSimulado = { miembroProyectoId: 11, userId: 1, nombre: "María López" };
const proyectosAdministrados = new Set(["101", "318"]);

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
