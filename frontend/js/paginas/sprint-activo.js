import {
  actualizarElementoSprint,
  crearComentarioSprint,
  crearImpedimentoSprint,
  obtenerElementoSprint,
  obtenerEquipoProyecto,
  obtenerTableroSprint,
  resolverImpedimentoSprint
} from "../api/sprints.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";

const sesiones = new WeakMap();
const etiquetasEstado = { PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", TERMINADO: "Terminado" };
const etiquetasPrioridad = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };

function formatearFecha(fecha, opciones = {}) {
  if (!fecha) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", ...opciones }).format(new Date(`${fecha.slice(0, 10)}T12:00:00`));
}

function formatearFechaHora(fecha) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(fecha));
}

function obtenerIniciales(nombre) {
  return nombre.split(" ").slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function renderizarTarjeta(item, impedimentosAbiertos, dragHabilitado) {
  const tieneImpedimento = impedimentosAbiertos.some((impedimento) => impedimento.elementoSprintId === item.elementoSprintId);
  return `
    <button class="tarjeta-sprint" type="button" data-abrir-tarjeta="${item.elementoSprintId}" ${dragHabilitado ? "draggable=\"true\"" : ""} aria-label="Abrir ${escaparAtributo(item.titulo)}">
      <span class="tarjeta-sprint__superior">
        <span class="prioridad prioridad--${item.prioridad.toLowerCase()}">${etiquetasPrioridad[item.prioridad]}</span>
        <span class="tarjeta-sprint__puntos">${item.estimacion} pts</span>
      </span>
      <strong>${escaparHtml(item.titulo)}</strong>
      <span class="tarjeta-sprint__metadatos">
        ${item.responsable ? `<span class="tarjeta-sprint__responsable"><span aria-hidden="true">${obtenerIniciales(item.responsable.nombre)}</span>${escaparHtml(item.responsable.nombre)}</span>` : `<span class="tarjeta-sprint__sin-asignar">Sin responsable</span>`}
        ${item.fechaLimite ? `<span class="tarjeta-sprint__fecha"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 3.5v2M14 3.5v2M3 7h12M3.5 4.5h11v11h-11z"></path></svg>${formatearFecha(item.fechaLimite)}</span>` : ""}
      </span>
      ${(tieneImpedimento || item.dodConfirmado) ? `<span class="tarjeta-sprint__indicadores">
        ${tieneImpedimento ? `<span class="tarjeta-sprint__impedimento"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 5v4M9 12.5h.01M9 2.5 16 15H2z"></path></svg>Impedimento</span>` : ""}
        ${item.dodConfirmado ? `<span class="tarjeta-sprint__dod"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="m3.5 9 3.2 3.2 7.8-7.8"></path></svg>DoD confirmada</span>` : ""}
      </span>` : ""}
    </button>`;
}

function renderizarTablero(tablero) {
  const dragHabilitado = window.matchMedia("(min-width: 701px) and (any-pointer: fine)").matches;
  return `
    <div data-contenedor-tablero>
      <p class="tablero-sprint__instruccion" id="instruccion-arrastre" ${dragHabilitado ? "" : "hidden"}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="4" r="1"></circle><circle cx="11" cy="4" r="1"></circle><circle cx="5" cy="8" r="1"></circle><circle cx="11" cy="8" r="1"></circle><circle cx="5" cy="12" r="1"></circle><circle cx="11" cy="12" r="1"></circle></svg>
        Arrastra una tarjeta para cambiar su estado o ábrela para editar sus detalles.
      </p>
      <div class="tablero-sprint" data-tablero-sprint ${dragHabilitado ? "aria-describedby=\"instruccion-arrastre\"" : ""}>
        ${tablero.columns.map((columna) => `
          <section class="columna-sprint columna-sprint--${columna.estado.toLowerCase().replace("_", "-")}" data-estado-columna="${columna.estado}" aria-labelledby="titulo-columna-${columna.estado.toLowerCase()}">
            <header class="columna-sprint__cabecera">
              <div><span aria-hidden="true"></span><h2 id="titulo-columna-${columna.estado.toLowerCase()}">${etiquetasEstado[columna.estado]}</h2></div>
              <span>${columna.items.length}</span>
            </header>
            <div class="columna-sprint__tarjetas">
              ${columna.items.length
                ? columna.items.map((item) => renderizarTarjeta(item, tablero.impedimentosAbiertos, dragHabilitado)).join("")
                : `<div class="columna-sprint__vacia"><p>No hay trabajo en ${etiquetasEstado[columna.estado].toLowerCase()}.</p></div>`}
            </div>
          </section>`).join("")}
      </div>
    </div>`;
}

function renderizarChecklist(checklist) {
  if (!checklist.length) return `<p class="detalle-sprint__vacio" data-checklist-vacio>No hay pasos en el checklist.</p>`;
  return checklist.map((item) => `
    <label class="checklist-sprint__item" data-checklist-id="${item.checklistItemId}">
      <input type="checkbox" ${item.completado ? "checked" : ""}>
      <span class="checklist-sprint__control"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 2.8 2.8 6.2-6.2"></path></svg></span>
      <span>${escaparHtml(item.descripcion)}</span>
    </label>`).join("");
}

function renderizarComentarios(comentarios) {
  if (!comentarios.length) return `<p class="detalle-sprint__vacio">Todavía no hay comentarios.</p>`;
  return `<ul class="actividad-sprint">${comentarios.map((comentario) => `
    <li>
      <span class="actividad-sprint__avatar" aria-hidden="true">${obtenerIniciales(comentario.autor.nombre)}</span>
      <div><p><strong>${escaparHtml(comentario.autor.nombre)}</strong><time datetime="${comentario.fechaPublicacion}">${formatearFechaHora(comentario.fechaPublicacion)}</time></p><span>${escaparHtml(comentario.contenido)}</span></div>
    </li>`).join("")}</ul>`;
}

function renderizarImpedimentos(impedimentos) {
  if (!impedimentos.length) return `<p class="detalle-sprint__vacio">No hay impedimentos registrados.</p>`;
  return `<ul class="impedimentos-sprint">${impedimentos.map((impedimento) => `
    <li class="${impedimento.estado === "RESUELTO" ? "impedimentos-sprint__resuelto" : ""}">
      <div><span>${impedimento.estado === "ABIERTO" ? "Abierto" : "Resuelto"}</span><p>${escaparHtml(impedimento.descripcion)}</p><small>${escaparHtml(impedimento.reportadoPor?.nombre ?? "Equipo")} · ${formatearFechaHora(impedimento.fechaCreacion)}</small></div>
      ${impedimento.estado === "ABIERTO" ? `<button type="button" data-resolver-impedimento="${impedimento.impedimentoId}">Marcar resuelto</button>` : ""}
    </li>`).join("")}</ul>`;
}

function renderizarDetalle(item, equipo, sprint) {
  const checklistCompletado = item.checklist.filter((entrada) => entrada.completado).length;
  return `
    <div class="panel-sprint__fondo" data-cerrar-detalle></div>
    <aside class="panel-sprint" role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-sprint">
      <header class="panel-sprint__cabecera">
        <div><span class="prioridad prioridad--${item.prioridad.toLowerCase()}">${etiquetasPrioridad[item.prioridad]}</span><h2 id="titulo-detalle-sprint">${escaparHtml(item.titulo)}</h2><p>${item.estimacion} puntos · Elemento del Sprint</p></div>
        <button class="boton-icono" type="button" data-cerrar-detalle aria-label="Cerrar detalle"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"></path></svg></button>
      </header>
      <div class="panel-sprint__contenido">
        <p class="panel-sprint__descripcion">${escaparHtml(item.descripcion) || "Sin descripción."}</p>
        <form data-formulario-detalle novalidate>
          <section class="detalle-sprint__seccion" aria-labelledby="titulo-datos-tarjeta">
            <div class="detalle-sprint__titulo"><h3 id="titulo-datos-tarjeta">Datos de la tarjeta</h3></div>
            <div class="detalle-sprint__campos">
              <label>Estado<select name="estado">
                ${Object.entries(etiquetasEstado).map(([valor, etiqueta]) => `<option value="${valor}" ${item.estado === valor ? "selected" : ""}>${etiqueta}</option>`).join("")}
              </select></label>
              <label>Responsable<select name="responsableMiembroId"><option value="">Sin responsable</option>
                ${equipo.members.filter((miembro) => miembro.activo).map((miembro) => `<option value="${miembro.miembroProyectoId}" ${item.responsable?.miembroProyectoId === miembro.miembroProyectoId ? "selected" : ""}>${escaparHtml(miembro.usuario.nombre)}</option>`).join("")}
              </select></label>
              <label>Fecha de inicio<input name="fechaInicio" type="date" min="${sprint.fechaInicio}" max="${sprint.fechaFin}" value="${item.fechaInicio ?? ""}"></label>
              <label>Fecha límite<input name="fechaLimite" type="date" min="${sprint.fechaInicio}" max="${sprint.fechaFin}" value="${item.fechaLimite ?? ""}"></label>
            </div>
          </section>

          <section class="detalle-sprint__seccion" aria-labelledby="titulo-checklist">
            <div class="detalle-sprint__titulo"><h3 id="titulo-checklist">Checklist</h3><span>${checklistCompletado}/${item.checklist.length}</span></div>
            <div class="checklist-sprint" data-lista-checklist>${renderizarChecklist(item.checklist)}</div>
            <div class="checklist-sprint__nuevo"><input type="text" data-nuevo-checklist placeholder="Agregar un paso" aria-label="Nuevo paso del checklist"><button type="button" data-agregar-checklist>Agregar</button></div>
          </section>

          <section class="detalle-sprint__seccion detalle-sprint__dod" data-seccion-dod ${item.estado === "TERMINADO" ? "" : "hidden"} aria-labelledby="titulo-dod">
            <div class="detalle-sprint__titulo"><h3 id="titulo-dod">Definition of Done</h3>${item.dodConfirmado ? `<span class="detalle-sprint__confirmada">Confirmada</span>` : ""}</div>
            <p>${escaparHtml(item.definitionOfDone) || "No hay una Definition of Done configurada."}</p>
            ${item.dodConfirmado
              ? `<div class="detalle-sprint__registro"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9"></path></svg><span>Confirmada por <strong>${escaparHtml(item.dodConfirmadoPor?.nombre)}</strong> el ${formatearFechaHora(item.dodConfirmadoEn)}.</span></div>`
              : `<label class="detalle-sprint__confirmar"><input type="checkbox" name="confirmarDod"><span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 2.8 2.8 6.2-6.2"></path></svg></span>Confirmo que se cumplen todos los criterios</label>`}
          </section>

          <div class="panel-sprint__guardar"><p data-estado-detalle role="status" aria-live="polite"></p><button class="boton boton--principal" type="submit">Guardar cambios</button></div>
        </form>

        <section class="detalle-sprint__seccion" aria-labelledby="titulo-comentarios">
          <div class="detalle-sprint__titulo"><h3 id="titulo-comentarios">Comentarios</h3><span>${item.comments.length}</span></div>
          ${renderizarComentarios(item.comments)}
          <form class="detalle-sprint__composer" data-formulario-comentario><textarea name="contenido" rows="2" placeholder="Escribe una actualización para el equipo" aria-label="Nuevo comentario" required></textarea><button type="submit">Publicar</button></form>
        </section>

        <section class="detalle-sprint__seccion" aria-labelledby="titulo-impedimentos">
          <div class="detalle-sprint__titulo"><h3 id="titulo-impedimentos">Impedimentos</h3><span>${item.impediments.filter((impedimento) => impedimento.estado === "ABIERTO").length} abiertos</span></div>
          ${renderizarImpedimentos(item.impediments)}
          <form class="detalle-sprint__composer" data-formulario-impedimento><textarea name="descripcion" rows="2" placeholder="Describe qué está bloqueando el trabajo" aria-label="Nuevo impedimento" required></textarea><button type="submit">Registrar</button></form>
        </section>
      </div>
    </aside>`;
}

export async function inicializarSprintActivo(contenedor, projectId, sprint) {
  sesiones.get(contenedor)?.abort();
  const sesion = new AbortController();
  sesiones.set(contenedor, sesion);
  let tablero = await obtenerTableroSprint(projectId, sprint.sprintId);
  const equipo = await obtenerEquipoProyecto(projectId);
  let itemActivo = null;
  let ultimoFoco = null;
  let itemArrastrado = null;
  let imagenArrastre = null;
  let seArrastro = false;
  let temporizadorEstado = null;

  function obtenerItemTablero(itemId) {
    return tablero.columns.flatMap((columna) => columna.items).find((item) => item.elementoSprintId === Number(itemId));
  }

  function anunciar(mensaje, tipo = "exito") {
    const estado = contenedor.querySelector("[data-estado-tablero]");
    if (!estado) return;
    window.clearTimeout(temporizadorEstado);
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
    temporizadorEstado = window.setTimeout(() => {
      if (estado.textContent === mensaje) {
        estado.textContent = "";
        delete estado.dataset.tipo;
      }
    }, 5000);
  }

  function limpiarArrastre() {
    contenedor.querySelectorAll(".columna-sprint--destino, .columna-sprint--bloqueada").forEach((columna) => {
      columna.classList.remove("columna-sprint--destino", "columna-sprint--bloqueada");
    });
    contenedor.querySelector(".tarjeta-sprint--arrastrando")?.classList.remove("tarjeta-sprint--arrastrando");
    imagenArrastre?.remove();
    imagenArrastre = null;
    itemArrastrado = null;
    document.body.classList.remove("arrastrando-sprint");
  }

  function renderizar() {
    contenedor.innerHTML = `
      <div class="sprint-activo">
        <header class="encabezado-sprint encabezado-sprint--activo">
          <div>
            <div class="encabezado-sprint__titulo"><h1>Sprint activo</h1><span>En curso</span></div>
            <p>${escaparHtml(tablero.sprintGoal)}</p>
            <div class="encabezado-sprint__fechas"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 3.5v2M14 3.5v2M3 7h12M3.5 4.5h11v11h-11z"></path></svg>${formatearFecha(sprint.fechaInicio)} – ${formatearFecha(sprint.fechaFin)}</div>
          </div>
          <div class="progreso-sprint" aria-label="Progreso del Sprint: ${Math.round(tablero.progressPercentage)} por ciento">
            <div><span>Progreso</span><strong data-progreso-porcentaje>${Math.round(tablero.progressPercentage)}%</strong></div>
            <span class="progreso-sprint__barra"><span data-progreso-barra style="transform: scaleX(${tablero.progressPercentage / 100})"></span></span>
            <small data-progreso-detalle>${tablero.counts.terminado} de ${tablero.columns.reduce((total, columna) => total + columna.items.length, 0)} elementos terminados</small>
          </div>
        </header>
        ${renderizarTablero(tablero)}
        <p class="sprint-activo__estado" data-estado-tablero role="status" aria-live="polite"></p>
        <div data-panel-sprint></div>
      </div>`;
  }

  async function actualizarTablero(mensaje = "") {
    tablero = await obtenerTableroSprint(projectId, sprint.sprintId);
    const tableroAnterior = contenedor.querySelector("[data-contenedor-tablero]");
    if (tableroAnterior) tableroAnterior.outerHTML = renderizarTablero(tablero);
    contenedor.querySelector("[data-progreso-porcentaje]").textContent = `${Math.round(tablero.progressPercentage)}%`;
    contenedor.querySelector("[data-progreso-barra]").style.transform = `scaleX(${tablero.progressPercentage / 100})`;
    contenedor.querySelector("[data-progreso-detalle]").textContent = `${tablero.counts.terminado} de ${tablero.columns.reduce((total, columna) => total + columna.items.length, 0)} elementos terminados`;
    if (mensaje) anunciar(mensaje);
  }

  async function abrirDetalle(itemId, enfocar = true) {
    itemActivo = await obtenerElementoSprint(projectId, sprint.sprintId, itemId);
    if (enfocar) ultimoFoco = document.activeElement;
    contenedor.querySelector("[data-panel-sprint]").innerHTML = renderizarDetalle(itemActivo, equipo, sprint);
    document.body.classList.add("panel-sprint-abierto");
    if (enfocar) contenedor.querySelector("[name='estado']")?.focus();
  }

  function cerrarDetalle() {
    contenedor.querySelector("[data-panel-sprint]").innerHTML = "";
    document.body.classList.remove("panel-sprint-abierto");
    ultimoFoco?.focus();
  }

  function manejarTeclado(evento) {
    const panel = contenedor.querySelector(".panel-sprint");
    if (!panel) return;
    if (evento.key === "Escape") {
      cerrarDetalle();
      return;
    }
    if (evento.key !== "Tab") return;
    const controles = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])")].filter((control) => !control.closest("[hidden]"));
    const primero = controles[0];
    const ultimo = controles.at(-1);
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  renderizar();
  document.addEventListener("keydown", manejarTeclado, { signal: sesion.signal });

  contenedor.addEventListener("click", async (evento) => {
    const tarjeta = evento.target.closest("[data-abrir-tarjeta]");
    if (tarjeta) {
      if (seArrastro) {
        evento.preventDefault();
        return;
      }
      await abrirDetalle(tarjeta.dataset.abrirTarjeta);
      return;
    }
    if (evento.target.closest("[data-cerrar-detalle]")) {
      cerrarDetalle();
      return;
    }
    if (evento.target.closest("[data-agregar-checklist]")) {
      const entrada = contenedor.querySelector("[data-nuevo-checklist]");
      const descripcion = entrada.value.trim();
      if (!descripcion) {
        entrada.focus();
        return;
      }
      contenedor.querySelector("[data-checklist-vacio]")?.remove();
      contenedor.querySelector("[data-lista-checklist]").insertAdjacentHTML("beforeend", `
        <label class="checklist-sprint__item" data-checklist-id="">
          <input type="checkbox"><span class="checklist-sprint__control"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 2.8 2.8 6.2-6.2"></path></svg></span><span>${escaparHtml(descripcion)}</span>
        </label>`);
      entrada.value = "";
      entrada.focus();
      return;
    }
    const resolver = evento.target.closest("[data-resolver-impedimento]");
    if (resolver) {
      await resolverImpedimentoSprint(projectId, sprint.sprintId, resolver.dataset.resolverImpedimento);
      await actualizarTablero("Impedimento resuelto correctamente");
      await abrirDetalle(itemActivo.elementoSprintId, false);
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("dragstart", (evento) => {
    const tarjeta = evento.target.closest("[data-abrir-tarjeta][draggable='true']");
    if (!tarjeta) return;
    itemArrastrado = obtenerItemTablero(tarjeta.dataset.abrirTarjeta);
    if (!itemArrastrado) {
      evento.preventDefault();
      return;
    }
    seArrastro = true;
    tarjeta.classList.add("tarjeta-sprint--arrastrando");
    document.body.classList.add("arrastrando-sprint");
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", String(itemArrastrado.elementoSprintId));

    const medidas = tarjeta.getBoundingClientRect();
    imagenArrastre = tarjeta.cloneNode(true);
    imagenArrastre.classList.add("tarjeta-sprint--fantasma");
    imagenArrastre.style.width = `${medidas.width}px`;
    document.body.append(imagenArrastre);
    evento.dataTransfer.setDragImage(imagenArrastre, medidas.width / 2, 30);
  }, { signal: sesion.signal });

  contenedor.addEventListener("dragover", (evento) => {
    const columna = evento.target.closest("[data-estado-columna]");
    if (!columna || !itemArrastrado) return;
    evento.preventDefault();
    const mismoEstado = columna.dataset.estadoColumna === itemArrastrado.estado;
    const requiereDod = columna.dataset.estadoColumna === "TERMINADO" && !itemArrastrado.dodConfirmado;
    contenedor.querySelectorAll(".columna-sprint--destino, .columna-sprint--bloqueada").forEach((actual) => {
      if (actual !== columna) actual.classList.remove("columna-sprint--destino", "columna-sprint--bloqueada");
    });
    columna.classList.toggle("columna-sprint--destino", !mismoEstado && !requiereDod);
    columna.classList.toggle("columna-sprint--bloqueada", requiereDod);
    evento.dataTransfer.dropEffect = mismoEstado || requiereDod ? "none" : "move";
  }, { signal: sesion.signal });

  contenedor.addEventListener("dragleave", (evento) => {
    const columna = evento.target.closest("[data-estado-columna]");
    if (!columna || columna.contains(evento.relatedTarget)) return;
    columna.classList.remove("columna-sprint--destino", "columna-sprint--bloqueada");
  }, { signal: sesion.signal });

  contenedor.addEventListener("drop", async (evento) => {
    const columna = evento.target.closest("[data-estado-columna]");
    if (!columna || !itemArrastrado) return;
    evento.preventDefault();
    const item = itemArrastrado;
    const estadoDestino = columna.dataset.estadoColumna;
    limpiarArrastre();

    if (estadoDestino === item.estado) return;
    if (estadoDestino === "TERMINADO" && !item.dodConfirmado) {
      anunciar("Confirma la Definition of Done desde el detalle antes de mover el elemento a Terminado.", "error");
      await abrirDetalle(item.elementoSprintId);
      const selectorEstado = contenedor.querySelector("[name='estado']");
      selectorEstado.value = "TERMINADO";
      selectorEstado.dispatchEvent(new Event("change", { bubbles: true }));
      const estadoDetalle = contenedor.querySelector("[data-estado-detalle]");
      estadoDetalle.textContent = "Confirma la Definition of Done para completar el movimiento.";
      contenedor.querySelector("[name='confirmarDod']")?.focus();
      return;
    }

    try {
      await actualizarElementoSprint(projectId, sprint.sprintId, item.elementoSprintId, {
        estado: estadoDestino,
        confirmarDod: item.dodConfirmado
      });
      await actualizarTablero(`${item.titulo} se movió a ${etiquetasEstado[estadoDestino]}`);
    } catch (error) {
      anunciar(error.message, "error");
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("dragend", () => {
    limpiarArrastre();
    window.setTimeout(() => { seArrastro = false; }, 0);
  }, { signal: sesion.signal });

  contenedor.addEventListener("change", (evento) => {
    if (!evento.target.matches("[name='estado']")) return;
    const seccionDod = contenedor.querySelector("[data-seccion-dod]");
    seccionDod.hidden = evento.target.value !== "TERMINADO";
  }, { signal: sesion.signal });

  contenedor.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (evento.target.matches("[data-formulario-detalle]")) {
      const formulario = evento.target;
      const checklist = [...formulario.querySelectorAll("[data-checklist-id]")].map((fila, indice) => ({
        checklistItemId: fila.dataset.checklistId ? Number(fila.dataset.checklistId) : null,
        descripcion: fila.querySelector(":scope > span:last-child").textContent,
        posicion: indice + 1,
        completado: fila.querySelector("input").checked
      }));
      try {
        itemActivo = await actualizarElementoSprint(projectId, sprint.sprintId, itemActivo.elementoSprintId, {
          estado: formulario.elements.estado.value,
          responsableMiembroId: formulario.elements.responsableMiembroId.value ? Number(formulario.elements.responsableMiembroId.value) : null,
          fechaInicio: formulario.elements.fechaInicio.value || null,
          fechaLimite: formulario.elements.fechaLimite.value || null,
          confirmarDod: itemActivo.dodConfirmado || Boolean(formulario.elements.confirmarDod?.checked),
          checklist
        });
        await actualizarTablero("Trabajo del Sprint actualizado");
        await abrirDetalle(itemActivo.elementoSprintId, false);
      } catch (error) {
        contenedor.querySelector("[data-estado-detalle]").textContent = error.message;
      }
      return;
    }
    if (evento.target.matches("[data-formulario-comentario]")) {
      const contenido = evento.target.elements.contenido.value.trim();
      if (!contenido) return;
      await crearComentarioSprint(projectId, sprint.sprintId, itemActivo.elementoSprintId, { contenido });
      await abrirDetalle(itemActivo.elementoSprintId, false);
      return;
    }
    if (evento.target.matches("[data-formulario-impedimento]")) {
      const descripcion = evento.target.elements.descripcion.value.trim();
      if (!descripcion) return;
      await crearImpedimentoSprint(projectId, sprint.sprintId, { elementoSprintId: itemActivo.elementoSprintId, descripcion });
      await actualizarTablero("Impedimento registrado correctamente");
      await abrirDetalle(itemActivo.elementoSprintId, false);
    }
  }, { signal: sesion.signal });
}
