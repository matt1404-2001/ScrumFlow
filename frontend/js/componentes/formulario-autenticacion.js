const configuraciones = {
  login: {
    titulo: "Bienvenido de nuevo",
    accion: "Iniciar sesión",
    pregunta: "¿No tienes una cuenta?",
    enlace: "Crear cuenta",
    destino: "../signup/",
    campos: [
      { id: "correo", etiqueta: "Correo", tipo: "email", autocomplete: "email" },
      { id: "contrasena", etiqueta: "Contraseña", tipo: "password", autocomplete: "current-password" }
    ]
  },
  signup: {
    titulo: "Crear cuenta",
    accion: "Crear cuenta",
    pregunta: "¿Ya tienes una cuenta?",
    enlace: "Iniciar sesión",
    destino: "../login/",
    campos: [
      { id: "nombre", etiqueta: "Nombre", tipo: "text", autocomplete: "name" },
      { id: "correo", etiqueta: "Correo", tipo: "email", autocomplete: "email" },
      { id: "contrasena", etiqueta: "Contraseña", tipo: "password", autocomplete: "new-password" },
      { id: "confirmar-contrasena", etiqueta: "Confirmar contraseña", tipo: "password", autocomplete: "new-password" }
    ]
  }
};

function crearCampo({ id, etiqueta, tipo, autocomplete }) {
  return `
    <div class="campo">
      <label for="${id}">${etiqueta}</label>
      <input id="${id}" name="${id}" type="${tipo}" autocomplete="${autocomplete}" required>
      <span class="campo__error" id="${id}-error" aria-live="polite"></span>
    </div>
  `;
}

export function crearVistaAutenticacion(tipo) {
  const configuracion = configuraciones[tipo] ?? configuraciones.login;

  return `
    <section class="autenticacion__contexto" aria-label="ScrumFlow">
      <a class="marca marca--clara" href="../" aria-label="ScrumFlow, página de inicio">
        <svg class="marca__simbolo" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M7 9.5h18M7 16h12M7 22.5h7"></path>
          <circle cx="25" cy="22.5" r="2.5"></circle>
        </svg>
        <span>ScrumFlow</span>
      </a>

      <div class="autenticacion__mensaje">
        <p>Un solo flujo para acompañar el trabajo Scrum.</p>
        <ol class="recorrido" aria-label="Flujo de trabajo en ScrumFlow">
          <li class="recorrido__paso recorrido__paso--completo"><span aria-hidden="true"></span>Backlog</li>
          <li class="recorrido__paso recorrido__paso--activo"><span aria-hidden="true"></span>Sprint</li>
          <li class="recorrido__paso"><span aria-hidden="true"></span>Daily</li>
          <li class="recorrido__paso"><span aria-hidden="true"></span>Cierre</li>
        </ol>
      </div>

      <a class="volver-inicio" href="../">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H5M9 6l-4 4 4 4"></path></svg>
        Volver al inicio
      </a>
    </section>

    <section class="autenticacion__panel" aria-labelledby="titulo-autenticacion">
      <div class="formulario-autenticacion">
        <a class="marca marca--movil" href="../" aria-label="ScrumFlow, página de inicio">
          <svg class="marca__simbolo" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 9.5h18M7 16h12M7 22.5h7"></path>
            <circle cx="25" cy="22.5" r="2.5"></circle>
          </svg>
          <span>ScrumFlow</span>
        </a>

        <header class="formulario-autenticacion__cabecera">
          <h1 id="titulo-autenticacion">${configuracion.titulo}</h1>
        </header>

        <form class="formulario" novalidate>
          ${configuracion.campos.map(crearCampo).join("")}
          <p class="formulario__estado" role="status" aria-live="polite"></p>
          <button class="boton boton--principal formulario__boton" type="submit">${configuracion.accion}</button>
        </form>

        <p class="cambio-vista">
          ${configuracion.pregunta}
          <a href="${configuracion.destino}">${configuracion.enlace}</a>
        </p>
      </div>
    </section>
  `;
}
