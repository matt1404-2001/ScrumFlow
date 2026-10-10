import {
  crearProyecto,
  obtenerInvitacionesPendientes,
  obtenerProyectos,
  responderInvitacion
} from "../api/proyectos.js";

let proyectos = [];
let invitaciones = [];
let errorCarga = null;

const listaProyectos = document.querySelector("[data-lista-proyectos]");
const listaInvitaciones = document.querySelector("[data-lista-invitaciones]");
const conteoProyectos = document.querySelector("[data-conteo-proyectos]");
const conteoInvitaciones = document.querySelector("[data-conteo-invitaciones]");
const estadoInvitaciones = document.querySelector("[data-estado-invitaciones]");
const modal = document.querySelector("[data-modal-proyecto]");
const formulario = document.querySelector("[data-formulario-proyecto]");
const nombreProyecto = document.querySelector("#nombre-proyecto");
const descripcionProyecto = document.querySelector("#descripcion-proyecto");
const errorNombre = document.querySelector("#nombre-proyecto-error");
const estadoModal = document.querySelector(".modal-proyecto__estado");

function escaparHtml(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto ?? "";
  return elemento.innerHTML;
}

function crearTarjetaProyecto(proyecto) {
  const rol = proyecto.esAdministrador ? "Administrador" : "Integrante";
  const descripcion = proyecto.descripcion || "Proyecto Scrum listo para organizar el trabajo del equipo.";
  const sprintActivo = proyecto.estado === "Sprint activo";

  return `
    <a
      class="tarjeta-proyecto"
      href="../proyecto/?projectId=${proyecto.projectId}#resumen"
      aria-label="Abrir proyecto ${escaparHtml(proyecto.nombre)}"
    >
      <div class="tarjeta-proyecto__encabezado">
        <h3>${escaparHtml(proyecto.nombre)}</h3>
        <span class="tarjeta-proyecto__flecha" aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="M4 10h11M11 6l4 4-4 4"></path></svg>
        </span>
      </div>
      <p class="tarjeta-proyecto__descripcion">${escaparHtml(descripcion)}</p>
      <div class="tarjeta-proyecto__pie">
        <span class="tarjeta-proyecto__rol">${rol}</span>
        <span class="tarjeta-proyecto__estado${sprintActivo ? " tarjeta-proyecto__estado--activo" : ""}">${escaparHtml(proyecto.estado)}</span>
      </div>
    </a>
  `;
}

function crearEstadoVacio() {
  return `
    <div class="estado-vacio">
      <div class="estado-vacio__contenido">
        <span class="estado-vacio__simbolo" aria-hidden="true">
          <svg viewBox="0 0 28 28"><path d="M5 8.5h18M5 14h11M5 19.5h7"></path><circle cx="22" cy="20" r="2.5"></circle></svg>
        </span>
        <h3>Tu primer proyecto empieza aquí</h3>
        <p>Crea un espacio para organizar el Product Backlog, el Sprint y el trabajo de tu equipo.</p>
        <button class="boton boton--principal" type="button" data-abrir-modal-vacio>Crear mi primer proyecto</button>
      </div>
    </div>
  `;
}

function crearEstadoError() {
  return `<div class="estado-vacio" role="alert"><div class="estado-vacio__contenido"><h3>No fue posible cargar tus proyectos</h3><p>Los datos simulados no están disponibles en este momento.</p><button class="boton boton--principal" type="button" data-reintentar-proyectos>Reintentar</button></div></div>`;
}

function renderizarProyectos() {
  if (!listaProyectos || !conteoProyectos) return;

  conteoProyectos.textContent = `${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"}`;
  listaProyectos.innerHTML = errorCarga ? crearEstadoError() : proyectos.length
    ? proyectos.map(crearTarjetaProyecto).join("")
    : crearEstadoVacio();

  listaProyectos.querySelector("[data-abrir-modal-vacio]")?.addEventListener("click", abrirModal);
  listaProyectos.querySelector("[data-reintentar-proyectos]")?.addEventListener("click", cargarDatos);
}

