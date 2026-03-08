function downloadCanvas() {
  const canvas = document.getElementById("gl-canvas");
  var png_string = canvas.toDataURL("image/png");
  var img_elm = document.createElement("img");
  img_elm.src = png_string;

  outputContainer = document.getElementById("output-png");
  outputContainer.appendChild(img_elm);
}
