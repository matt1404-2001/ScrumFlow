import { obtenerProductBacklog } from "../api/backlog.js";
import {
  activarSprint,
  actualizarBorradorSprint,
  crearBorradorSprint,
  obtenerResumenCierreSprint,
  obtenerSprintActual,
  obtenerUltimoSprintFinalizado
} from "../api/sprints.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";
import { inicializarSprintActivo } from "./sprint-activo.js";
import { renderizarSprintEnCierre, renderizarSprintFinalizado } from "./sprint-cierre.js";

const sesiones = new WeakMap();

function renderizarSinSprint() {
  return `
    <section class="sprint-vacio" aria-labelledby="titulo-sprint-vacio">
      <div class="sprint-vacio__visual" aria-hidden="true">
        <svg viewBox="0 0 64 64"><path d="M32 11a21 21 0 1 1-17.8 9.9M12 11v12h12M32 20v13l8 5"></path></svg>
        <span></span>
      </div>
      <h2 id="titulo-sprint-vacio">No existe un Sprint actualmente</h2>
      <p>Prepara el siguiente objetivo del equipo, define sus fechas y selecciona el trabajo que formará parte del Sprint.</p>
      <button class="boton boton--principal" type="button" data-planificar-sprint>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"></path></svg>
        Planificar Sprint
      </button>
    </section>`;
}

function renderizarElementoDisponible(item, seleccionado) {
  const noDisponible = item.retirado || (item.sprintActualId && !seleccionado);
  const deshabilitado = noDisponible || !item.preparado;
  const detalle = noDisponible
    ? "No disponible"
    : item.preparado
      ? `${item.descripcion}`
      : `Por refinar: ${item.faltantesPreparacion.join(" y ")}`;

  return `
    <label class="sprint-elemento ${seleccionado ? "sprint-elemento--seleccionado" : ""} ${deshabilitado ? "sprint-elemento--deshabilitado" : ""}">
      <input type="checkbox" value="${item.elementoBacklogId}" data-seleccionar-item ${seleccionado ? "checked" : ""} ${deshabilitado ? "disabled" : ""}>
      <span class="sprint-elemento__control" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3.5 8.2 2.8 2.8 6.2-6.2"></path></svg></span>
      <span class="sprint-elemento__contenido">
        <strong>${escaparHtml(item.titulo)}</strong>
        <span>${escaparHtml(detalle)}</span>
      </span>
      <span class="sprint-elemento__estimacion" aria-label="${item.estimacion ?? 0} puntos">${item.estimacion ?? "—"}<small> pts</small></span>
    </label>`;
}

function renderizarSeleccionados(items) {
  if (!items.length) {
    return `<div class="sprint-seleccion-vacia"><p>Aún no seleccionaste elementos.</p><span>Elige trabajo preparado desde el Product Backlog.</span></div>`;
  }

  return `<ul class="sprint-seleccion-lista">
    ${items.map((item) => `
      <li>
        <span><strong>${escaparHtml(item.titulo)}</strong><small>${item.estimacion} puntos</small></span>
        <button type="button" data-quitar-item="${item.elementoBacklogId}" aria-label="Quitar ${escaparAtributo(item.titulo)} de la selección">
          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m5 5 8 8M13 5l-8 8"></path></svg>
        </button>
      </li>`).join("")}
  </ul>`;
}

function renderizarCondiciones(faltantes) {
  if (!faltantes.length) {
    return `
      <div class="sprint-condiciones sprint-condiciones--listas">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9"></path></svg>
        <div><strong>Todo listo para activar</strong><p>La planificación cumple las condiciones requeridas.</p></div>
      </div>`;
  }

  return `
    <div class="sprint-condiciones">
      <div class="sprint-condiciones__cabecera">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 6v4M10 14h.01M10 2.8 18 17H2z"></path></svg>
        <div><strong>Condiciones pendientes</strong><p>${faltantes.length} ${faltantes.length === 1 ? "condición impide" : "condiciones impiden"} activar el Sprint.</p></div>
      </div>
      <ul>${faltantes.map((faltante) => `<li>${escaparHtml(faltante)}</li>`).join("")}</ul>
    </div>`;
}

