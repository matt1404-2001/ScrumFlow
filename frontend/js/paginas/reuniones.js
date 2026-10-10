import {
  completarSprintRetrospective,
  completarSprintReview,
  convertirAccionMejora,
  guardarSprintRetrospective,
  guardarSprintReview,
  obtenerSprintRetrospective,
  obtenerSprintReview
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
    backlog: `<path d="M5 4h10v12H5zM8 8h4M8 11h4"></path>`
  };
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${rutas[nombre]}</svg>`;
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

function renderizarReview(review, esAdministrador) {
  const soloLectura = review.estado === "COMPLETADA" || review.sprintEstado === "FINALIZADO";
  return `
    <section class="reuniones" data-vista-reunion="review">
      <header class="reuniones-encabezado">
        <div><h1>Reuniones</h1><p>Inspecciona el resultado del Sprint y registra los acuerdos antes de iniciar la Retrospectiva.</p></div>
        <span class="reuniones-encabezado__estado ${review.sprintEstado === "FINALIZADO" ? "reuniones-encabezado__estado--final" : ""}">${review.sprintEstado === "FINALIZADO" ? "Sprint finalizado" : "Sprint en cierre"}</span>
      </header>
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
    <li class="accion-mejora" data-accion-id="${accion.accionMejoraId ?? ""}">
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
    elementoBacklogId: elemento.querySelector(".accion-mejora__convertida")
      ? Number(elemento.querySelector(".accion-mejora__convertida").textContent.match(/#(\d+)/)?.[1])
      : null
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
  let review;
  let retrospectiva = null;
  let vista = eventoSolicitado === "retrospectiva" ? "retrospectiva" : "review";

  async function cargar() {
    review = await obtenerSprintReview(projectId);
    if (review.estado === "COMPLETADA") retrospectiva = await obtenerSprintRetrospective(projectId);
    if (!eventoSolicitado && review.estado === "COMPLETADA" && retrospectiva?.estado !== "COMPLETADA") vista = "retrospectiva";
  }

  function renderizar() {
    if (vista === "retrospectiva" && review.estado !== "COMPLETADA") {
      contenedor.innerHTML = renderizarBloqueo("Completa la Sprint Review antes de iniciar la Retrospectiva.");
      return;
    }
    contenedor.innerHTML = vista === "retrospectiva" ? renderizarRetrospectiva(retrospectiva, esAdministrador) : renderizarReview(review, esAdministrador);
  }

  function mostrarEstado(mensaje, tipo = "exito") {
    const estado = contenedor.querySelector("[data-estado-reunion]");
    if (!estado) return;
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
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
    if (!evento.target.matches("[data-formulario-review], [data-formulario-retrospectiva]")) return;
    evento.preventDefault();
    try {
      if (evento.target.matches("[data-formulario-review]")) await guardarReview();
      else await guardarRetrospectiva();
    } catch (error) {
      mostrarEstado(error.message, "error");
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("click", async (evento) => {
    const pasoBloqueado = evento.target.closest(`[aria-disabled="true"]`);
    if (pasoBloqueado) {
      evento.preventDefault();
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
        const fila = convertir.closest("[data-accion-id]");
        const filasConContenido = [...formulario.querySelectorAll("[data-accion-id]")]
          .filter((elemento) => elemento.querySelector(`[name="accionMejora"]`).value.trim());
        const accion = retrospectiva.accionesMejora[filasConContenido.indexOf(fila)];
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
          retrospectiva = await obtenerSprintRetrospective(projectId);
          renderizar();
          mostrarEstado("Retrospectiva completada y Sprint finalizado");
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

  contenedor.addEventListener("input", (evento) => {
    if (evento.target.matches("[aria-invalid]")) evento.target.removeAttribute("aria-invalid");
  }, { signal: sesion.signal });
}
