import { inicializarBacklog } from "./backlog.js";
import { inicializarResumen } from "./resumen.js";
import { inicializarReuniones } from "./reuniones.js";
import { inicializarSprint } from "./sprint.js";
import { inicializarEquipo } from "./equipo.js";
import { actualizarProyecto } from "../api/proyectos.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";

const proyectos = {
  "101": {
    nombre: "Sistema de Gestión Scrum",
    usuario: "María López",
    rol: "Administrador",
    esAdministrador: true,
    esProductOwner: true,
    descripcion: "Plataforma académica para organizar el trabajo y los eventos de un equipo Scrum."
  },
  "204": {
    nombre: "Portal de Ventas",
    usuario: "María López",
    rol: "Integrante",
    esAdministrador: false,
    esProductOwner: true,
    descripcion: "Mejoras al proceso comercial y seguimiento de oportunidades del equipo."
  },
  "318": {
    nombre: "Experiencia de Clientes",
    usuario: "María López",
    rol: "Administrador",
    esAdministrador: true,
    esProductOwner: false,
    descripcion: "Iniciativas para simplificar el acompañamiento y la atención posterior a la compra."
  }
};

const secciones = {
  resumen: {
    titulo: "Resumen"
  },
  "product-backlog": {
    titulo: "Product Backlog",
    descripcion: "Espacio para organizar y refinar el trabajo pendiente del producto.",
     estado: "Disponible"
  },
  sprint: {
    titulo: "Sprint",
    descripcion: "Espacio de planificación y seguimiento del Sprint del equipo.",
     estado: "Disponible"
  },
  reuniones: {
    titulo: "Reuniones",
    descripcion: "Punto de acceso a los eventos de seguimiento y cierre del Sprint.",
     estado: "Disponible"
  },
  equipo: {
    titulo: "Equipo",
    descripcion: "Espacio para consultar a las personas que participan en el proyecto.",
     estado: "Disponible"
  }
};

const parametros = new URLSearchParams(window.location.search);
const projectId = parametros.get("projectId");
const proyecto = proyectos[projectId];
const nombreProyecto = document.querySelector("[data-nombre-proyecto]");
const datosUsuario = document.querySelector(".perfil-usuario__datos");
const contenido = document.querySelector("[data-contenido-seccion]");
const enlaces = document.querySelectorAll("[data-seccion]");
const cabecera = document.querySelector(".cabecera-proyecto");
let seccionActiva = "resumen";

function obtenerSeccionActual() {
  const seccionSolicitada = window.location.hash.slice(1).split("/")[0];
  if (secciones[seccionSolicitada]) seccionActiva = seccionSolicitada;
  return seccionActiva;
}

async function renderizarSeccion() {
  if (!proyecto) {
    document.title = "Proyecto no disponible | ScrumFlow";
    if (nombreProyecto) nombreProyecto.textContent = "Proyecto no disponible";
    if (datosUsuario) datosUsuario.hidden = true;
    if (cabecera) cabecera.hidden = true;
    if (contenido) {
      contenido.innerHTML = `<section class="resumen-error" role="alert"><h1>Proyecto no disponible</h1><p>El proyecto solicitado no existe o no tienes acceso a él.</p><a class="boton boton--principal" href="../proyectos/">Volver a Proyectos</a></section>`;
    }
    return;
  }
  const clave = obtenerSeccionActual();
  const seccion = secciones[clave];

  enlaces.forEach((enlace) => {
    const estaSeleccionado = enlace.dataset.seccion === clave;
    if (estaSeleccionado) {
      enlace.setAttribute("aria-current", "page");
    } else {
      enlace.removeAttribute("aria-current");
    }
  });

  document.body.classList.remove("panel-backlog-abierto");
  document.body.classList.remove("panel-sprint-abierto");
  document.body.classList.remove("panel-equipo-abierto");
  document.body.classList.toggle("pagina-resumen", clave === "resumen");
  contenido.classList.toggle("resumen", clave === "resumen");
  contenido.removeAttribute("aria-busy");

  if (clave === "resumen") {
    contenido.innerHTML = `
      <div class="resumen-cargando" role="status">
        <span class="resumen-cargando__indicador" aria-hidden="true"></span>
        <p>Preparando el estado del proyecto...</p>
      </div>
    `;
    await inicializarResumen(contenido, projectId);
    return;
  }

  if (clave === "product-backlog") {
    contenido.innerHTML = `<div class="backlog-cargando" role="status"><span></span>Cargando Product Backlog…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    await inicializarBacklog(contenido, projectId, { puedeAdministrar: proyecto.esAdministrador, esProductOwner: proyecto.esProductOwner });
    return;
  }

  if (clave === "sprint") {
    contenido.innerHTML = `<div class="sprint-cargando" role="status"><span></span>Cargando Sprint…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    await inicializarSprint(contenido, projectId);
    return;
  }

  if (clave === "reuniones") {
    contenido.innerHTML = `<div class="reuniones-cargando" role="status"><span></span>Cargando reuniones…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    const eventoSolicitado = window.location.hash.slice(1).split("/")[1] ?? null;
    await inicializarReuniones(contenido, projectId, eventoSolicitado, proyecto.rol === "Administrador");
    return;
  }

  if (clave === "equipo") {
    contenido.innerHTML = `<div class="equipo-cargando" role="status"><span></span>Cargando equipo…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    await inicializarEquipo(contenido, projectId, proyecto.rol === "Administrador");
    return;
  }

  contenido.innerHTML = `
    <header class="encabezado-seccion">
      <h1>${seccion.titulo}</h1>
      <p>${seccion.descripcion}</p>
    </header>
       <section class="contenido-seccion" aria-labelledby="titulo-contenido-seccion">
      <span class="contenido-provisional__estado">${seccion.estado}</span>
       <h2 id="titulo-contenido-seccion">${seccion.titulo}</h2>
       <p>${seccion.descripcion}</p>
    </section>
  `;

  document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
}