function renderizarBorrador(sprint, backlog) {
  const seleccionados = new Set(sprint.selectedItems.map((item) => item.elementoBacklogId));
  return `
    <form class="sprint-planificacion" data-formulario-sprint novalidate>
      <header class="encabezado-sprint">
        <div>
          <div class="encabezado-sprint__titulo"><h1>Planificación del Sprint</h1><span>Borrador</span></div>
          <p>Define el propósito y acuerda una cantidad de trabajo realista antes de activar el Sprint.</p>
        </div>
        <span class="encabezado-sprint__guardado" data-estado-guardado>Sin cambios pendientes</span>
      </header>

      <section class="sprint-configuracion" aria-labelledby="titulo-configuracion-sprint">
        <div class="sprint-bloque__cabecera">
          <div><h2 id="titulo-configuracion-sprint">Objetivo y duración</h2><p>El Sprint Goal orientará las decisiones del equipo durante el Sprint.</p></div>
        </div>
        <div class="campo-sprint campo-sprint--goal">
          <label for="sprint-goal">Sprint Goal</label>
          <textarea id="sprint-goal" name="sprintGoal" rows="3" maxlength="500" placeholder="Describe el resultado que el equipo quiere lograr">${escaparHtml(sprint.sprintGoal)}</textarea>
        </div>
        <div class="sprint-fechas">
          <div class="campo-sprint"><label for="fecha-inicio">Fecha de inicio</label><input id="fecha-inicio" name="fechaInicio" type="date" value="${sprint.fechaInicio ?? ""}"></div>
          <div class="campo-sprint"><label for="fecha-fin">Fecha de fin</label><input id="fecha-fin" name="fechaFin" type="date" value="${sprint.fechaFin ?? ""}"></div>
          <p>La duración máxima es de 28 días naturales.</p>
        </div>
      </section>

      <div class="sprint-trabajo">
        <section class="sprint-disponibles" aria-labelledby="titulo-elementos-disponibles">
          <div class="sprint-bloque__cabecera">
            <div><h2 id="titulo-elementos-disponibles">Product Backlog disponible</h2><p>Selecciona únicamente elementos preparados para trabajar.</p></div>
            <span>${backlog.items.length} ${backlog.items.length === 1 ? "elemento" : "elementos"}</span>
          </div>
          <div class="sprint-disponibles__lista" data-elementos-disponibles>
            ${backlog.items.length ? backlog.items.map((item) => renderizarElementoDisponible(item, seleccionados.has(item.elementoBacklogId))).join("") : `<p class="sprint-disponibles__vacio">No hay elementos disponibles en el Product Backlog.</p>`}
          </div>
        </section>

        <aside class="sprint-resumen" aria-labelledby="titulo-seleccion-sprint">
          <div class="sprint-resumen__cabecera">
            <div><h2 id="titulo-seleccion-sprint">Elementos seleccionados</h2><p data-cantidad-seleccionada>${sprint.cantidadElementos} ${sprint.cantidadElementos === 1 ? "elemento" : "elementos"}</p></div>
            <div class="sprint-resumen__total"><strong data-estimacion-total>${sprint.estimacionTotal}</strong><span>puntos totales</span></div>
          </div>
          <div data-elementos-seleccionados>${renderizarSeleccionados(sprint.selectedItems)}</div>
          <div data-condiciones-activacion>${renderizarCondiciones(sprint.faltantesActivacion)}</div>
        </aside>
      </div>

      <footer class="sprint-acciones">
        <p data-estado-sprint role="status" aria-live="polite"></p>
        <div>
          <button class="boton boton--secundario" type="submit" data-guardar-borrador>Guardar borrador</button>
          <button class="boton boton--principal" type="button" data-activar-sprint ${sprint.faltantesActivacion.length ? "disabled" : ""}>
            Activar Sprint
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M12 6l4 4-4 4"></path></svg>
          </button>
        </div>
      </footer>
    </form>`;
}

const renderizadoresPorEstado = {
  SIN_SPRINT: renderizarSinSprint,
  BORRADOR: renderizarBorrador
};

