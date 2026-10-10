import {
  actualizarElementoBacklog,
  actualizarProductGoal,
  crearElementoBacklog,
  dividirElementoBacklog,
  obtenerProductBacklog,
  reordenarProductBacklog,
  retirarElementoBacklog
} from "../api/backlog-producto.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";

const etiquetasPrioridad = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
const sesiones = new WeakMap();

function renderizarLista(items, puedeAdministrar) {
  if (!items.length) {
    return `
      <section class="backlog-vacio" aria-labelledby="titulo-backlog-vacio">
        <span class="backlog-vacio__simbolo" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M6 4.5h12v15H6zM9 9h6M9 13h4M4 8h2M4 16h2"></path></svg>
        </span>
        <h2 id="titulo-backlog-vacio">Tu Product Backlog todavía está vacío</h2>
        <p>Agrega el primer elemento para comenzar a preparar el trabajo del producto.</p>
        <button class="boton boton--principal" type="button" data-crear-elemento>Crear primer elemento</button>
      </section>`;
  }

  return `
    <div class="backlog-lista__cabecera" aria-hidden="true">
      <span>Orden</span><span>Elemento</span><span>Prioridad</span><span>Estimación</span><span></span>
    </div>
    <ol class="backlog-lista" aria-label="Elementos del Product Backlog">
      ${items.map((item, indice) => `
        <li class="backlog-item" data-item-id="${item.elementoBacklogId}">
          <div class="backlog-item__orden">
            <span>${item.posicion}</span>
            <div class="backlog-item__mover">
              <button type="button" data-mover="arriba" aria-label="Mover ${escaparAtributo(item.titulo)} hacia arriba" ${indice === 0 ? "disabled" : ""}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 9.5 3.5-3 3.5 3"></path></svg>
              </button>
              <button type="button" data-mover="abajo" aria-label="Mover ${escaparAtributo(item.titulo)} hacia abajo" ${indice === items.length - 1 ? "disabled" : ""}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 6.5 3.5 3 3.5-3"></path></svg>
              </button>
            </div>
          </div>
          <button class="backlog-item__detalle" type="button" data-abrir-item>
            <span class="backlog-item__titulo">${escaparHtml(item.titulo)}</span>
            <span class="backlog-item__estado ${item.preparado ? "backlog-item__estado--listo" : ""}">
              ${item.preparado ? "Preparado" : "Por refinar"}
            </span>
          </button>
          <span class="prioridad prioridad--${item.prioridad.toLowerCase()}">${etiquetasPrioridad[item.prioridad]}</span>
          <span class="backlog-item__estimacion">${item.estimacion ?? "—"}</span>
          <button class="backlog-item__flecha" type="button" data-abrir-item aria-label="Abrir ${escaparAtributo(item.titulo)}">
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m7 4 5 5-5 5"></path></svg>
          </button>
        </li>`).join("")}
    </ol>`;
}

