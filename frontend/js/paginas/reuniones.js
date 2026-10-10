import {
  completarSprintRetrospective,
  completarSprintReview,
  convertirAccionMejora,
  finalizarDaily,
  guardarSprintRetrospective,
  guardarSprintReview,
  iniciarDaily,
  obtenerDailyHoy,
  obtenerHistorialDailies,
  obtenerSprintRetrospective,
  obtenerSprintReview,
  publicarMensajeDaily,
  unirseDaily
} from "../api/reuniones.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";

const sesiones = new WeakMap();
const estadosTrabajo = { PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", TERMINADO: "Terminado" };

function icono(nombre) {
  const rutas = {
    check: `<path d="m4 10 4 4 8-9"></path>`,
    reloj: `<circle cx="10" cy="10" r="7"></circle><path d="M10 6v4l2.5 1.5"></path>`,
    bloqueo: `<rect x="4.5" y="8.5" width="11" height="8" rx="2"></rect><path d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7"></path>`,
    flecha: `<path d="M4 10h12M12 6l4 4-4 4"></path>`,
    mas: `<path d="M10 4v12M4 10h12"></path>`,
    eliminar: `<path d="m6 6 8 8M14 6l-8 8"></path>`,
    backlog: `<path d="M5 4h10v12H5zM8 8h4M8 11h4"></path>`,
    calendario: `<rect x="3.5" y="5" width="13" height="11" rx="2"></rect><path d="M6.5 3.5v3M13.5 3.5v3M3.5 8.5h13"></path>`,
    mensaje: `<path d="M4 4.5h12v9H9l-4 3v-3H4z"></path>`,
    alerta: `<path d="M10 3.5 17 16H3zM10 8v3.5M10 14h.01"></path>`
  };
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${rutas[nombre]}</svg>`;
}

function renderizarNavegacionContextual(activo) {
  return `
    <nav class="reuniones-contexto" aria-label="Tipos de reunión">
      <a href="#reuniones/daily" class="${activo === "daily" ? "reuniones-contexto__activo" : ""}" ${activo === "daily" ? `aria-current="page"` : ""}>
        ${icono("mensaje")}<span><strong>Daily Scrum</strong><small>Seguimiento diario</small></span>
      </a>
      <a href="#reuniones/review" class="${activo !== "daily" ? "reuniones-contexto__activo" : ""}" ${activo !== "daily" ? `aria-current="page"` : ""}>
        ${icono("calendario")}<span><strong>Cierre del Sprint</strong><small>Review y Retrospectiva</small></span>
      </a>
    </nav>`;
}

function renderizarFlujo(reviewCompletada, retrospectivaCompletada, activo) {
  const reviewEstado = reviewCompletada ? "completada" : "activa";
  const retroEstado = retrospectivaCompletada ? "completada" : reviewCompletada ? "activa" : "bloqueada";
  return `
    <nav class="reuniones-flujo" aria-label="Flujo de cierre del Sprint">
      <a href="#reuniones/review" class="reuniones-flujo__paso reuniones-flujo__paso--${reviewEstado} ${activo === "review" ? "reuniones-flujo__paso--seleccionado" : ""}" ${activo === "review" ? `aria-current="step"` : ""}>
        <span>${icono(reviewCompletada ? "check" : "reloj")}</span>
        <span><small>${reviewCompletada ? "Completada" : "Primero"}</small><strong>Sprint Review</strong></span>
      </a>
      <span class="reuniones-flujo__union" aria-hidden="true"></span>
      <a href="#reuniones/retrospectiva" class="reuniones-flujo__paso reuniones-flujo__paso--${retroEstado} ${activo === "retrospectiva" ? "reuniones-flujo__paso--seleccionado" : ""}" ${activo === "retrospectiva" ? `aria-current="step"` : ""} ${reviewCompletada ? "" : `aria-disabled="true"`}>
        <span>${icono(retrospectivaCompletada ? "check" : reviewCompletada ? "reloj" : "bloqueo")}</span>
        <span><small>${retrospectivaCompletada ? "Completada" : reviewCompletada ? "Disponible" : "Bloqueada"}</small><strong>Retrospectiva</strong></span>
      </a>
    </nav>`;
}

function renderizarTrabajo(items, tipo) {
  if (!items.length) {
    const mensaje = tipo === "incremento"
      ? "Ningún elemento cumplió la Definition of Done durante este Sprint."
      : "No quedó trabajo incompleto en el Sprint.";
    return `<p class="reunion-trabajo__vacio">${mensaje}</p>`;
  }
  return `<ul class="reunion-trabajo__lista">${items.map((item) => `
    <li>
      <span class="reunion-trabajo__marca">${tipo === "incremento" ? icono("check") : ""}</span>
      <span><strong>${escaparHtml(item.titulo)}</strong><small>${tipo === "incremento" ? "Definition of Done confirmada" : estadosTrabajo[item.estado] ?? escaparHtml(item.estado)}</small></span>
    </li>`).join("")}</ul>`;
}

function campoTexto({ id, nombre, etiqueta, valor, ayuda, filas = 4, requerido = false, deshabilitado = false }) {
  return `
    <label class="campo-reunion" for="${id}">
      <span>${etiqueta}${requerido && !deshabilitado ? `<em>Requerido para completar</em>` : ""}</span>
      <textarea id="${id}" name="${nombre}" rows="${filas}" ${requerido ? `required aria-required="true"` : ""} ${deshabilitado ? "disabled" : ""} aria-describedby="${id}-ayuda">${escaparHtml(valor ?? "")}</textarea>
      <small id="${id}-ayuda">${ayuda}</small>
    </label>`;
}

function renderizarPieFormulario(tipo, soloLectura, esAdministrador) {
  if (soloLectura) {
    return `<footer class="reunion-acciones reunion-acciones--consulta"><p>${icono("check")} Este registro está completado y disponible en modo de consulta.</p><a class="boton boton--secundario" href="#sprint">Volver al Sprint</a></footer>`;
  }
  const esReview = tipo === "review";
  return `
    <footer class="reunion-acciones">
      <p data-estado-reunion role="status" aria-live="polite"></p>
      <div>
        <button class="boton boton--secundario" type="submit" data-guardar-reunion>Guardar borrador</button>
        <button class="boton boton--principal" type="button" data-completar-reunion ${esAdministrador ? "" : `disabled title="Solo un administrador puede completar este evento"`}>
          ${esReview ? "Completar Review" : "Finalizar Retrospectiva y Sprint"}${icono("flecha")}
        </button>
      </div>
    </footer>`;
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${fecha}T12:00:00`));
}

