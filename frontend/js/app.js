const anioActual = document.querySelector("#anio-actual");

if (anioActual) {
  anioActual.textContent = new Date().getFullYear().toString();
}