function renderizarPanel(item, puedeAdministrar) {
  const esNuevo = !item;
  return `
    <div class="panel-backlog__fondo" data-cerrar-panel></div>
    <aside class="panel-backlog" aria-labelledby="titulo-panel-backlog" aria-modal="true" role="dialog">
      <header class="panel-backlog__cabecera">
        <div>
          <p>${esNuevo ? "Nuevo elemento" : `Elemento ${item.posicion}`}</p>
          <h2 id="titulo-panel-backlog">${esNuevo ? "Agregar al Product Backlog" : escaparHtml(item.titulo)}</h2>
        </div>
        <button class="boton-icono" type="button" data-cerrar-panel aria-label="Cerrar panel">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"></path></svg>
        </button>
      </header>
      <form class="panel-backlog__formulario" data-formulario-item novalidate>
        <div class="campo-backlog">
          <label for="titulo-item">Título</label>
          <input id="titulo-item" name="titulo" value="${escaparAtributo(item?.titulo)}" maxlength="160" required>
          <span class="campo-backlog__error" data-error-titulo></span>
        </div>
        <div class="campo-backlog">
          <label for="descripcion-item">Descripción <span>Opcional al crear</span></label>
          <textarea id="descripcion-item" name="descripcion" rows="4" placeholder="Explica el resultado que necesita el producto">${escaparHtml(item?.descripcion)}</textarea>
        </div>
        <div class="panel-backlog__fila">
          <div class="campo-backlog">
            <label for="prioridad-item">Prioridad</label>
            <select id="prioridad-item" name="prioridad">
              ${Object.entries(etiquetasPrioridad).map(([valor, etiqueta]) => `<option value="${valor}" ${item?.prioridad === valor || (!item && valor === "MEDIA") ? "selected" : ""}>${etiqueta}</option>`).join("")}
            </select>
          </div>
          <div class="campo-backlog">
            <label for="estimacion-item">Estimación <span>Opcional</span></label>
            <input id="estimacion-item" name="estimacion" type="number" min="1" step="1" inputmode="numeric" value="${item?.estimacion ?? ""}" ${esNuevo ? "disabled" : ""}>
            <span class="campo-backlog__error" data-error-estimacion></span>
          </div>
        </div>
        ${esNuevo ? `<p class="panel-backlog__ayuda">Podrás estimar y agregar criterios al guardar el elemento.</p>` : `
          <div class="campo-backlog campo-backlog--criterios">
            <label for="criterios-item">Criterios de aceptación <span>Uno por línea</span></label>
            <textarea id="criterios-item" name="criteriosAceptacion" rows="5" placeholder="Describe las condiciones que debe cumplir">${escaparHtml(item.criteriosAceptacion)}</textarea>
          </div>
          <section class="division-item" data-division hidden aria-labelledby="titulo-division">
            <div class="division-item__cabecera">
              <div><h3 id="titulo-division">Dividir en elementos independientes</h3><p>El elemento original será retirado y los nuevos conservarán su prioridad.</p></div>
              <button type="button" data-cancelar-division>Cancelar</button>
            </div>
            <div class="division-item__partes" data-partes-division>
              <label>Primer elemento<input name="parte" placeholder="Título del primer elemento"></label>
              <label>Segundo elemento<input name="parte" placeholder="Título del segundo elemento"></label>
            </div>
            <button class="division-item__agregar" type="button" data-agregar-parte>Agregar otro elemento</button>
            <span class="campo-backlog__error" data-error-division></span>
            <button class="boton boton--principal" type="button" data-confirmar-division>Confirmar división</button>
          </section>`}
        <p class="panel-backlog__estado" data-estado-panel aria-live="polite"></p>
        <footer class="panel-backlog__acciones">
          ${esNuevo ? "" : `<button class="boton boton--secundario" type="button" data-mostrar-division>Dividir</button>${puedeAdministrar ? `<button class="boton boton--peligro" type="button" data-retirar-elemento>Retirar</button>` : ""}`}
          <button class="boton boton--principal" type="submit">${esNuevo ? "Crear elemento" : "Guardar cambios"}</button>
        </footer>
      </form>
    </aside>`;
}

