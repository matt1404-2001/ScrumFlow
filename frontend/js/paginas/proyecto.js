import { inicializarBacklog } from "./backlog.js";
import { inicializarResumen } from "./resumen.js";
import { inicializarSprint } from "./sprint.js";

const proyectos = {
  "101": {
    nombre: "Sistema de Gestión Scrum",
    usuario: "María López",
    rol: "Administrador"
  },
  "204": {
    nombre: "Portal de Ventas",
    usuario: "María López",
    rol: "Integrante"
  },
  "318": {
    nombre: "Experiencia de Clientes",
    usuario: "María López",
    rol: "Administrador"
  }
};

const secciones = {
  resumen: {
    titulo: "Resumen"
  },
  "product-backlog": {
    titulo: "Product Backlog",
    descripcion: "Espacio para organizar y refinar el trabajo pendiente del producto.",
    estado: "Sección preparada",
    mensaje: "La gestión del Product Backlog se implementará próximamente.",
    detalle: "La navegación ya está lista; el contenido de esta sección se añadirá en su etapa correspondiente."
  },
  sprint: {
    titulo: "Sprint",
    descripcion: "Espacio de planificación y seguimiento del Sprint del equipo.",
    estado: "Sección preparada",
    mensaje: "La planificación y el seguimiento del Sprint se implementarán próximamente.",
    detalle: "La navegación ya está lista; el contenido de esta sección se añadirá en su etapa correspondiente."
  },
  reuniones: {
    titulo: "Reuniones",
    descripcion: "Punto de acceso a los eventos de seguimiento y cierre del Sprint.",
    estado: "Sección preparada",
    mensaje: "Las reuniones Scrum se implementarán próximamente.",
    detalle: "La navegación ya está lista; el contenido de esta sección se añadirá en su etapa correspondiente."
  },
  equipo: {
    titulo: "Equipo",
    descripcion: "Espacio para consultar a las personas que participan en el proyecto.",
    estado: "Sección preparada",
    mensaje: "La gestión del equipo se implementará próximamente.",
    detalle: "La navegación ya está lista; el contenido de esta sección se añadirá en su etapa correspondiente."
  }
};

const parametros = new URLSearchParams(window.location.search);
const proyecto = proyectos[parametros.get("projectId")] ?? proyectos["101"];
const nombreProyecto = document.querySelector("[data-nombre-proyecto]");
const datosUsuario = document.querySelector(".perfil-usuario__datos");
const contenido = document.querySelector("[data-contenido-seccion]");
const enlaces = document.querySelectorAll("[data-seccion]");
let seccionActiva = "resumen";

function obtenerSeccionActual() {
  const seccionSolicitada = window.location.hash.slice(1);
  if (secciones[seccionSolicitada]) seccionActiva = seccionSolicitada;
  return seccionActiva;
}

async function renderizarSeccion() {
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
    await inicializarResumen(contenido, parametros.get("projectId") ?? "101");
    return;
  }

  if (clave === "product-backlog") {
    contenido.innerHTML = `<div class="backlog-cargando" role="status"><span></span>Cargando Product Backlog…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    await inicializarBacklog(contenido, parametros.get("projectId") ?? "101");
    return;
  }

  if (clave === "sprint") {
    contenido.innerHTML = `<div class="sprint-cargando" role="status"><span></span>Cargando Sprint…</div>`;
    document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
    await inicializarSprint(contenido, parametros.get("projectId") ?? "101");
    return;
  }

  contenido.innerHTML = `
    <header class="encabezado-seccion">
      <h1>${seccion.titulo}</h1>
      <p>${seccion.descripcion}</p>
    </header>
    <section class="contenido-provisional" aria-labelledby="titulo-contenido-provisional">
      <span class="contenido-provisional__estado">${seccion.estado}</span>
      <h2 id="titulo-contenido-provisional">${seccion.mensaje}</h2>
      <p>${seccion.detalle}</p>
    </section>
  `;

  document.title = `${seccion.titulo} · ${proyecto.nombre} | ScrumFlow`;
}

if (nombreProyecto) nombreProyecto.textContent = proyecto.nombre;
if (datosUsuario) {
  datosUsuario.querySelector("strong").textContent = proyecto.usuario;
  datosUsuario.querySelector("span").textContent = proyecto.rol;
}

window.addEventListener("hashchange", renderizarSeccion);
renderizarSeccion();
