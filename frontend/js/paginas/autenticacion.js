import { crearVistaAutenticacion } from "../componentes/formulario-autenticacion.js";

const raiz = document.querySelector("[data-auth-root]");
const tipoVista = document.body.dataset.authView;

if (raiz) {
  raiz.innerHTML = crearVistaAutenticacion(tipoVista);

  const formulario = raiz.querySelector("form");
  const estado = raiz.querySelector(".formulario__estado");
  const campos = [...formulario.elements].filter((elemento) => elemento instanceof HTMLInputElement);

  const mostrarError = (campo, mensaje) => {
    const salida = raiz.querySelector(`#${campo.id}-error`);
    campo.setAttribute("aria-invalid", mensaje ? "true" : "false");
    if (salida) salida.textContent = mensaje;
  };

  const validarCampo = (campo) => {
    let mensaje = "";

    if (campo.validity.valueMissing) {
      mensaje = "Completa este campo.";
    } else if (campo.validity.typeMismatch) {
      mensaje = "Escribe un correo válido.";
    } else if (campo.id === "confirmar-contrasena") {
      const contrasena = formulario.elements.namedItem("contrasena");
      if (campo.value !== contrasena.value) mensaje = "Las contraseñas no coinciden.";
    }

    mostrarError(campo, mensaje);
    return !mensaje;
  };

  campos.forEach((campo) => {
    campo.addEventListener("blur", () => validarCampo(campo));
    campo.addEventListener("input", () => {
      if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
      estado.textContent = "";
    });
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const formularioValido = campos.map(validarCampo).every(Boolean);

    if (!formularioValido) {
      campos.find((campo) => campo.getAttribute("aria-invalid") === "true")?.focus();
      estado.textContent = "Revisa los campos indicados.";
      return;
    }

    estado.textContent = "La conexión con el backend se habilitará próximamente.";
  });
}
