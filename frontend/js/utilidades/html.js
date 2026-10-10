export function escaparHtml(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto ?? "";
  return elemento.innerHTML;
}

export function escaparAtributo(texto) {
  return escaparHtml(texto).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