export async function inicializarSprint(contenedor, projectId) {
  sesiones.get(contenedor)?.abort();
  const sesion = new AbortController();
  sesiones.set(contenedor, sesion);
  let sprint = await obtenerSprintActual(projectId) ?? await obtenerUltimoSprintFinalizado(projectId);
  let backlog = await obtenerProductBacklog(projectId);

  function obtenerSeleccionActual() {
    return [...contenedor.querySelectorAll("[data-seleccionar-item]:checked")].map((campo) => Number(campo.value));
  }

  function obtenerCambios() {
    const formulario = contenedor.querySelector("[data-formulario-sprint]");
    return {
      sprintGoal: formulario.elements.sprintGoal.value.trim() || null,
      fechaInicio: formulario.elements.fechaInicio.value || null,
      fechaFin: formulario.elements.fechaFin.value || null,
      selectedItemIds: obtenerSeleccionActual()
    };
  }

  async function renderizar() {
    const estado = sprint?.estado ?? "SIN_SPRINT";
    if (estado === "ACTIVO") {
      contenedor.innerHTML = `<section class="sprint" data-estado="ACTIVO"><div data-vista-sprint-activo></div></section>`;
      await inicializarSprintActivo(contenedor.querySelector("[data-vista-sprint-activo]"), projectId, sprint);
      return;
    }
    if (estado === "EN_CIERRE" || estado === "FINALIZADO") {
      const cierre = await obtenerResumenCierreSprint(projectId, sprint.sprintId);
      const contenido = estado === "EN_CIERRE"
        ? renderizarSprintEnCierre(sprint, cierre)
        : renderizarSprintFinalizado(sprint, cierre);
      contenedor.innerHTML = `<section class="sprint" data-estado="${estado}">${contenido}</section>`;
      return;
    }
    const renderizador = renderizadoresPorEstado[estado];
    if (!renderizador) {
      contenedor.innerHTML = "";
      return;
    }
    contenedor.innerHTML = `<section class="sprint" data-estado="${estado}">${renderizador(sprint, backlog)}</section>`;
  }

  async function sincronizarVista(mensaje = "") {
    sprint = await actualizarBorradorSprint(projectId, sprint.sprintId, obtenerCambios());
    await renderizar();
    if (mensaje) {
      const estado = contenedor.querySelector("[data-estado-sprint]");
      estado.textContent = mensaje;
    }
  }

  await renderizar();

  contenedor.addEventListener("click", async (evento) => {
    if (evento.target.closest("[data-planificar-sprint]")) {
      sprint = await crearBorradorSprint(projectId);
      await renderizar();
      contenedor.querySelector("#sprint-goal")?.focus();
      return;
    }

    const quitar = evento.target.closest("[data-quitar-item]");
    if (quitar) {
      const campo = contenedor.querySelector(`[data-seleccionar-item][value="${quitar.dataset.quitarItem}"]`);
      if (campo) campo.checked = false;
      await sincronizarVista();
      return;
    }

    if (evento.target.closest("[data-activar-sprint]")) {
      const boton = evento.target.closest("[data-activar-sprint]");
      boton.disabled = true;
      try {
        await actualizarBorradorSprint(projectId, sprint.sprintId, obtenerCambios());
        sprint = await activarSprint(projectId, sprint.sprintId);
        await renderizar();
        contenedor.querySelector("[data-estado-tablero]").textContent = "Sprint activado correctamente";
      } catch (error) {
        boton.disabled = false;
        contenedor.querySelector("[data-estado-sprint]").textContent = error.message;
      }
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("change", async (evento) => {
    if (!evento.target.matches("[data-seleccionar-item]")) return;
    await sincronizarVista();
  }, { signal: sesion.signal });

  contenedor.addEventListener("input", (evento) => {
    if (!evento.target.closest("[data-formulario-sprint]")) return;
    const guardado = contenedor.querySelector("[data-estado-guardado]");
    if (guardado) guardado.textContent = "Cambios sin guardar";
  }, { signal: sesion.signal });

  contenedor.addEventListener("submit", async (evento) => {
    if (!evento.target.matches("[data-formulario-sprint]")) return;
    evento.preventDefault();
    await sincronizarVista("Planificación del Sprint guardada");
  }, { signal: sesion.signal });
}
