import { obtenerResumenProyecto } from "../api/resumen.js";

const accionesPorDestino = {
  INVITACIONES: { etiqueta: "Ver invitaciones", seccion: "../proyectos/" },
  PROYECTOS: { etiqueta: "Ver proyectos", seccion: "../proyectos/" },
  EQUIPO: { etiqueta: "Completar equipo", seccion: "equipo" },
  BACKLOG: { etiqueta: "Preparar backlog", seccion: "product-backlog" },
  SPRINT: { etiqueta: "Planificar Sprint", seccion: "sprint" },
  DAILY: { etiqueta: "Ir a la Daily", seccion: "reuniones" },
  CIERRE: { etiqueta: "Preparar cierre", seccion: "reuniones" }
};

function escaparHtml(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto ?? "";
  return elemento.innerHTML;
}

function crearUrlSeccion(seccion, projectId) {
  if (seccion.startsWith("../")) return seccion;
  return `../proyecto/?projectId=${encodeURIComponent(projectId)}#${seccion}`;
}

function obtenerDiaSprint(sprint) {
  if (!sprint?.fechaInicio || !sprint?.fechaFin) return null;
  const inicio = new Date(`${sprint.fechaInicio}T00:00:00`);
  const fin = new Date(`${sprint.fechaFin}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const duracion = Math.round((fin - inicio) / 86400000) + 1;
  const dia = Math.min(Math.max(Math.round((hoy - inicio) / 86400000) + 1, 1), duracion);
  return { dia, duracion };
}

function obtenerFechaActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function renderizarProgreso(resumen) {
  if (!resumen.currentSprint || !resumen.progress) {
    return `
      <section class="estado-sin-sprint" aria-labelledby="titulo-sin-sprint">
        <span class="estado-sin-sprint__simbolo" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 1-7.4 4.3M3.5 4v4.6h4.6M12 7.5V12l3 2"></path></svg>
        </span>
        <div>
          <h2 id="titulo-sin-sprint">Todavía no hay un Sprint en curso</h2>
          <p>Cuando el equipo active uno, aquí verás sus fechas, objetivo y avance.</p>
        </div>
      </section>
    `;
  }

  const porcentaje = Math.round(resumen.progress.percentage);
  const periodo = obtenerDiaSprint(resumen.currentSprint);
  const detallePeriodo = periodo ? `Día ${periodo.dia} de ${periodo.duracion}` : "Sprint activo";

  return `
    <section class="estado-sprint" aria-labelledby="titulo-sprint-actual">
      <div class="estado-sprint__cabecera">
        <div>
          <span class="insignia-estado"><span aria-hidden="true"></span>Sprint activo</span>
          <h2 id="titulo-sprint-actual">${escaparHtml(resumen.currentSprint.sprintGoal || "Sprint sin objetivo definido")}</h2>
        </div>
        <p class="estado-sprint__periodo">${detallePeriodo}</p>
      </div>
      <div class="avance-sprint">
        <div class="avance-sprint__texto">
          <span>Progreso del trabajo</span>
          <strong>${porcentaje}%</strong>
        </div>
        <div class="avance-sprint__barra" role="progressbar" aria-label="Progreso del Sprint" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${porcentaje}">
          <span style="width: ${porcentaje}%"></span>
        </div>
      </div>
    </section>
  `;
}

function renderizarActividad(resumen, projectId) {
  const recomendacion = resumen.primaryRecommendation;
  if (!recomendacion) {
    return `
      <section class="siguiente-actividad siguiente-actividad--completa" aria-labelledby="titulo-actividad">
        <div class="siguiente-actividad__simbolo" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 12 4.2 4.2L19 6.8"></path></svg>
        </div>
        <div><h2 id="titulo-actividad">Todo está al día</h2><p>No hay una actividad prioritaria pendiente en este momento.</p></div>
      </section>
    `;
  }

  const accion = accionesPorDestino[recomendacion.destino] ?? accionesPorDestino.PROYECTOS;
  const textoApoyo = recomendacion.destino === "DAILY"
    ? "El equipo aún no ha registrado el encuentro de hoy. Empieza por aquí para mantener el Sprint alineado."
    : "Este es el siguiente paso recomendado según el estado actual del proyecto.";

  return `
    <section class="siguiente-actividad" aria-labelledby="titulo-actividad">
      <div class="siguiente-actividad__contenido">
        <div class="siguiente-actividad__simbolo" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3.8a8.2 8.2 0 1 0 8.2 8.2M12 7v5l3.4 2M17 3.8h3.2V7"></path></svg>
        </div>
        <div>
          <p class="siguiente-actividad__etiqueta">Siguiente actividad</p>
          <h2 id="titulo-actividad">${escaparHtml(recomendacion.mensaje)}</h2>
          <p>${textoApoyo}</p>
        </div>
      </div>
      <a class="boton boton--principal" href="${crearUrlSeccion(accion.seccion, projectId)}">
        ${accion.etiqueta}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"></path></svg>
      </a>
    </section>
  `;
}

function obtenerEstadoDaily(daily) {
  if (!daily?.dailyDisponible) return { clase: "neutro", titulo: "Daily no programada", detalle: "Se mostrará durante los días laborables de un Sprint activo." };
  if (daily.estado === "FINALIZADA") return { clase: "listo", titulo: "Daily completada", detalle: "El registro de hoy ya está finalizado." };
  if (daily.estado === "EN_CURSO") return { clase: "activo", titulo: "Daily en curso", detalle: "El equipo ya inició el registro de hoy." };
  return { clase: "pendiente", titulo: "Daily pendiente", detalle: "La Daily de hoy todavía no ha iniciado." };
}

function renderizarSenales(resumen) {
  const daily = obtenerEstadoDaily(resumen.dailyToday);
  const hayImpedimentos = resumen.openImpediments > 0;
  return `
    <section class="senales-proyecto" aria-label="Estado operativo del proyecto">
      <article class="senal-proyecto">
        <span class="senal-proyecto__icono senal-proyecto__icono--${daily.clase}" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M7 3.8v3M17 3.8v3M4 9h16M5 5.5h14v14H5zM8 13h3M8 16h6"></path></svg>
        </span>
        <div><h3>${daily.titulo}</h3><p>${daily.detalle}</p></div>
      </article>
      <article class="senal-proyecto">
        <span class="senal-proyecto__icono senal-proyecto__icono--${hayImpedimentos ? "pendiente" : "listo"}" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 4 3.8 19h16.4L12 4ZM12 9v4.5M12 17h.01"></path></svg>
        </span>
        <div>
          <h3>${hayImpedimentos ? `${resumen.openImpediments} impedimentos abiertos` : "Sin impedimentos abiertos"}</h3>
          <p>${hayImpedimentos ? "Hay bloqueos que el equipo necesita revisar." : "El equipo no tiene bloqueos pendientes de resolver."}</p>
        </div>
      </article>
    </section>
  `;
}

function renderizarTrabajo(resumen) {
  if (!resumen.progress) {
    return `
      <section class="trabajo-sprint trabajo-sprint--vacio" aria-labelledby="titulo-trabajo">
        <div><h2 id="titulo-trabajo">Trabajo del Sprint</h2><p>La distribución aparecerá cuando exista un Sprint activo.</p></div>
      </section>
    `;
  }

  const { pendiente, enProgreso, terminado } = resumen.progress.counts;
  return `
    <section class="trabajo-sprint" aria-labelledby="titulo-trabajo">
      <div class="trabajo-sprint__cabecera">
        <div><h2 id="titulo-trabajo">Trabajo del Sprint</h2><p>Distribución actual de los elementos comprometidos.</p></div>
        <span>${pendiente + enProgreso + terminado} elementos</span>
      </div>
      <dl class="conteos-trabajo">
        <div class="conteo-trabajo conteo-trabajo--pendiente"><dt>Pendiente</dt><dd>${pendiente}</dd></div>
        <div class="conteo-trabajo conteo-trabajo--progreso"><dt>En progreso</dt><dd>${enProgreso}</dd></div>
        <div class="conteo-trabajo conteo-trabajo--terminado"><dt>Terminado</dt><dd>${terminado}</dd></div>
      </dl>
    </section>
  `;
}

function renderizarResumen(contenedor, datos, projectId) {
  const { proyecto, resumen } = datos;
  const nombreProyecto = document.querySelector("[data-nombre-proyecto]");
  const rolUsuario = document.querySelector("[data-rol-usuario]");
  const enlaceResumen = document.querySelector("[data-enlace-resumen]");
  if (nombreProyecto) nombreProyecto.textContent = proyecto.nombre;
  if (rolUsuario) rolUsuario.textContent = proyecto.rol;
  if (enlaceResumen) enlaceResumen.href = `resumen.html?projectId=${encodeURIComponent(resumen.projectId)}`;
  document.querySelectorAll("[data-destino-seccion]").forEach((enlace) => {
    enlace.href = crearUrlSeccion(enlace.dataset.destinoSeccion, projectId);
  });
  document.title = `Resumen · ${proyecto.nombre} | ScrumFlow`;

  const orientacion = resumen.productGoal
    ? `Objetivo del producto: ${escaparHtml(resumen.productGoal)}`
    : "El proyecto todavía no tiene un Product Goal definido.";

  contenedor.innerHTML = `
    <header class="encabezado-resumen">
      <div><h1>Resumen</h1><p>${orientacion}</p></div>
      <time datetime="${obtenerFechaActual()}">Actualizado hoy</time>
    </header>
    <div class="resumen__principal">
      ${renderizarProgreso(resumen)}
      ${renderizarActividad(resumen, projectId)}
    </div>
    ${renderizarSenales(resumen)}
    ${renderizarTrabajo(resumen)}
  `;
  contenedor.setAttribute("aria-busy", "false");
}

function renderizarError(contenedor, reintentar) {
  contenedor.innerHTML = `
    <section class="resumen-error" role="alert">
      <h1>No fue posible obtener el estado del proyecto</h1>
      <p>Comprueba tu conexión e inténtalo nuevamente.</p>
      <button class="boton boton--principal" type="button" data-reintentar>Reintentar</button>
    </section>
  `;
  contenedor.setAttribute("aria-busy", "false");
  contenedor.querySelector("[data-reintentar]")?.addEventListener("click", reintentar);
}

export async function inicializarResumen(contenedor, projectId) {
  contenedor.setAttribute("aria-busy", "true");
  try {
    renderizarResumen(contenedor, await obtenerResumenProyecto(projectId), projectId);
  } catch {
    renderizarError(contenedor, () => inicializarResumen(contenedor, projectId));
  }
}

const contenedorResumen = document.querySelector("[data-resumen]");
if (contenedorResumen) {
  const parametros = new URLSearchParams(window.location.search);
  inicializarResumen(contenedorResumen, parametros.get("projectId"));
}