function renderizarInvitaciones() {
  if (!listaInvitaciones || !conteoInvitaciones) return;

  conteoInvitaciones.textContent = invitaciones.length.toString();
  conteoInvitaciones.setAttribute("aria-label", `${invitaciones.length} invitaciones pendientes`);

  listaInvitaciones.innerHTML = invitaciones.length
    ? invitaciones.map((invitacion) => `
          <article class="invitacion" data-invitacion-id="${invitacion.invitationId}">
            <div class="invitacion__superior">
              <h3>${escaparHtml(invitacion.project.nombre)}</h3>
              <span class="invitacion__estado">Pendiente</span>
            </div>
            <p>Invitación de ${escaparHtml(invitacion.invitadoPor.nombre)}</p>
            <div class="invitacion__acciones">
              <button class="boton boton--compacto" type="button" data-decision-invitacion="ACEPTAR" data-invitation-id="${invitacion.invitationId}">Aceptar</button>
              <button class="boton boton--texto" type="button" data-decision-invitacion="RECHAZAR" data-invitation-id="${invitacion.invitationId}">Rechazar</button>
            </div>
          </article>
      `).join("")
    : '<p class="estado-vacio-invitaciones">No tienes invitaciones pendientes.</p>';
}

function abrirModal() {
  formulario?.reset();
  nombreProyecto?.setAttribute("aria-invalid", "false");
  if (errorNombre) errorNombre.textContent = "";
  if (estadoModal) estadoModal.textContent = "";
  modal?.showModal();
  nombreProyecto?.focus();
}

async function responderInvitacionDesdeLaVista(evento) {
  const boton = evento.target.closest("[data-decision-invitacion]");
  if (!boton || boton.disabled) return;

  const decision = boton.dataset.decisionInvitacion;
  const invitacion = invitaciones.find(({ invitationId }) => invitationId === Number(boton.dataset.invitationId));
  if (!invitacion) return;

  const tarjeta = boton.closest("[data-invitacion-id]");
  tarjeta?.setAttribute("aria-busy", "true");
  tarjeta?.querySelectorAll("button").forEach((accion) => { accion.disabled = true; });
  if (estadoInvitaciones) estadoInvitaciones.textContent = "Guardando tu respuesta...";

  try {
    const resultado = await responderInvitacion(invitacion.invitationId, decision);
    const indice = invitaciones.indexOf(invitacion);
    invitaciones.splice(indice, 1);

    if (resultado.proyecto) proyectos.unshift(resultado.proyecto);
    renderizarProyectos();
    renderizarInvitaciones();
    if (estadoInvitaciones) {
      estadoInvitaciones.textContent = decision === "ACEPTAR"
        ? "Ahora formas parte del proyecto."
        : "Invitación rechazada.";
    }
  } catch (error) {
    tarjeta?.removeAttribute("aria-busy");
    tarjeta?.querySelectorAll("button").forEach((accion) => { accion.disabled = false; });
    if (estadoInvitaciones) estadoInvitaciones.textContent = error.message;
  }
}

function cerrarModal() {
  modal?.close();
}

async function cargarDatos() {
  errorCarga = null;
  renderizarProyectos();
  try {
    [proyectos, invitaciones] = await Promise.all([obtenerProyectos(), obtenerInvitacionesPendientes()]);
  } catch (error) {
    errorCarga = error;
    proyectos = [];
    invitaciones = [];
  }
  renderizarProyectos();
  renderizarInvitaciones();
}

document.querySelector("[data-abrir-modal]")?.addEventListener("click", abrirModal);
document.querySelectorAll("[data-cerrar-modal]").forEach((boton) => {
  boton.addEventListener("click", cerrarModal);
});
listaInvitaciones?.addEventListener("click", responderInvitacionDesdeLaVista);

modal?.addEventListener("click", (evento) => {
  if (evento.target === modal) cerrarModal();
});

nombreProyecto?.addEventListener("input", () => {
  if (nombreProyecto.getAttribute("aria-invalid") === "true" && nombreProyecto.value.trim()) {
    nombreProyecto.setAttribute("aria-invalid", "false");
    errorNombre.textContent = "";
  }
});

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nombre = nombreProyecto.value.trim();

  if (!nombre) {
    nombreProyecto.setAttribute("aria-invalid", "true");
    errorNombre.textContent = "Ingresa un nombre para el proyecto.";
    nombreProyecto.focus();
    return;
  }

  proyectos.unshift(await crearProyecto({ nombre, descripcion: descripcionProyecto.value.trim() }));

  renderizarProyectos();
  cerrarModal();
});

cargarDatos();