export async function inicializarBacklog(contenedor, projectId, permisos = {}) {
  const puedeAdministrar = Boolean(permisos.puedeAdministrar);
  const esProductOwner = Boolean(permisos.esProductOwner);
  sesiones.get(contenedor)?.abort();
  const sesion = new AbortController();
  sesiones.set(contenedor, sesion);
  let backlog = await obtenerProductBacklog(projectId);
  let elementoActivo = null;
  let ultimoFoco = null;

  function anunciar(mensaje) {
    const estado = contenedor.querySelector("[data-estado-backlog]");
    if (!estado) return;
    estado.textContent = mensaje;
    window.setTimeout(() => { if (estado.textContent === mensaje) estado.textContent = ""; }, 3500);
  }

  function actualizarLista() {
    contenedor.querySelector("[data-lista-backlog]").innerHTML = renderizarLista(backlog.items.filter((item) => !item.retirado), puedeAdministrar);
    const activos = backlog.items.filter((item) => !item.retirado);
    contenedor.querySelector("[data-conteo-backlog]").textContent = `${activos.length} ${activos.length === 1 ? "elemento" : "elementos"}`;
  }

  function cerrarPanel() {
    contenedor.querySelector("[data-panel-contenedor]").innerHTML = "";
    document.body.classList.remove("panel-backlog-abierto");
    ultimoFoco?.focus();
  }

  function abrirPanel(item = null) {
    elementoActivo = item;
    ultimoFoco = document.activeElement;
    contenedor.querySelector("[data-panel-contenedor]").innerHTML = renderizarPanel(item, puedeAdministrar);
    document.body.classList.add("panel-backlog-abierto");
    contenedor.querySelector("#titulo-item")?.focus();
  }

  function manejarTeclado(evento) {
    const panel = contenedor.querySelector(".panel-backlog");
    if (!panel) return;
    if (evento.key === "Escape") {
      cerrarPanel();
      return;
    }
    if (evento.key !== "Tab") return;
    const controles = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])")]
      .filter((control) => !control.closest("[hidden]"));
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

  contenedor.innerHTML = `
    <section class="backlog" aria-labelledby="titulo-backlog">
      <header class="encabezado-backlog">
        <div><h1 id="titulo-backlog">Product Backlog</h1><p>Ordena el trabajo y refina cada elemento sin perder el contexto del producto.</p></div>
        <button class="boton boton--principal" type="button" data-crear-elemento>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"></path></svg>
          Nuevo elemento
        </button>
      </header>
       <section class="product-goal" aria-labelledby="titulo-product-goal">
        <div class="product-goal__simbolo" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.5"></circle><path d="m15.5 8.5 4-4M16.5 4.5h3v3"></path></svg></div>
        <div class="product-goal__contenido">
           <div class="product-goal__cabecera"><h2 id="titulo-product-goal">Product Goal</h2>${esProductOwner ? `<button type="button" data-editar-goal>Editar</button>` : ""}</div>
          <p data-texto-goal>${escaparHtml(backlog.productGoal) || "Define el objetivo que orientará las decisiones del Product Backlog."}</p>
          <form class="product-goal__formulario" data-formulario-goal hidden>
            <textarea name="productGoal" rows="2" aria-label="Product Goal">${escaparHtml(backlog.productGoal)}</textarea>
            <div><button type="button" data-cancelar-goal>Cancelar</button><button type="submit">Guardar objetivo</button></div>
          </form>
        </div>
      </section>
       <p class="backlog__permisos">${esProductOwner ? "Como Product Owner puedes actualizar el Product Goal y el orden final del backlog." : "Puedes crear, editar y consultar elementos. El Product Owner mantiene el Product Goal y el orden final."}</p>
       <section class="backlog-contenido" aria-labelledby="titulo-lista-backlog">
        <div class="backlog-contenido__cabecera"><div><h2 id="titulo-lista-backlog">Elementos del producto</h2><p>Los primeros elementos representan la prioridad más alta.</p></div><span data-conteo-backlog></span></div>
        <div data-lista-backlog></div>
      </section>
      <p class="backlog__estado" data-estado-backlog role="status" aria-live="polite"></p>
      <div data-panel-contenedor></div>
    </section>`;
  actualizarLista();

  document.addEventListener("keydown", manejarTeclado, { signal: sesion.signal });

  contenedor.addEventListener("click", async (evento) => {
    const crear = evento.target.closest("[data-crear-elemento]");
    const abrir = evento.target.closest("[data-abrir-item]");
    const mover = evento.target.closest("[data-mover]");
    if (crear) abrirPanel();
    if (abrir) {
      const id = Number(abrir.closest("[data-item-id]").dataset.itemId);
      abrirPanel(backlog.items.find((item) => item.elementoBacklogId === id));
    }
    if (evento.target.closest("[data-cerrar-panel]")) cerrarPanel();

    if (mover) {
      const id = Number(mover.closest("[data-item-id]").dataset.itemId);
      const indice = backlog.items.findIndex((item) => item.elementoBacklogId === id);
      const destino = mover.dataset.mover === "arriba" ? indice - 1 : indice + 1;
      [backlog.items[indice], backlog.items[destino]] = [backlog.items[destino], backlog.items[indice]];
      backlog.items.forEach((item, posicion) => { item.posicion = posicion + 1; });
      await reordenarProductBacklog(projectId, backlog.items.map(({ elementoBacklogId, posicion }) => ({ elementoBacklogId, posicion })));
      actualizarLista();
      anunciar("Product Backlog actualizado");
      contenedor.querySelector(`[data-item-id="${id}"] [data-mover="${mover.dataset.mover}"]`)?.focus();
    }

    if (evento.target.closest("[data-editar-goal]")) {
      contenedor.querySelector("[data-texto-goal]").hidden = true;
      contenedor.querySelector("[data-formulario-goal]").hidden = false;
      contenedor.querySelector("[name='productGoal']").focus();
    }
    if (evento.target.closest("[data-cancelar-goal]")) {
      contenedor.querySelector("[data-texto-goal]").hidden = false;
      contenedor.querySelector("[data-formulario-goal]").hidden = true;
    }

    if (evento.target.closest("[data-mostrar-division]")) {
      contenedor.querySelector("[data-division]").hidden = false;
      contenedor.querySelector(".panel-backlog__acciones").hidden = true;
      contenedor.querySelector("[name='parte']").focus();
    }
    if (evento.target.closest("[data-retirar-elemento]")) {
      if (!puedeAdministrar) return;
      if (!window.confirm("¿Retirar este elemento del Product Backlog?")) return;
      try {
        const resultado = await retirarElementoBacklog(projectId, elementoActivo.elementoBacklogId);
        backlog = await obtenerProductBacklog(projectId);
        cerrarPanel();
        actualizarLista();
        anunciar(resultado.resultado === "RETIRADO" ? "Elemento retirado del Product Backlog" : "Elemento eliminado del Product Backlog");
      } catch (error) {
        contenedor.querySelector("[data-estado-panel]").textContent = error.message;
      }
    }
    if (evento.target.closest("[data-cancelar-division]")) {
      contenedor.querySelector("[data-division]").hidden = true;
      contenedor.querySelector(".panel-backlog__acciones").hidden = false;
    }
    if (evento.target.closest("[data-agregar-parte]")) {
      const partes = contenedor.querySelector("[data-partes-division]");
      const numero = partes.children.length + 1;
      partes.insertAdjacentHTML("beforeend", `<label>Elemento ${numero}<input name="parte" placeholder="Título del elemento ${numero}"></label>`);
      partes.lastElementChild.querySelector("input").focus();
    }
    if (evento.target.closest("[data-confirmar-division]")) {
      const entradas = [...contenedor.querySelectorAll("[name='parte']")];
      const titulos = entradas.map((entrada) => entrada.value.trim()).filter(Boolean);
      const error = contenedor.querySelector("[data-error-division]");
      if (titulos.length < 2) {
        error.textContent = "Agrega al menos dos elementos para realizar la división";
        entradas.find((entrada) => !entrada.value.trim())?.focus();
        return;
      }
      try {
        await dividirElementoBacklog(projectId, elementoActivo.elementoBacklogId, titulos.map((titulo) => ({ titulo, prioridad: elementoActivo.prioridad })));
        backlog = await obtenerProductBacklog(projectId);
        cerrarPanel();
        actualizarLista();
        anunciar("Elemento dividido correctamente");
      } catch (errorPeticion) {
        contenedor.querySelector("[data-estado-panel]").textContent = errorPeticion.message;
      }
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (evento.target.matches("[data-formulario-goal]")) {
      const campo = evento.target.elements.productGoal;
      const respuesta = await actualizarProductGoal(projectId, campo.value);
      backlog.productGoal = respuesta.productGoal;
      contenedor.querySelector("[data-texto-goal]").textContent = backlog.productGoal || "Define el objetivo que orientará las decisiones del Product Backlog.";
      contenedor.querySelector("[data-texto-goal]").hidden = false;
      evento.target.hidden = true;
      anunciar("Product Goal actualizado");
      return;
    }
    if (!evento.target.matches("[data-formulario-item]")) return;

    const datos = new FormData(evento.target);
    const titulo = datos.get("titulo").trim();
    const estimacionTexto = datos.get("estimacion")?.trim() ?? "";
    const errorTitulo = contenedor.querySelector("[data-error-titulo]");
    const errorEstimacion = contenedor.querySelector("[data-error-estimacion]");
    errorTitulo.textContent = "";
    errorEstimacion.textContent = "";
    if (!titulo) {
      errorTitulo.textContent = "Ingresa un título para el elemento";
      evento.target.elements.titulo.focus();
      return;
    }
    if (estimacionTexto && (!Number.isInteger(Number(estimacionTexto)) || Number(estimacionTexto) < 1)) {
      errorEstimacion.textContent = "Ingresa una estimación válida";
      evento.target.elements.estimacion.focus();
      return;
    }

    if (!elementoActivo) {
      await crearElementoBacklog(projectId, { titulo, descripcion: datos.get("descripcion"), prioridad: datos.get("prioridad") });
      backlog = await obtenerProductBacklog(projectId);
      cerrarPanel();
      actualizarLista();
      anunciar("Elemento creado correctamente");
      return;
    }

    try {
      const nuevaEstimacion = estimacionTexto ? Number(estimacionTexto) : null;
      const cambios = {
        titulo,
        descripcion: datos.get("descripcion").trim() || null,
        prioridad: datos.get("prioridad"),
        criteriosAceptacion: datos.get("criteriosAceptacion").trim() || null
      };
      if (nuevaEstimacion !== elementoActivo.estimacion) cambios.estimacion = nuevaEstimacion;
      await actualizarElementoBacklog(projectId, elementoActivo.elementoBacklogId, cambios);
      backlog = await obtenerProductBacklog(projectId);
      cerrarPanel();
      actualizarLista();
      anunciar("Elemento refinado correctamente");
    } catch (errorPeticion) {
      contenedor.querySelector("[data-estado-panel]").textContent = errorPeticion.message;
    }
  }, { signal: sesion.signal });
}
