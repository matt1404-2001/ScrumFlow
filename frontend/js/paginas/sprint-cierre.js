import { escaparHtml } from "../utilidades/html.js";

const etiquetasTrabajo = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  TERMINADO: "Terminado"
};

function formatearFecha(fecha, incluirHora = false) {
  if (!fecha) return "Sin registro";
  const valor = fecha.length === 10 ? `${fecha}T12:00:00` : fecha;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(incluirHora ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(new Date(valor));
}

function obtenerEstadoEventos(cierre) {
  const reviewCompletada = cierre.review?.estado === "COMPLETADA";
  const retrospectivaCompletada = cierre.retrospective?.estado === "COMPLETADA";
  return {
    review: reviewCompletada ? "COMPLETADA" : "PENDIENTE",
    retrospectiva: retrospectivaCompletada ? "COMPLETADA" : reviewCompletada ? "PENDIENTE" : "BLOQUEADA"
  };
}

function iconoEstado(estado) {
  if (estado === "COMPLETADA") return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9"></path></svg>`;
  if (estado === "BLOQUEADA") return `<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="8.5" width="11" height="8" rx="2"></rect><path d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7"></path></svg>`;
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"></circle><path d="M10 6v4l2.5 1.5"></path></svg>`;
}

function renderizarPasoEvento(nombre, descripcion, estado, esUltimo = false) {
  return `
    <li class="cierre-evento cierre-evento--${estado.toLowerCase()} ${esUltimo ? "cierre-evento--ultimo" : ""}">
      <span class="cierre-evento__indicador">${iconoEstado(estado)}</span>
      <div>
        <span class="cierre-evento__estado">${estado === "COMPLETADA" ? "Completada" : estado === "BLOQUEADA" ? "Bloqueada" : "Pendiente"}</span>
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
      </div>
    </li>`;
}

function renderizarListaTrabajo(items, tipo) {
  if (!items.length) {
    const mensaje = tipo === "completado" ? "No se registró trabajo completado." : "No quedó trabajo incompleto.";
    return `<p class="consulta-trabajo__vacio">${mensaje}</p>`;
  }
  return `<ul class="consulta-trabajo__lista">${items.map((item) => `
    <li>
      <span class="consulta-trabajo__marca" aria-hidden="true">${tipo === "completado" ? `<svg viewBox="0 0 18 18"><path d="m3.5 9 3.2 3.2 7.8-7.8"></path></svg>` : ""}</span>
      <span><strong>${escaparHtml(item.titulo)}</strong>${tipo === "incompleto" ? `<small>${etiquetasTrabajo[item.estado] ?? escaparHtml(item.estado)}</small>` : `<small>Definition of Done confirmada</small>`}</span>
    </li>`).join("")}</ul>`;
}

function renderizarEnlaceEvento(evento, etiqueta) {
  return `<a class="enlace-evento" href="#reuniones/${evento}" data-evento-scrum="${evento}">${etiqueta}<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10M10 5l4 4-4 4"></path></svg></a>`;
}

export function renderizarSprintEnCierre(sprint, cierre) {
  const estados = obtenerEstadoEventos(cierre);
  const reviewCompletada = estados.review === "COMPLETADA";
  return `
    <div class="sprint-cierre">
      <header class="encabezado-sprint encabezado-sprint--cierre">
        <div>
          <div class="encabezado-sprint__titulo"><h1>Cierre del Sprint</h1><span>En cierre</span></div>
          <p>${escaparHtml(sprint.sprintGoal)}</p>
          <div class="encabezado-sprint__fechas"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 3.5v2M14 3.5v2M3 7h12M3.5 4.5h11v11h-11z"></path></svg>${formatearFecha(sprint.fechaInicio)} – ${formatearFecha(sprint.fechaFin)}</div>
        </div>
        <div class="cierre-bloqueado"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="8.5" width="11" height="8" rx="2"></rect><path d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7"></path></svg><span><strong>Trabajo operativo finalizado</strong>El tablero quedó bloqueado para conservar el resultado del Sprint.</span></div>
      </header>

      <div class="cierre-distribucion">
        <section class="cierre-recorrido" aria-labelledby="titulo-recorrido-cierre">
          <div class="cierre-seccion__cabecera"><h2 id="titulo-recorrido-cierre">Eventos de cierre</h2><p>Completa los eventos en orden para finalizar el Sprint.</p></div>
          <ol>
            ${renderizarPasoEvento("Sprint Review", reviewCompletada ? "El incremento y la retroalimentación quedaron registrados." : "Revisa el incremento, el trabajo incompleto y la retroalimentación de stakeholders.", estados.review)}
            ${renderizarPasoEvento("Retrospectiva", estados.retrospectiva === "BLOQUEADA" ? "Se habilitará cuando la Sprint Review esté completada." : "Reflexiona sobre el trabajo y acuerda acciones de mejora.", estados.retrospectiva, true)}
          </ol>
        </section>

        <aside class="cierre-siguiente" aria-labelledby="titulo-siguiente-paso">
          <span>${reviewCompletada ? "Siguiente evento" : "Siguiente paso"}</span>
          <h2 id="titulo-siguiente-paso">${reviewCompletada ? "Continuar con la Retrospectiva" : "Realizar la Sprint Review"}</h2>
          <p>${reviewCompletada ? "La Review está completa. Registra ahora los aprendizajes y las acciones de mejora del equipo." : "Presenta el resultado del Sprint y registra las conclusiones antes de habilitar la Retrospectiva."}</p>
          ${renderizarEnlaceEvento(reviewCompletada ? "retrospectiva" : "review", reviewCompletada ? "Continuar Retrospectiva" : "Ir a Sprint Review")}
          <dl><div><dt>Completado</dt><dd>${cierre.incrementItems.length}</dd></div><div><dt>Incompleto</dt><dd>${cierre.incompleteItems.length}</dd></div></dl>
        </aside>
      </div>
    </div>`;
}

function renderizarResumenEvento(titulo, evento, tipo) {
  return `
    <article class="consulta-evento">
      <header><div><span>${iconoEstado("COMPLETADA")}</span><h3>${titulo}</h3></div><span>Completada</span></header>
      <p>${escaparHtml(evento.conclusion || "Sin conclusión registrada.")}</p>
      <footer><span>${formatearFecha(evento.fechaCompletada, true)}</span>${renderizarEnlaceEvento(tipo, `Consultar ${titulo}`)}</footer>
    </article>`;
}

export function renderizarSprintFinalizado(sprint, cierre) {
  return `
    <div class="sprint-finalizado">
      <header class="encabezado-sprint encabezado-sprint--finalizado">
        <div>
          <div class="encabezado-sprint__titulo"><h1>Sprint finalizado</h1><span>Solo lectura</span></div>
          <p>Consulta el resultado y los acuerdos del Sprint. La información finalizada no admite cambios.</p>
        </div>
        <div class="consulta-fecha-final"><span>Finalizado</span><strong>${formatearFecha(sprint.fechaFinalizacion)}</strong></div>
      </header>

      <section class="consulta-identidad" aria-labelledby="titulo-goal-finalizado">
        <div><span>Sprint Goal</span><h2 id="titulo-goal-finalizado">${escaparHtml(sprint.sprintGoal)}</h2></div>
        <dl><div><dt>Inicio</dt><dd>${formatearFecha(sprint.fechaInicio)}</dd></div><div><dt>Fin</dt><dd>${formatearFecha(sprint.fechaFin)}</dd></div><div><dt>Estimación</dt><dd>${sprint.estimacionTotal} puntos</dd></div></dl>
      </section>

      <div class="consulta-trabajo">
        <section aria-labelledby="titulo-trabajo-completado">
          <header><div><h2 id="titulo-trabajo-completado">Trabajo completado</h2><p>Elementos que formaron parte del incremento.</p></div><strong>${cierre.incrementItems.length}</strong></header>
          ${renderizarListaTrabajo(cierre.incrementItems, "completado")}
        </section>
        <section aria-labelledby="titulo-trabajo-incompleto">
          <header><div><h2 id="titulo-trabajo-incompleto">Trabajo incompleto</h2><p>Elementos devueltos al Product Backlog.</p></div><strong>${cierre.incompleteItems.length}</strong></header>
          ${renderizarListaTrabajo(cierre.incompleteItems, "incompleto")}
        </section>
      </div>

      <section class="consulta-eventos" aria-labelledby="titulo-eventos-finalizados">
        <div class="cierre-seccion__cabecera"><h2 id="titulo-eventos-finalizados">Review y Retrospectiva</h2><p>Registros finales de los eventos de cierre.</p></div>
        <div>${renderizarResumenEvento("Sprint Review", cierre.review, "review")}${renderizarResumenEvento("Retrospectiva", cierre.retrospective, "retrospectiva")}</div>
      </section>

      <section class="consulta-historial" aria-labelledby="titulo-historial-sprint">
        <div class="cierre-seccion__cabecera"><h2 id="titulo-historial-sprint">Historial del Sprint</h2><p>Hitos principales conservados para consulta.</p></div>
        <ol>
          <li><span></span><div><strong>Sprint activado</strong><time datetime="${sprint.fechaActivacion}">${formatearFecha(sprint.fechaActivacion, true)}</time></div></li>
          <li><span></span><div><strong>Cierre iniciado</strong><time datetime="${sprint.fechaInicioCierre}">${formatearFecha(sprint.fechaInicioCierre, true)}</time></div></li>
          <li><span></span><div><strong>Sprint finalizado</strong><time datetime="${sprint.fechaFinalizacion}">${formatearFecha(sprint.fechaFinalizacion, true)}</time></div></li>
        </ol>
      </section>
    </div>`;
}