function formatearHora(fecha) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(fecha));
}

function iniciales(nombre) {
  return nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function etiquetaTipoMensaje(tipo) {
  return { MENSAJE: "Mensaje", AVANCE: "Avance", IMPEDIMENTO: "Impedimento" }[tipo] ?? tipo;
}

function renderizarParticipantesDaily(participantes, modo = "presentes") {
  const visibles = modo === "ausentes"
    ? participantes.filter((participante) => participante.ausente)
    : participantes.filter((participante) => participante.asistio);
  if (!visibles.length) return `<p class="daily-lista-vacia">No hay integrantes en esta lista.</p>`;
  return `<ul class="daily-participantes">${visibles.map((participante) => `
    <li>
      <span class="daily-avatar" aria-hidden="true">${escaparHtml(iniciales(participante.nombre))}</span>
      <span><strong>${escaparHtml(participante.nombre)}</strong><small>${modo === "ausentes" ? "No registró asistencia" : `Se unió a las ${formatearHora(participante.horaIngreso)}`}</small></span>
      <span class="daily-asistencia daily-asistencia--${modo === "ausentes" ? "ausente" : "presente"}" aria-label="${modo === "ausentes" ? "Ausente" : "Presente"}">${icono(modo === "ausentes" ? "eliminar" : "check")}</span>
    </li>`).join("")}</ul>`;
}

function renderizarMensajesDaily(mensajes, soloLectura = false, mensajeVacio = null) {
  if (!mensajes.length) {
    return `<div class="daily-actualizaciones__vacio">${icono("mensaje")}<p><strong>Aún no hay actualizaciones</strong><span>${mensajeVacio ?? (soloLectura ? "Esta Daily terminó sin publicaciones." : "Comparte un avance, mensaje o impedimento con el equipo.")}</span></p></div>`;
  }
  return `<ol class="daily-mensajes">${mensajes.map((mensaje) => `
    <li class="daily-mensaje daily-mensaje--${mensaje.tipo.toLowerCase()}">
      <span class="daily-avatar" aria-hidden="true">${escaparHtml(iniciales(mensaje.autor.nombre))}</span>
      <div>
        <header><strong>${escaparHtml(mensaje.autor.nombre)}</strong><span>${formatearHora(mensaje.fechaPublicacion)}</span></header>
        <span class="daily-mensaje__tipo">${mensaje.tipo === "IMPEDIMENTO" ? icono("alerta") : ""}${etiquetaTipoMensaje(mensaje.tipo)}</span>
        <p>${escaparHtml(mensaje.contenido)}</p>
      </div>
    </li>`).join("")}</ol>`;
}

function renderizarDetalleDaily(daily) {
  const estado = { PROGRAMADA: "Programada", EN_CURSO: "En curso", FINALIZADA: "Finalizada" }[daily.estado] ?? "No disponible";
  const mensajes = daily.messages ?? [];
  const avances = mensajes.filter((mensaje) => mensaje.tipo === "AVANCE");
  const impedimentos = mensajes.filter((mensaje) => mensaje.tipo === "IMPEDIMENTO");
  const duracion = daily.horaInicio && daily.horaFin
    ? `${Math.max(1, Math.round((new Date(daily.horaFin) - new Date(daily.horaInicio)) / 60000))} min`
    : "—";

  return `
    <div class="daily-detalle__fondo" data-daily-panel>
      <aside class="daily-detalle" role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-daily">
        <header class="daily-detalle__encabezado">
          <div><span>Consulta de Daily</span><h2 id="titulo-detalle-daily">Daily Scrum</h2><p>${formatearFecha(daily.fecha)}</p></div>
          <button class="daily-detalle__cerrar" type="button" data-cerrar-daily aria-label="Cerrar detalle">${icono("eliminar")}</button>
        </header>
        <div class="daily-detalle__contenido">
          <section class="daily-detalle__resumen" aria-label="Resumen de la Daily">
            <div><span>Estado</span><strong class="daily-detalle__estado daily-detalle__estado--${daily.estado?.toLowerCase() ?? "inactiva"}">${estado}</strong></div>
            <div><span>Inicio</span><strong>${formatearHora(daily.horaInicio)}</strong></div>
            <div><span>Finalización</span><strong>${formatearHora(daily.horaFin)}</strong></div>
            <div><span>Duración</span><strong>${duracion}</strong></div>
          </section>

          <div class="daily-detalle__asistencia">
            <section class="daily-detalle__bloque" aria-labelledby="titulo-detalle-participantes">
              <header><div><h3 id="titulo-detalle-participantes">Participantes</h3><p>${daily.attendeeCount ?? 0} de ${daily.expectedCount ?? 0} integrantes presentes</p></div><span>${daily.attendeeCount ?? 0}</span></header>
              ${renderizarParticipantesDaily(daily.participants ?? [])}
            </section>
            <section class="daily-detalle__bloque daily-detalle__bloque--ausentes" aria-labelledby="titulo-detalle-ausentes">
              <header><div><h3 id="titulo-detalle-ausentes">Ausentes</h3><p>Integrantes esperados sin asistencia</p></div><span>${daily.absentCount ?? 0}</span></header>
              ${renderizarParticipantesDaily(daily.participants ?? [], "ausentes")}
            </section>
          </div>

          <section class="daily-detalle__bloque" aria-labelledby="titulo-detalle-mensajes">
            <header><div><h3 id="titulo-detalle-mensajes">Mensajes y actualizaciones</h3><p>Publicaciones conservadas durante la sesión</p></div><span>${mensajes.length}</span></header>
            ${renderizarMensajesDaily(mensajes, true)}
          </section>
          <div class="daily-detalle__registros">
            <section class="daily-detalle__bloque" aria-labelledby="titulo-detalle-avances">
              <header><div><h3 id="titulo-detalle-avances">Avances registrados</h3><p>Actualizaciones de progreso</p></div><span>${avances.length}</span></header>
              ${renderizarMensajesDaily(avances, true, "Esta Daily no tiene avances registrados.")}
            </section>
            <section class="daily-detalle__bloque daily-detalle__bloque--impedimentos" aria-labelledby="titulo-detalle-impedimentos">
              <header><div><h3 id="titulo-detalle-impedimentos">Impedimentos registrados</h3><p>Bloqueos comunicados por el equipo</p></div><span>${impedimentos.length}</span></header>
              ${renderizarMensajesDaily(impedimentos, true, "Esta Daily no tiene impedimentos registrados.")}
            </section>
          </div>
        </div>
        <footer class="daily-detalle__pie"><span>${icono("check")} Registro en modo solo lectura</span><button class="boton boton--secundario" type="button" data-cerrar-daily>Cerrar</button></footer>
      </aside>
    </div>`;
}

function renderizarEncabezadoDaily(daily) {
  const estado = { PROGRAMADA: "Programada", EN_CURSO: "En curso", FINALIZADA: "Finalizada" }[daily.estado] ?? "No disponible";
  return `
    <header class="reuniones-encabezado">
      <div><h1>Reuniones</h1><p>Coordina el seguimiento diario del equipo y conserva sus avances e impedimentos.</p></div>
      <span class="reuniones-encabezado__estado reuniones-encabezado__estado--daily-${daily.estado?.toLowerCase() ?? "inactiva"}"><span aria-hidden="true"></span>${estado}</span>
    </header>
    ${renderizarNavegacionContextual("daily")}`;
}

function renderizarDailyProgramada(daily) {
  return `
    <section class="reuniones" data-vista-reunion="daily">
      ${renderizarEncabezadoDaily(daily)}
      <section class="daily-programada" aria-labelledby="titulo-daily-programada">
        <div class="daily-fecha" aria-hidden="true"><span>${new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(`${daily.fecha}T12:00:00`)).replace(".", "")}</span><strong>${daily.fecha.slice(-2)}</strong></div>
        <div class="daily-programada__contenido">
          <span class="daily-programada__estado">Próxima reunión del equipo</span>
          <h2 id="titulo-daily-programada">Daily Scrum</h2>
          <p class="daily-programada__fecha">${formatearFecha(daily.fecha)}</p>
          <p>Abre el registro para que el equipo confirme su asistencia y comparta avances o impedimentos.</p>
        </div>
        <div class="daily-programada__accion">
          <span>${daily.expectedCount} integrantes esperados</span>
          <button class="boton boton--principal" type="button" data-iniciar-daily>Iniciar Daily${icono("flecha")}</button>
        </div>
      </section>
      <p class="daily-estado-accion" data-estado-daily role="status" aria-live="polite"></p>
    </section>`;
}

function renderizarFormularioDaily() {
  return `
    <form class="daily-compositor" data-formulario-daily novalidate>
      <fieldset>
        <legend>Tipo de actualización</legend>
        <label><input type="radio" name="tipo" value="AVANCE" checked><span>Avance</span></label>
        <label><input type="radio" name="tipo" value="IMPEDIMENTO"><span>Impedimento</span></label>
        <label><input type="radio" name="tipo" value="MENSAJE"><span>Mensaje</span></label>
      </fieldset>
      <label class="daily-compositor__texto" for="daily-contenido"><span>¿Qué quieres compartir?</span><textarea id="daily-contenido" name="contenido" rows="3" required placeholder="Describe un avance concreto o el impedimento que necesita atención."></textarea></label>
      <footer><small>El registro queda asociado a esta Daily.</small><button class="boton boton--principal boton--compacto" type="submit">Publicar actualización${icono("flecha")}</button></footer>
    </form>`;
}

function renderizarDailyEnCurso(daily, esAdministrador) {
  const usuarioPresente = daily.participants.some((participante) => participante.userId === 1 && participante.asistio);
  const puedeFinalizar = esAdministrador || daily.iniciadaPor?.userId === 1;
  return `
    <section class="reuniones" data-vista-reunion="daily">
      ${renderizarEncabezadoDaily(daily)}
      <section class="daily-cabecera-sesion" aria-labelledby="titulo-daily-en-curso">
        <div><span>${formatearFecha(daily.fecha)}</span><h2 id="titulo-daily-en-curso">Daily Scrum en curso</h2><p>Iniciada a las ${formatearHora(daily.horaInicio)} por ${escaparHtml(daily.iniciadaPor.nombre)}</p></div>
        <div><strong>${daily.attendeeCount} / ${daily.expectedCount}</strong><span>presentes</span></div>
      </section>
      <div class="daily-sesion">
        <aside class="daily-equipo" aria-labelledby="titulo-presentes-daily">
          <header><div><h2 id="titulo-presentes-daily">Participantes presentes</h2><p>Asistencia registrada en esta sesión.</p></div><span>${daily.attendeeCount}</span></header>
          ${renderizarParticipantesDaily(daily.participants)}
          ${usuarioPresente ? "" : `<button class="boton boton--secundario" type="button" data-unirse-daily>Unirme a la Daily</button>`}
        </aside>
        <section class="daily-actualizaciones" aria-labelledby="titulo-actualizaciones-daily">
          <header><div><h2 id="titulo-actualizaciones-daily">Actualizaciones</h2><p>Mensajes, avances e impedimentos compartidos por el equipo.</p></div><span>${daily.messages.length}</span></header>
          ${renderizarMensajesDaily(daily.messages)}
          ${usuarioPresente ? renderizarFormularioDaily() : `<p class="daily-unirse-aviso">Únete a la Daily para publicar una actualización.</p>`}
        </section>
      </div>
      <footer class="daily-cierre">
        <p data-estado-daily role="status" aria-live="polite"></p>
        <button class="boton boton--secundario" type="button" data-finalizar-daily ${puedeFinalizar ? "" : `disabled title="Solo quien inició la Daily o un administrador puede finalizarla"`}>Finalizar Daily</button>
      </footer>
    </section>`;
}

function renderizarDailyFinalizada(daily) {
  return `
    <section class="reuniones" data-vista-reunion="daily">
      ${renderizarEncabezadoDaily(daily)}
      <section class="daily-resumen-final" aria-labelledby="titulo-daily-finalizada">
        <div><span>${icono("check")}</span><div><h2 id="titulo-daily-finalizada">Daily Scrum finalizada</h2><p>${formatearFecha(daily.fecha)} · Registro disponible en modo de consulta.</p></div></div>
        <dl><div><dt>Inicio</dt><dd>${formatearHora(daily.horaInicio)}</dd></div><div><dt>Fin</dt><dd>${formatearHora(daily.horaFin)}</dd></div><div><dt>Duración</dt><dd>${Math.max(1, Math.round((new Date(daily.horaFin) - new Date(daily.horaInicio)) / 60000))} min</dd></div></dl>
      </section>
      <div class="daily-resultado">
        <section class="daily-equipo" aria-labelledby="titulo-participantes-final"><header><div><h2 id="titulo-participantes-final">Participantes</h2><p>Integrantes que registraron asistencia.</p></div><span>${daily.attendeeCount}</span></header>${renderizarParticipantesDaily(daily.participants)}</section>
        <section class="daily-equipo daily-equipo--ausentes" aria-labelledby="titulo-ausentes-final"><header><div><h2 id="titulo-ausentes-final">Ausentes</h2><p>Integrantes esperados sin asistencia.</p></div><span>${daily.absentCount}</span></header>${renderizarParticipantesDaily(daily.participants, "ausentes")}</section>
      </div>
      <section class="daily-actualizaciones daily-actualizaciones--consulta" aria-labelledby="titulo-registro-final"><header><div><h2 id="titulo-registro-final">Registro de actualizaciones</h2><p>Contenido publicado durante la sesión.</p></div><span>${daily.messages.length}</span></header>${renderizarMensajesDaily(daily.messages, true)}</section>
    </section>`;
}

function renderizarHistorialDailies(historial) {
  const etiquetasEstado = { PROGRAMADA: "Programada", EN_CURSO: "En curso", FINALIZADA: "Finalizada" };
  return `
    <section class="daily-historial" aria-labelledby="titulo-historial-dailies">
      <header><div><h2 id="titulo-historial-dailies">Historial de Dailies</h2><p>Selecciona una Daily para consultar su registro sin abandonar Reuniones.</p></div><span>${historial.length}</span></header>
      ${historial.length ? `<ol>${historial.map((daily, indice) => `<li><button type="button" data-ver-daily="${indice}"><time datetime="${daily.fecha}">${formatearFecha(daily.fecha)}</time><span><strong>Daily Scrum</strong><small>${daily.attendeeCount} de ${daily.expectedCount} presentes</small></span><em class="daily-historial__estado daily-historial__estado--${daily.estado?.toLowerCase() ?? "inactiva"}">${etiquetasEstado[daily.estado] ?? "No disponible"}</em><span class="daily-historial__abrir">Consultar ${icono("flecha")}</span></button></li>`).join("")}</ol>` : `<p class="daily-lista-vacia">Todavía no hay Dailies registradas en este Sprint.</p>`}
    </section>`;
}

function renderizarDaily(daily, esAdministrador, historial) {
  let vista;
  if (!daily.dailyDisponible) vista = `<section class="reuniones reuniones--bloqueadas" data-vista-reunion="daily">${renderizarEncabezadoDaily(daily)}<section class="reunion-bloqueada"><span>${icono("calendario")}</span><h2>No hay una Daily disponible</h2><p>La Daily aparecerá cuando exista un Sprint activo y una sesión programada para hoy.</p><a class="boton boton--secundario" href="#sprint">Volver al Sprint</a></section></section>`;
  else if (daily.estado === "EN_CURSO") vista = renderizarDailyEnCurso(daily, esAdministrador);
  else if (daily.estado === "FINALIZADA") vista = renderizarDailyFinalizada(daily);
  else vista = renderizarDailyProgramada(daily);
  return vista.replace(/<\/section>$/, `${renderizarHistorialDailies(historial)}</section>`);
}

function renderizarReview(review, esAdministrador) {
  const soloLectura = review.estado === "COMPLETADA" || review.sprintEstado === "FINALIZADO";
  return `
    <section class="reuniones" data-vista-reunion="review">
      <header class="reuniones-encabezado">
        <div><h1>Reuniones</h1><p>Inspecciona el resultado del Sprint y registra los acuerdos antes de iniciar la Retrospectiva.</p></div>
        <span class="reuniones-encabezado__estado ${review.sprintEstado === "FINALIZADO" ? "reuniones-encabezado__estado--final" : ""}">${review.sprintEstado === "FINALIZADO" ? "Sprint finalizado" : "Sprint en cierre"}</span>
      </header>
      ${renderizarNavegacionContextual("review")}
      ${renderizarFlujo(review.estado === "COMPLETADA", review.retrospectiveEstado === "COMPLETADA", "review")}

      <form class="reunion-formulario" data-formulario-review novalidate>
        <section class="reunion-identidad" aria-labelledby="titulo-sprint-goal-review">
          <span>Sprint Goal</span>
          <h2 id="titulo-sprint-goal-review">${escaparHtml(review.sprintGoal || "Sin Sprint Goal registrado")}</h2>
        </section>

        <div class="reunion-trabajo">
          <section aria-labelledby="titulo-incremento-review">
            <header><div><h2 id="titulo-incremento-review">Incremento derivado</h2><p>Trabajo terminado que cumple la Definition of Done.</p></div><strong>${review.incrementItems.length}</strong></header>
            ${renderizarTrabajo(review.incrementItems, "incremento")}
          </section>
          <section aria-labelledby="titulo-incompleto-review">
            <header><div><h2 id="titulo-incompleto-review">Trabajo incompleto</h2><p>No se moverá automáticamente al siguiente Sprint.</p></div><strong>${review.incompleteItems.length}</strong></header>
            ${renderizarTrabajo(review.incompleteItems, "incompleto")}
          </section>
        </div>

        <section class="reunion-bloque" aria-labelledby="titulo-asistencia-review">
          <header><h2 id="titulo-asistencia-review">Asistencia</h2><p>Registra tanto al equipo como a las personas externas que participaron.</p></header>
          <div class="reunion-campos reunion-campos--dos">
            ${campoTexto({ id: "review-participantes", nombre: "participantes", etiqueta: "Participantes", valor: review.participantes, ayuda: "Integrantes del proyecto que asistieron.", filas: 3, requerido: true, deshabilitado: soloLectura })}
            ${campoTexto({ id: "review-stakeholders", nombre: "stakeholdersExternos", etiqueta: "Stakeholders", valor: review.stakeholdersExternos, ayuda: "Personas externas; no necesitan una cuenta.", filas: 3, deshabilitado: soloLectura })}
          </div>
        </section>

        <section class="reunion-bloque" aria-labelledby="titulo-registro-review">
          <header><h2 id="titulo-registro-review">Registro de la Review</h2><p>Deja trazabilidad de lo presentado, lo aprendido y las decisiones tomadas.</p></header>
          <div class="reunion-campos">
            ${campoTexto({ id: "review-resultados", nombre: "resultados", etiqueta: "Resultados", valor: review.resultados, ayuda: "Resume el resultado presentado y el cumplimiento del Sprint Goal.", requerido: true, deshabilitado: soloLectura })}
            <div class="reunion-campos--dos">
              ${campoTexto({ id: "review-retroalimentacion", nombre: "retroalimentacion", etiqueta: "Retroalimentación", valor: review.retroalimentacion, ayuda: "Comentarios, preguntas y observaciones recibidas.", deshabilitado: soloLectura })}
              ${campoTexto({ id: "review-decisiones", nombre: "decisiones", etiqueta: "Decisiones", valor: review.decisiones, ayuda: "Acuerdos que adaptan el producto o el Product Backlog.", deshabilitado: soloLectura })}
            </div>
            ${campoTexto({ id: "review-conclusion", nombre: "conclusion", etiqueta: "Conclusión", valor: review.conclusion, ayuda: "Síntesis final de la inspección del incremento.", requerido: true, deshabilitado: soloLectura })}
          </div>
        </section>
        ${renderizarPieFormulario("review", soloLectura, esAdministrador)}
      </form>
    </section>`;
}

function renderizarAccion(accion, soloLectura) {
  const convertida = Boolean(accion.elementoBacklogId);
  return `
    <li class="accion-mejora" data-accion-id="${accion.accionMejoraId ?? ""}" ${accion.elementoBacklogId ? `data-elemento-backlog-id="${accion.elementoBacklogId}"` : ""}>
      <span class="accion-mejora__posicion">${accion.posicion}</span>
      <label><span class="sr-only">Descripción de la acción ${accion.posicion}</span><input name="accionMejora" value="${escaparAtributo(accion.descripcion)}" ${soloLectura ? "disabled" : ""}></label>
      ${convertida
        ? `<span class="accion-mejora__convertida">${icono("backlog")} Product Backlog #${accion.elementoBacklogId}</span>`
        : soloLectura
          ? ""
          : `<div class="accion-mejora__opciones"><button type="button" data-mostrar-conversion>${icono("backlog")} Convertir en elemento</button><button type="button" data-eliminar-accion aria-label="Eliminar acción ${accion.posicion}">${icono("eliminar")}</button></div>`}
      ${!convertida && !soloLectura ? `
        <div class="accion-conversion" data-conversion hidden>
          <label>Título del elemento<input name="tituloBacklog" value="${escaparAtributo(accion.descripcion)}"></label>
          <label>Prioridad<select name="prioridadBacklog"><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="BAJA">Baja</option></select></label>
          <button class="boton boton--principal" type="button" data-convertir-accion>Agregar al Product Backlog</button>
        </div>` : ""}
    </li>`;
}

function renderizarRetrospectiva(retrospectiva, esAdministrador) {
  const soloLectura = retrospectiva.estado === "COMPLETADA" || retrospectiva.sprintEstado === "FINALIZADO";
  return `
    <section class="reuniones" data-vista-reunion="retrospectiva">
      <header class="reuniones-encabezado">
        <div><h1>Reuniones</h1><p>Convierte los aprendizajes del Sprint en cambios concretos para la forma de trabajar.</p></div>
        <span class="reuniones-encabezado__estado ${soloLectura ? "reuniones-encabezado__estado--final" : ""}">${soloLectura ? "Sprint finalizado" : "Review completada"}</span>
      </header>
      ${renderizarNavegacionContextual("retrospectiva")}
      ${renderizarFlujo(true, retrospectiva.estado === "COMPLETADA", "retrospectiva")}

      <form class="reunion-formulario" data-formulario-retrospectiva novalidate>
        <section class="reunion-bloque" aria-labelledby="titulo-participantes-retro">
          <header><h2 id="titulo-participantes-retro">Sprint Retrospective</h2><p>Registra quién participó y ordena la conversación alrededor de hechos observables.</p></header>
          ${campoTexto({ id: "retro-participantes", nombre: "participantes", etiqueta: "Participantes", valor: retrospectiva.participantes, ayuda: "Integrantes que participaron en la Retrospectiva.", filas: 3, requerido: true, deshabilitado: soloLectura })}
        </section>

        <section class="retrospectiva-reflexion" aria-label="Reflexión del Sprint">
          ${campoTexto({ id: "retro-positivos", nombre: "aspectosPositivos", etiqueta: "¿Qué funcionó bien?", valor: retrospectiva.aspectosPositivos, ayuda: "Prácticas y decisiones que conviene mantener.", filas: 5, deshabilitado: soloLectura })}
          ${campoTexto({ id: "retro-problemas", nombre: "problemas", etiqueta: "Problemas encontrados", valor: retrospectiva.problemas, ayuda: "Dificultades, fricciones y causas observadas.", filas: 5, deshabilitado: soloLectura })}
          ${campoTexto({ id: "retro-propuestas", nombre: "propuestas", etiqueta: "Propuestas y mejoras", valor: retrospectiva.propuestas, ayuda: "Ideas para mejorar procesos, herramientas o colaboración.", filas: 5, deshabilitado: soloLectura })}
        </section>

        <section class="reunion-bloque acciones-mejora" aria-labelledby="titulo-acciones-mejora">
          <header><h2 id="titulo-acciones-mejora">Acciones de mejora</h2><p>Define compromisos concretos. Puedes convertir cualquiera en un elemento independiente del Product Backlog.</p></header>
          <ol data-lista-acciones>
            ${retrospectiva.accionesMejora.map((accion) => renderizarAccion(accion, soloLectura)).join("")}
          </ol>
          ${soloLectura ? "" : `<button class="acciones-mejora__agregar" type="button" data-agregar-accion>${icono("mas")} Añadir acción de mejora</button>`}
        </section>

        <section class="reunion-bloque" aria-labelledby="titulo-conclusion-retro">
          <header><h2 id="titulo-conclusion-retro">Conclusión</h2><p>Resume el acuerdo del equipo y el foco de mejora para el siguiente ciclo.</p></header>
          ${campoTexto({ id: "retro-conclusion", nombre: "conclusion", etiqueta: "Conclusión de la Retrospectiva", valor: retrospectiva.conclusion, ayuda: "Esta conclusión quedará en el historial del Sprint.", requerido: true, deshabilitado: soloLectura })}
        </section>
        ${renderizarPieFormulario("retrospectiva", soloLectura, esAdministrador)}
      </form>
    </section>`;
}

function renderizarBloqueo(mensaje) {
  return `
    <section class="reuniones reuniones--bloqueadas" data-vista-reunion="retrospectiva">
      <header class="reuniones-encabezado"><div><h1>Reuniones</h1><p>Los eventos de cierre deben completarse en orden.</p></div><span class="reuniones-encabezado__estado">Sprint en cierre</span></header>
      ${renderizarNavegacionContextual("retrospectiva")}
      ${renderizarFlujo(false, false, "retrospectiva")}
      <section class="reunion-bloqueada">
        <span>${icono("bloqueo")}</span><h2>La Retrospectiva aún está bloqueada</h2><p>${escaparHtml(mensaje)}</p>
        <a class="boton boton--principal" href="#reuniones/review">Ir a Sprint Review${icono("flecha")}</a>
      </section>
    </section>`;
}

function obtenerDatosReview(formulario) {
  const datos = new FormData(formulario);
  return Object.fromEntries(datos.entries());
}

function obtenerDatosRetrospectiva(formulario) {
  const datos = new FormData(formulario);
  const accionesMejora = [...formulario.querySelectorAll("[data-accion-id]")].map((elemento, indice) => ({
    accionMejoraId: Number(elemento.dataset.accionId) || null,
    descripcion: elemento.querySelector(`[name="accionMejora"]`).value.trim(),
    posicion: indice + 1,
    elementoBacklogId: elemento.dataset.elementoBacklogId ? Number(elemento.dataset.elementoBacklogId) : null
  }));
  return {
    participantes: datos.get("participantes"),
    aspectosPositivos: datos.get("aspectosPositivos"),
    problemas: datos.get("problemas"),
    propuestas: datos.get("propuestas"),
    conclusion: datos.get("conclusion"),
    accionesMejora
  };
}

export async function inicializarReuniones(contenedor, projectId, eventoSolicitado, esAdministrador) {
  sesiones.get(contenedor)?.abort();
  const sesion = new AbortController();
  sesiones.set(contenedor, sesion);
  let daily;
  let historialDailies = [];
  let review;
  let retrospectiva = null;
  let vista = ["review", "retrospectiva"].includes(eventoSolicitado) ? eventoSolicitado : "daily";

  async function cargar() {
    if (vista === "daily") {
      daily = await obtenerDailyHoy(projectId);
      historialDailies = await obtenerHistorialDailies(projectId, daily.sprintId);
      return;
    }
    review = await obtenerSprintReview(projectId);
    if (review.estado === "COMPLETADA") retrospectiva = await obtenerSprintRetrospective(projectId);
    if (!eventoSolicitado && review.estado === "COMPLETADA" && retrospectiva?.estado !== "COMPLETADA") vista = "retrospectiva";
  }

  function renderizar() {
    if (vista === "daily") {
      contenedor.innerHTML = renderizarDaily(daily, esAdministrador, historialDailies);
      return;
    }
    if (vista === "retrospectiva" && review.estado !== "COMPLETADA") {
      contenedor.innerHTML = renderizarBloqueo("Completa la Sprint Review antes de iniciar la Retrospectiva.");
      return;
    }
    contenedor.innerHTML = vista === "retrospectiva" ? renderizarRetrospectiva(retrospectiva, esAdministrador) : renderizarReview(review, esAdministrador);
  }

  function mostrarEstado(mensaje, tipo = "exito") {
    const estado = contenedor.querySelector("[data-estado-reunion], [data-estado-daily]");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
  }

  function sincronizarIdsAcciones() {
    const filas = [...contenedor.querySelectorAll("[data-formulario-retrospectiva] [data-accion-id]")]
      .filter((fila) => fila.querySelector('[name="accionMejora"]')?.value.trim());
    filas.forEach((fila, indice) => {
      const accion = retrospectiva.accionesMejora[indice];
      if (accion) {
        fila.dataset.accionId = accion.accionMejoraId;
        if (accion.elementoBacklogId) fila.dataset.elementoBacklogId = accion.elementoBacklogId;
      }
    });
  }

  function marcarCamposInvalidos(formulario, nombres) {
    formulario.querySelectorAll("[aria-invalid]").forEach((campo) => campo.removeAttribute("aria-invalid"));
    const campos = nombres.map((nombre) => formulario.elements[nombre]).filter(Boolean);
    campos.forEach((campo) => campo.setAttribute("aria-invalid", "true"));
    campos[0]?.focus();
  }

  async function guardarReview() {
    const formulario = contenedor.querySelector("[data-formulario-review]");
    review = await guardarSprintReview(projectId, review.sprintId, obtenerDatosReview(formulario));
    renderizar();
    mostrarEstado("Sprint Review guardada");
  }

  async function guardarRetrospectiva() {
    const formulario = contenedor.querySelector("[data-formulario-retrospectiva]");
    retrospectiva = await guardarSprintRetrospective(projectId, retrospectiva.sprintId, obtenerDatosRetrospectiva(formulario));
    sincronizarIdsAcciones();
    renderizar();
    mostrarEstado("Sprint Retrospective guardada");
  }

  try {
    await cargar();
    renderizar();
  } catch (error) {
    contenedor.innerHTML = `<section class="reuniones-error"><h1>Reuniones</h1><p>${escaparHtml(error.message)}</p><a class="boton boton--secundario" href="#sprint">Volver al Sprint</a></section>`;
    return;
  }

  contenedor.addEventListener("submit", async (evento) => {
    if (!evento.target.matches("[data-formulario-daily], [data-formulario-review], [data-formulario-retrospectiva]")) return;
    evento.preventDefault();
    try {
      if (evento.target.matches("[data-formulario-daily]")) {
        const datos = new FormData(evento.target);
        await publicarMensajeDaily(projectId, daily.sprintId, daily.dailyId, {
          tipo: datos.get("tipo"),
          contenido: datos.get("contenido")
        });
        daily = await obtenerDailyHoy(projectId);
        historialDailies = await obtenerHistorialDailies(projectId, daily.sprintId);
        renderizar();
        mostrarEstado(datos.get("tipo") === "IMPEDIMENTO" ? "Impedimento agregado al seguimiento del proyecto" : "Actualización publicada correctamente");
        contenedor.querySelector("#daily-contenido")?.focus();
      } else if (evento.target.matches("[data-formulario-review]")) await guardarReview();
      else await guardarRetrospectiva();
    } catch (error) {
      if (evento.target.matches("[data-formulario-daily]")) {
        evento.target.elements.contenido?.setAttribute("aria-invalid", "true");
        evento.target.elements.contenido?.focus();
      }
      mostrarEstado(error.message, "error");
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("click", async (evento) => {
    const cerrarDaily = evento.target.closest("[data-cerrar-daily]");
    const fondoDaily = evento.target.matches("[data-daily-panel]");
    if (cerrarDaily || fondoDaily) {
      contenedor.querySelector("[data-daily-panel]")?.remove();
      return;
    }

    const verDaily = evento.target.closest("[data-ver-daily]");
    if (verDaily) {
      const dailySeleccionada = historialDailies[Number(verDaily.dataset.verDaily)];
      if (!dailySeleccionada) return;
      contenedor.querySelector("[data-daily-panel]")?.remove();
      contenedor.insertAdjacentHTML("beforeend", renderizarDetalleDaily(dailySeleccionada));
      contenedor.querySelector("[data-cerrar-daily]")?.focus();
      return;
    }

    const pasoBloqueado = evento.target.closest(`[aria-disabled="true"]`);
    if (pasoBloqueado) {
      evento.preventDefault();
      return;
    }

    const iniciar = evento.target.closest("[data-iniciar-daily]");
    if (iniciar) {
      iniciar.disabled = true;
      try {
        daily = await iniciarDaily(projectId, daily.sprintId);
        renderizar();
        mostrarEstado("Daily Scrum iniciada");
      } catch (error) {
        iniciar.disabled = false;
        mostrarEstado(error.message, "error");
      }
      return;
    }

    const unirse = evento.target.closest("[data-unirse-daily]");
    if (unirse) {
      unirse.disabled = true;
      try {
        await unirseDaily(projectId, daily.sprintId, daily.dailyId);
        daily = await obtenerDailyHoy(projectId);
        historialDailies = await obtenerHistorialDailies(projectId, daily.sprintId);
        renderizar();
        mostrarEstado("Te uniste a la Daily Scrum");
      } catch (error) {
        unirse.disabled = false;
        mostrarEstado(error.message, "error");
      }
      return;
    }

    const finalizar = evento.target.closest("[data-finalizar-daily]");
    if (finalizar) {
      finalizar.disabled = true;
      try {
        await finalizarDaily(projectId, daily.sprintId, daily.dailyId);
        daily = await obtenerDailyHoy(projectId);
        historialDailies = await obtenerHistorialDailies(projectId, daily.sprintId);
        renderizar();
      } catch (error) {
        finalizar.disabled = false;
        mostrarEstado(error.message, "error");
      }
      return;
    }

    if (evento.target.closest("[data-agregar-accion]")) {
      const lista = contenedor.querySelector("[data-lista-acciones]");
      const posicion = lista.children.length + 1;
      lista.insertAdjacentHTML("beforeend", renderizarAccion({ accionMejoraId: null, descripcion: "", posicion, elementoBacklogId: null }, false));
      lista.lastElementChild.querySelector("input")?.focus();
      return;
    }

    const eliminar = evento.target.closest("[data-eliminar-accion]");
    if (eliminar) {
      eliminar.closest("[data-accion-id]").remove();
      contenedor.querySelectorAll(".accion-mejora__posicion").forEach((posicion, indice) => { posicion.textContent = indice + 1; });
      return;
    }

    const mostrarConversion = evento.target.closest("[data-mostrar-conversion]");
    if (mostrarConversion) {
      const panel = mostrarConversion.closest("[data-accion-id]").querySelector("[data-conversion]");
      panel.hidden = !panel.hidden;
      if (!panel.hidden) panel.querySelector("input")?.focus();
      return;
    }

    const convertir = evento.target.closest("[data-convertir-accion]");
    if (convertir) {
      try {
        const formulario = contenedor.querySelector("[data-formulario-retrospectiva]");
        retrospectiva = await guardarSprintRetrospective(projectId, retrospectiva.sprintId, obtenerDatosRetrospectiva(formulario));
        sincronizarIdsAcciones();
        const fila = convertir.closest("[data-accion-id]");
        const accionId = Number(fila.dataset.accionId);
        const accion = retrospectiva.accionesMejora.find((actual) => actual.accionMejoraId === accionId);
        if (!accion) throw new Error("Describe la acción de mejora antes de convertirla");
        await convertirAccionMejora(projectId, retrospectiva.sprintId, accion.accionMejoraId, {
          titulo: fila.querySelector(`[name="tituloBacklog"]`).value,
          descripcion: accion.descripcion,
          prioridad: fila.querySelector(`[name="prioridadBacklog"]`).value
        });
        retrospectiva = await obtenerSprintRetrospective(projectId);
        renderizar();
        mostrarEstado("Acción de mejora agregada al Product Backlog");
      } catch (error) {
        mostrarEstado(error.message, "error");
      }
      return;
    }

    if (evento.target.closest("[data-completar-reunion]")) {
      const boton = evento.target.closest("[data-completar-reunion]");
      boton.disabled = true;
      try {
        if (vista === "review") {
          const formulario = contenedor.querySelector("[data-formulario-review]");
          await completarSprintReview(projectId, review.sprintId, obtenerDatosReview(formulario));
          review = await obtenerSprintReview(projectId);
          retrospectiva = await obtenerSprintRetrospective(projectId);
          vista = "retrospectiva";
          history.replaceState(null, "", "#reuniones/retrospectiva");
          renderizar();
          mostrarEstado("Sprint Review completada. Ya puedes realizar la Retrospectiva");
        } else {
          const formulario = contenedor.querySelector("[data-formulario-retrospectiva]");
          await completarSprintRetrospective(projectId, retrospectiva.sprintId, obtenerDatosRetrospectiva(formulario));
          window.location.hash = "#sprint";
        }
      } catch (error) {
        boton.disabled = false;
        if (vista === "review") {
          const formulario = contenedor.querySelector("[data-formulario-review]");
          const datos = obtenerDatosReview(formulario);
          marcarCamposInvalidos(formulario, [
            !datos.participantes.trim() && "participantes",
            !datos.resultados.trim() && "resultados",
            !datos.conclusion.trim() && "conclusion"
          ].filter(Boolean));
        } else {
          const formulario = contenedor.querySelector("[data-formulario-retrospectiva]");
          const datos = obtenerDatosRetrospectiva(formulario);
          const sinObservaciones = !datos.aspectosPositivos.trim() && !datos.problemas.trim() && !datos.propuestas.trim();
          marcarCamposInvalidos(formulario, [
            !datos.participantes.trim() && "participantes",
            sinObservaciones && "aspectosPositivos",
            !datos.conclusion.trim() && "conclusion"
          ].filter(Boolean));
          if (!datos.accionesMejora.length) formulario.querySelector("[data-agregar-accion]")?.focus();
        }
        mostrarEstado(error.message, "error");
      }
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") contenedor.querySelector("[data-daily-panel]")?.remove();
  }, { signal: sesion.signal });

  contenedor.addEventListener("input", (evento) => {
    if (evento.target.matches("[aria-invalid]")) evento.target.removeAttribute("aria-invalid");
  }, { signal: sesion.signal });
}
