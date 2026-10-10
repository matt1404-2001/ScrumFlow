import {
  actualizarDefinitionOfDone,
  actualizarIntegrante,
  crearInvitacion,
  obtenerEquipo,
  retirarIntegrante
} from "../api/equipo.js";
import { escaparAtributo, escaparHtml } from "../utilidades/html.js";

const sesiones = new WeakMap();

function obtenerIniciales(nombre) {
  return nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

function obtenerResponsabilidades(integrante) {
  return [
    integrante.esProductOwner && "Product Owner",
    integrante.esScrumMaster && "Scrum Master",
    integrante.esDeveloper && "Developer"
  ].filter(Boolean);
}

function renderizarIntegrantes(integrantes, puedeAdministrar) {
  return integrantes.filter((integrante) => integrante.activo).map((integrante) => {
    const responsabilidades = obtenerResponsabilidades(integrante);
    const contenido = `
      <span class="integrante__identidad">
        <span class="integrante__avatar" aria-hidden="true">${escaparHtml(obtenerIniciales(integrante.usuario.nombre))}</span>
        <strong>${escaparHtml(integrante.usuario.nombre)}</strong>
        <span>${escaparHtml(integrante.usuario.correo)}</span>
      </span>
      <span class="integrante__acceso">
        ${integrante.esAdministrador
          ? `<span class="insignia-acceso"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.8 14.5 5v3.8c0 3.2-2.2 5.3-5.5 6.5-3.3-1.2-5.5-3.3-5.5-6.5V5zM6.8 9l1.4 1.4 3-3"></path></svg>Administrador técnico</span>`
          : `<span class="integrante__sin-acceso">Integrante</span>`}
      </span>
      <span class="integrante__responsabilidades">
        ${responsabilidades.length
          ? responsabilidades.map((rol) => `<span>${rol}</span>`).join("")
          : `<span class="integrante__sin-rol">Sin responsabilidad asignada</span>`}
      </span>
      ${puedeAdministrar ? `<svg class="integrante__flecha" viewBox="0 0 18 18" aria-hidden="true"><path d="m7 4 5 5-5 5"></path></svg>` : ""}`;

    return puedeAdministrar
      ? `<button class="integrante" type="button" data-editar-integrante="${integrante.miembroProyectoId}" aria-label="Editar responsabilidades y permisos de ${escaparAtributo(integrante.usuario.nombre)}">${contenido}</button>`
      : `<article class="integrante">${contenido}</article>`;
  }).join("");
}

function renderizarInvitaciones(invitaciones) {
  if (!invitaciones.length) {
    return `<div class="invitaciones-vacias"><p>No hay invitaciones pendientes.</p><span>Las nuevas invitaciones aparecerán aquí hasta que sean respondidas.</span></div>`;
  }

  return invitaciones.map((invitacion) => {
    const fecha = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invitacion.fechaCreacion));
    return `
      <article class="invitacion">
        <span class="invitacion__icono" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M3.5 5.5h13v9h-13zM4 6l6 4.5L16 6"></path></svg></span>
        <span class="invitacion__persona"><strong>${escaparHtml(invitacion.usuarioInvitado.nombre)}</strong><span>${escaparHtml(invitacion.usuarioInvitado.correo)}</span></span>
        <span class="invitacion__fecha">Enviada el ${fecha}</span>
        <span class="invitacion__estado">Pendiente</span>
      </article>`;
  }).join("");
}

function renderizarDod(definitionOfDone) {
  const criterios = definitionOfDone?.split("\n").map((criterio) => criterio.trim()).filter(Boolean) ?? [];
  if (!criterios.length) {
    return `<div class="dod-vacia"><p>La Definition of Done aún no está definida.</p><span>Agrega al menos un criterio antes de activar un Sprint.</span></div>`;
  }
  return `<ol class="dod-lista">${criterios.map((criterio) => `<li><span aria-hidden="true"><svg viewBox="0 0 18 18"><path d="m4 9 3 3 7-7"></path></svg></span>${escaparHtml(criterio)}</li>`).join("")}</ol>`;
}

function renderizarPanelInvitacion() {
  return `
    <div class="panel-equipo__fondo" data-cerrar-panel></div>
    <aside class="panel-equipo" role="dialog" aria-modal="true" aria-labelledby="titulo-panel-equipo">
      <header class="panel-equipo__cabecera"><div><p>Nueva invitación</p><h2 id="titulo-panel-equipo">Invitar integrante</h2></div>${botonCerrar()}</header>
      <form class="panel-equipo__formulario" data-formulario-invitacion novalidate>
        <p class="panel-equipo__introduccion">La persona debe tener una cuenta en ScrumFlow. Al aceptar, ingresará sin permisos ni responsabilidades asignadas.</p>
        <div class="campo-equipo"><label for="correo-invitado">Correo de la cuenta</label><input id="correo-invitado" name="correo" type="email" inputmode="email" autocomplete="email" placeholder="sofia.ramirez@correo.com" required><span class="campo-equipo__error" data-error-correo></span></div>
        <p class="panel-equipo__nota"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="6.5"></circle><path d="M9 8v4M9 5.5v.2"></path></svg>Las responsabilidades Scrum se asignan después de aceptar la invitación.</p>
        <p class="panel-equipo__estado" data-estado-panel aria-live="polite"></p>
        <footer class="panel-equipo__acciones"><button class="boton boton--secundario" type="button" data-cerrar-panel>Cancelar</button><button class="boton boton--principal" type="submit">Enviar invitación</button></footer>
      </form>
    </aside>`;
}

function renderizarPanelIntegrante(integrante) {
  const opcion = (nombre, titulo, descripcion, marcado) => `
    <label class="opcion-equipo">
      <span><strong>${titulo}</strong><small>${descripcion}</small></span>
      <input name="${nombre}" type="checkbox" ${marcado ? "checked" : ""}>
      <span class="opcion-equipo__control" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3.5 8 3 3 6-6"></path></svg></span>
    </label>`;
  return `
    <div class="panel-equipo__fondo" data-cerrar-panel></div>
    <aside class="panel-equipo" role="dialog" aria-modal="true" aria-labelledby="titulo-panel-equipo">
      <header class="panel-equipo__cabecera"><div><p>Integrante del proyecto</p><h2 id="titulo-panel-equipo">${escaparHtml(integrante.usuario.nombre)}</h2></div>${botonCerrar()}</header>
      <form class="panel-equipo__formulario" data-formulario-integrante data-member-id="${integrante.miembroProyectoId}">
        <div class="panel-equipo__persona"><span class="integrante__avatar" aria-hidden="true">${escaparHtml(obtenerIniciales(integrante.usuario.nombre))}</span><span><strong>${escaparHtml(integrante.usuario.nombre)}</strong><small>${escaparHtml(integrante.usuario.correo)}</small></span></div>
        <fieldset class="grupo-permisos grupo-permisos--tecnico"><legend>Acceso técnico</legend><p>Permite administrar la configuración, el equipo y los acuerdos del proyecto.</p>${opcion("esAdministrador", "Administrador técnico", "Permiso de gestión del proyecto", integrante.esAdministrador)}</fieldset>
        <fieldset class="grupo-permisos"><legend>Responsabilidades Scrum</legend><p>Describen la contribución de la persona al Scrum Team. No conceden permisos técnicos.</p>
          ${opcion("esProductOwner", "Product Owner", "Responsable del valor del producto", integrante.esProductOwner)}
          ${opcion("esScrumMaster", "Scrum Master", "Facilita Scrum y ayuda al equipo", integrante.esScrumMaster)}
          ${opcion("esDeveloper", "Developer", "Participa en la creación del incremento", integrante.esDeveloper)}
        </fieldset>
         <p class="panel-equipo__estado" data-estado-panel aria-live="polite"></p>
         <footer class="panel-equipo__acciones"><button class="boton boton--peligro" type="button" data-retirar-integrante>Retirar del proyecto</button><button class="boton boton--secundario" type="button" data-cerrar-panel>Cancelar</button><button class="boton boton--principal" type="submit">Guardar cambios</button></footer>
      </form>
    </aside>`;
}

function renderizarPanelDod(definitionOfDone) {
  return `
    <div class="panel-equipo__fondo" data-cerrar-panel></div>
    <aside class="panel-equipo" role="dialog" aria-modal="true" aria-labelledby="titulo-panel-equipo">
      <header class="panel-equipo__cabecera"><div><p>Acuerdo del proyecto</p><h2 id="titulo-panel-equipo">Editar Definition of Done</h2></div>${botonCerrar()}</header>
      <form class="panel-equipo__formulario" data-formulario-dod novalidate>
        <p class="panel-equipo__introduccion">Define las condiciones comunes que debe cumplir el trabajo para considerarse terminado.</p>
        <div class="campo-equipo"><label for="criterios-dod">Criterios <span>Uno por línea</span></label><textarea id="criterios-dod" name="definitionOfDone" rows="9" placeholder="Código revisado por otro integrante&#10;Pruebas ejecutadas correctamente">${escaparHtml(definitionOfDone)}</textarea><span class="campo-equipo__ayuda">Los cambios se aplicarán a futuros Sprints; no modificarán los que ya estén activos o finalizados.</span><span class="campo-equipo__error" data-error-dod></span></div>
        <p class="panel-equipo__estado" data-estado-panel aria-live="polite"></p>
        <footer class="panel-equipo__acciones"><button class="boton boton--secundario" type="button" data-cerrar-panel>Cancelar</button><button class="boton boton--principal" type="submit">Guardar Definition of Done</button></footer>
      </form>
    </aside>`;
}

function botonCerrar() {
  return `<button class="boton-icono-equipo" type="button" data-cerrar-panel aria-label="Cerrar panel"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"></path></svg></button>`;
}

export async function inicializarEquipo(contenedor, projectId, puedeAdministrar) {
  sesiones.get(contenedor)?.abort();
  const sesion = new AbortController();
  sesiones.set(contenedor, sesion);
  let equipo = await obtenerEquipo(projectId);
  let ultimoFoco = null;

  function renderizar() {
    contenedor.innerHTML = `
      <section class="equipo" aria-labelledby="titulo-equipo">
        <header class="encabezado-equipo"><div><h1 id="titulo-equipo">Equipo</h1><p>Consulta quién participa, cómo contribuye al Scrum Team y los acuerdos compartidos del proyecto.</p></div>${puedeAdministrar ? `<button class="boton boton--principal" type="button" data-invitar><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 16v-2.1c0-1.8 2.1-3.2 5-3.2 1.1 0 2 .2 2.8.5M14.5 9.5v6M11.5 12.5h6"></path></svg>Invitar integrante</button>` : ""}</header>
        <div class="equipo__guia" role="note"><span><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.8 14.5 5v3.8c0 3.2-2.2 5.3-5.5 6.5-3.3-1.2-5.5-3.3-5.5-6.5V5z"></path></svg><strong>Administrador técnico</strong> gestiona el proyecto</span><span aria-hidden="true"></span><span><strong>Responsabilidades Scrum</strong> definen la contribución al equipo</span></div>
         <section class="equipo-bloque equipo-bloque--integrantes" aria-labelledby="titulo-integrantes"><div class="equipo-bloque__cabecera"><div><h2 id="titulo-integrantes">Integrantes</h2><p>${equipo.members.filter((integrante) => integrante.activo).length} ${equipo.members.filter((integrante) => integrante.activo).length === 1 ? "persona participa" : "personas participan"} en este proyecto</p></div></div><div class="integrantes-cabecera" aria-hidden="true"><span>Persona</span><span>Acceso técnico</span><span>Responsabilidades Scrum</span><span></span></div><div class="integrantes-lista">${renderizarIntegrantes(equipo.members, puedeAdministrar)}</div></section>
        <div class="equipo__columnas">
          <section class="equipo-bloque" aria-labelledby="titulo-invitaciones"><div class="equipo-bloque__cabecera"><div><h2 id="titulo-invitaciones">Invitaciones</h2><p>Accesos pendientes de respuesta</p></div><span class="conteo-equipo">${equipo.pendingInvitations.length}</span></div><div data-lista-invitaciones>${renderizarInvitaciones(equipo.pendingInvitations)}</div></section>
          <section class="equipo-bloque equipo-bloque--dod" aria-labelledby="titulo-dod"><div class="equipo-bloque__cabecera"><div><h2 id="titulo-dod">Definition of Done</h2><p>Acuerdo de calidad vigente para futuros Sprints</p></div>${puedeAdministrar ? `<button class="accion-texto" type="button" data-editar-dod>Editar</button>` : ""}</div><div data-contenido-dod>${renderizarDod(equipo.definitionOfDone)}</div></section>
        </div>
        <p class="equipo__estado" data-estado-equipo role="status" aria-live="polite"></p><div data-panel-equipo></div>
      </section>`;
  }

  function anunciar(mensaje) {
    const estado = contenedor.querySelector("[data-estado-equipo]");
    if (!estado) return;
    estado.textContent = mensaje;
    window.setTimeout(() => { if (estado.textContent === mensaje) estado.textContent = ""; }, 4000);
  }

  function abrirPanel(contenidoPanel, selectorFoco) {
    ultimoFoco = document.activeElement;
    contenedor.querySelector("[data-panel-equipo]").innerHTML = contenidoPanel;
    document.body.classList.add("panel-equipo-abierto");
    contenedor.querySelector(selectorFoco)?.focus();
  }

  function cerrarPanel() {
    const panel = contenedor.querySelector("[data-panel-equipo]");
    if (panel) panel.innerHTML = "";
    document.body.classList.remove("panel-equipo-abierto");
    ultimoFoco?.focus();
  }

  function mostrarError(mensaje) {
    const estado = contenedor.querySelector("[data-estado-panel]");
    if (estado) {
      estado.textContent = mensaje;
      estado.classList.add("panel-equipo__estado--error");
    }
  }

  function manejarTeclado(evento) {
    const panel = contenedor.querySelector(".panel-equipo");
    if (!panel) return;
    if (evento.key === "Escape") {
      cerrarPanel();
      return;
    }
    if (evento.key !== "Tab") return;
    const controles = [...panel.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled])")];
    if (evento.shiftKey && document.activeElement === controles[0]) {
      evento.preventDefault();
      controles.at(-1).focus();
    } else if (!evento.shiftKey && document.activeElement === controles.at(-1)) {
      evento.preventDefault();
      controles[0].focus();
    }
  }

  renderizar();
  document.addEventListener("keydown", manejarTeclado, { signal: sesion.signal });

  contenedor.addEventListener("click", async (evento) => {
    if (evento.target.closest("[data-cerrar-panel]")) cerrarPanel();
    if (evento.target.closest("[data-invitar]")) abrirPanel(renderizarPanelInvitacion(), "#correo-invitado");
    if (evento.target.closest("[data-editar-dod]")) abrirPanel(renderizarPanelDod(equipo.definitionOfDone), "#criterios-dod");
    const editar = evento.target.closest("[data-editar-integrante]");
    if (editar) {
      const integrante = equipo.members.find((item) => item.miembroProyectoId === Number(editar.dataset.editarIntegrante));
      abrirPanel(renderizarPanelIntegrante(integrante), "[name='esAdministrador']");
    }
    if (evento.target.closest("[data-retirar-integrante]")) {
      const formulario = contenedor.querySelector("[data-formulario-integrante]");
      const integrante = equipo.members.find((item) => item.miembroProyectoId === Number(formulario?.dataset.memberId));
      if (!integrante || !window.confirm(`¿Retirar a ${integrante.usuario.nombre} del proyecto?`)) return;
      try {
        await retirarIntegrante(projectId, integrante.miembroProyectoId);
        equipo = await obtenerEquipo(projectId);
        cerrarPanel();
        renderizar();
        anunciar("Integrante retirado del proyecto");
      } catch (error) {
        mostrarError(error.message);
      }
    }
  }, { signal: sesion.signal });

  contenedor.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const boton = evento.submitter;
    boton.disabled = true;

    try {
      if (evento.target.matches("[data-formulario-invitacion]")) {
        const correo = evento.target.elements.correo.value.trim();
        const errorCorreo = contenedor.querySelector("[data-error-correo]");
        errorCorreo.textContent = "";
        if (!correo || !evento.target.elements.correo.validity.valid) {
          errorCorreo.textContent = "Ingresa un correo válido.";
          evento.target.elements.correo.focus();
          return;
        }
        await crearInvitacion(projectId, { correo });
        equipo = await obtenerEquipo(projectId);
        cerrarPanel();
        renderizar();
        anunciar("Invitación creada correctamente");
      }

      if (evento.target.matches("[data-formulario-integrante]")) {
        const campos = evento.target.elements;
        await actualizarIntegrante(projectId, evento.target.dataset.memberId, {
          esAdministrador: campos.esAdministrador.checked,
          esProductOwner: campos.esProductOwner.checked,
          esScrumMaster: campos.esScrumMaster.checked,
          esDeveloper: campos.esDeveloper.checked
        });
        equipo = await obtenerEquipo(projectId);
        cerrarPanel();
        renderizar();
        anunciar("Equipo y acuerdos actualizados correctamente");
      }

      if (evento.target.matches("[data-formulario-dod]")) {
        const valor = evento.target.elements.definitionOfDone.value;
        const criterios = valor.split("\n").map((criterio) => criterio.trim()).filter(Boolean);
        const errorDod = contenedor.querySelector("[data-error-dod]");
        errorDod.textContent = "";
        if (!criterios.length) {
          errorDod.textContent = "Agrega al menos un criterio para la Definition of Done.";
          evento.target.elements.definitionOfDone.focus();
          return;
        }
        await actualizarDefinitionOfDone(projectId, criterios.join("\n"));
        equipo = await obtenerEquipo(projectId);
        cerrarPanel();
        renderizar();
        anunciar("Definition of Done actualizada correctamente");
      }
    } catch (error) {
      mostrarError(error.message || "No fue posible completar la operación. Inténtalo nuevamente.");
    } finally {
      if (boton.isConnected) boton.disabled = false;
    }
  }, { signal: sesion.signal });
}