function renderizarPanelProyecto() {
  return `
    <div class="panel-proyecto__fondo" data-cerrar-proyecto></div>
    <aside class="panel-proyecto" role="dialog" aria-modal="true" aria-labelledby="titulo-panel-proyecto">
      <header><div><p>Configuración del proyecto</p><h2 id="titulo-panel-proyecto">Editar proyecto</h2></div><button type="button" data-cerrar-proyecto aria-label="Cerrar panel">×</button></header>
      <form data-formulario-proyecto novalidate>
        <label for="nombre-proyecto">Nombre<input id="nombre-proyecto" name="nombre" maxlength="150" required value="${escaparAtributo(proyecto.nombre)}"></label>
        <label for="descripcion-proyecto">Descripción <span>Opcional</span><textarea id="descripcion-proyecto" name="descripcion" rows="6">${escaparHtml(proyecto.descripcion ?? "")}</textarea></label>
        <p data-error-proyecto role="alert"></p>
        <footer><button type="button" data-cerrar-proyecto>Cancelar</button><button type="submit">Guardar cambios</button></footer>
      </form>
    </aside>`;
}

function cerrarPanelProyecto() {
  document.querySelector("[data-panel-proyecto]").innerHTML = "";
  document.body.classList.remove("panel-proyecto-abierto");
}

function abrirPanelProyecto() {
  document.querySelector("[data-panel-proyecto]").innerHTML = renderizarPanelProyecto();
  document.body.classList.add("panel-proyecto-abierto");
  document.querySelector("#nombre-proyecto")?.focus();
}

if (nombreProyecto) nombreProyecto.textContent = proyecto.nombre;
if (datosUsuario) {
  datosUsuario.querySelector("strong").textContent = proyecto.usuario;
  datosUsuario.querySelector("span").textContent = proyecto.rol;
}

if (cabecera) {
  cabecera.insertAdjacentHTML("beforeend", `<button class="accion-proyecto" type="button" data-editar-proyecto ${proyecto.esAdministrador ? "" : "hidden"}>Editar proyecto</button><div data-panel-proyecto></div>`);
  cabecera.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-editar-proyecto]")) abrirPanelProyecto();
    if (evento.target.closest("[data-cerrar-proyecto]")) cerrarPanelProyecto();
  });
  cabecera.addEventListener("submit", async (evento) => {
    if (!evento.target.matches("[data-formulario-proyecto]")) return;
    evento.preventDefault();
    const datos = new FormData(evento.target);
    const error = cabecera.querySelector("[data-error-proyecto]");
    error.textContent = "";
    try {
       const actualizado = await actualizarProyecto(projectId, { nombre: datos.get("nombre"), descripcion: datos.get("descripcion") });
      Object.assign(proyecto, { nombre: actualizado.nombre, descripcion: actualizado.descripcion });
      nombreProyecto.textContent = proyecto.nombre;
      cerrarPanelProyecto();
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

window.addEventListener("hashchange", renderizarSeccion);
renderizarSeccion();
