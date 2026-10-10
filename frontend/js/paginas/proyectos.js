const proyectosIniciales = [
  {
    projectId: 101,
    nombre: "Sistema de Gestión Scrum",
    descripcion: "Plataforma académica para organizar el trabajo y los eventos de un equipo Scrum.",
    esAdministrador: true,
    estado: "Sprint activo"
  },
  {
    projectId: 204,
    nombre: "Portal de Ventas",
    descripcion: "Mejoras al proceso comercial y seguimiento de oportunidades del equipo.",
    esAdministrador: false,
    estado: "Sin Sprint activo"
  },
  {
    projectId: 318,
    nombre: "Experiencia de Clientes",
    descripcion: "Iniciativas para simplificar el acompañamiento y la atención posterior a la compra.",
    esAdministrador: true,
    estado: "Sin Sprint activo"
  }
];

const invitacionesIniciales = [
  {
    invitationId: 42,
    project: { projectId: 412, nombre: "Aplicación de Inventario" },
    invitadoPor: { nombre: "Carlos Méndez" },
    estado: "PENDIENTE",
    fechaCreacion: "2026-10-08T14:30:00Z"
  },
  {
    invitationId: 43,
    project: { projectId: 506, nombre: "Mejora de Operaciones" },
    invitadoPor: { nombre: "Ana Torres" },
    estado: "PENDIENTE",
    fechaCreacion: "2026-10-09T09:15:00Z"
  }
];

const proyectos = [...proyectosIniciales];
const invitaciones = invitacionesIniciales.filter(({ estado }) => estado === "PENDIENTE");

const listaProyectos = document.querySelector("[data-lista-proyectos]");
const listaInvitaciones = document.querySelector("[data-lista-invitaciones]");
const conteoProyectos = document.querySelector("[data-conteo-proyectos]");
const conteoInvitaciones = document.querySelector("[data-conteo-invitaciones]");
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
      href="../paginas/resumen.html?projectId=${proyecto.projectId}"
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

function renderizarProyectos() {
  if (!listaProyectos || !conteoProyectos) return;

  conteoProyectos.textContent = `${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"}`;
  listaProyectos.innerHTML = proyectos.length
    ? proyectos.map(crearTarjetaProyecto).join("")
    : crearEstadoVacio();

  listaProyectos.querySelector("[data-abrir-modal-vacio]")?.addEventListener("click", abrirModal);
}

function renderizarInvitaciones() {
  if (!listaInvitaciones || !conteoInvitaciones) return;

  conteoInvitaciones.textContent = invitaciones.length.toString();
  conteoInvitaciones.setAttribute("aria-label", `${invitaciones.length} invitaciones pendientes`);

  listaInvitaciones.innerHTML = invitaciones.length
    ? invitaciones.map((invitacion) => `
        <article class="invitacion">
          <div class="invitacion__superior">
            <h3>${escaparHtml(invitacion.project.nombre)}</h3>
            <span class="invitacion__estado">Pendiente</span>
          </div>
          <p>Invitación de ${escaparHtml(invitacion.invitadoPor.nombre)}</p>
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

function cerrarModal() {
  modal?.close();
}

document.querySelector("[data-abrir-modal]")?.addEventListener("click", abrirModal);
document.querySelectorAll("[data-cerrar-modal]").forEach((boton) => {
  boton.addEventListener("click", cerrarModal);
});

modal?.addEventListener("click", (evento) => {
  if (evento.target === modal) cerrarModal();
});

nombreProyecto?.addEventListener("input", () => {
  if (nombreProyecto.getAttribute("aria-invalid") === "true" && nombreProyecto.value.trim()) {
    nombreProyecto.setAttribute("aria-invalid", "false");
    errorNombre.textContent = "";
  }
});

formulario?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nombre = nombreProyecto.value.trim();

  if (!nombre) {
    nombreProyecto.setAttribute("aria-invalid", "true");
    errorNombre.textContent = "Ingresa un nombre para el proyecto.";
    nombreProyecto.focus();
    return;
  }

  proyectos.unshift({
    projectId: Date.now(),
    nombre,
    descripcion: descripcionProyecto.value.trim(),
    esAdministrador: true,
    estado: "Sin Sprint activo"
  });

  renderizarProyectos();
  cerrarModal();
});

renderizarProyectos();
renderizarInvitaciones();
