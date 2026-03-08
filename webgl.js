window.sierpinskiSettings = {
    iterations: 5,
    canvasBg: '#000000',
    c1: '#ff0000',
    c2: '#00ff00',
    c3: '#0000ff'
};

const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  varying lowp vec4 vColor;
  void main() {
    gl_Position = aVertexPosition;
    vColor = aVertexColor;
  }
`;

const fsSource = `
  varying lowp vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

class Point {
  constructor(x, y, rgbArray) {
    this.x = x;
    this.y = y;
    this.color = rgbArray;
  }
}

class Triangle {
  constructor(point1, point2, point3) {
    this.p1 = point1  // bottom left
    this.p2 = point2  // top middle
    this.p3 = point3  // bottom right
  }

  static midpoint(pointA, pointB) {
    const xMidpoint = (pointA.x + pointB.x) / 2
    const yMidpoint = (pointA.y + pointB.y) / 2

    const red = (pointA.color[0] + pointB.color[0]) / 2
    const green = (pointA.color[1] + pointB.color[1]) / 2
    const blue = (pointA.color[2] + pointB.color[2]) / 2

    let rgbArray = [red, green, blue]

    return new Point(xMidpoint, yMidpoint, rgbArray)
  }
}

function sierpinski(triangleObj, depth) {
  if (depth <= 0) {
    return [triangleObj]
  }

  const mp12 = Triangle.midpoint(triangleObj.p1, triangleObj.p2)
  const mp13 = Triangle.midpoint(triangleObj.p1, triangleObj.p3)
  const mp23 = Triangle.midpoint(triangleObj.p2, triangleObj.p3)

  var triangleBL = new Triangle(
    triangleObj.p1,
    mp12,
    mp13
  )

  var triangleTM = new Triangle(
    mp12,
    triangleObj.p2,
    mp23
  )

  var triangleBR = new Triangle(
    mp13,
    mp23,
    triangleObj.p3
  )

  var subTriangles = [triangleBL, triangleTM, triangleBR]

  let allTriangles = [];
  subTriangles.forEach(s => allTriangles.push(...sierpinski(s, depth - 1)));
  return allTriangles;
}

function hexToRgb(hex) {
  // takes in hex triplet, converts it to 0-255, then drops it to decimal for webgl
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function flattenTrianglesToPoints(triangles) {
  const coords = [];
  triangles.forEach(tri => {
    coords.push(tri.p1.x, tri.p1.y);
    coords.push(tri.p2.x, tri.p2.y);
    coords.push(tri.p3.x, tri.p3.y);
  });
  return new Float32Array(coords);
}

function flattedTrianglesToColourArray(triangles) {
  const colors = [];

  triangles.forEach(tri => {
    [tri.p1, tri.p2, tri.p3].forEach(p => {
      colors.push(...p.color);
    });
  });

    return new Float32Array(colors)
}


// Helper to compile shaders
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function init_canvas(gl, settings) {

  const baseTriangle = new Triangle(
    new Point(-0.8, -0.8, hexToRgb(settings.c1)),
    new Point(0, 0.8, hexToRgb(settings.c2)),
    new Point(0.8, -0.8, hexToRgb(settings.c3))
  );

  const numberOfIterations = settings.iterations

  var allTrianglesToDraw = sierpinski(baseTriangle, numberOfIterations)
  var allPoints = flattenTrianglesToPoints(allTrianglesToDraw)
  var colourArray = flattedTrianglesToColourArray(allTrianglesToDraw)

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, allPoints, gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colourArray, gl.STATIC_DRAW);

  return { positionBuffer, colorBuffer, allPoints };
}



function main() {
  const canvas = document.querySelector("#gl-canvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const posLoc = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  const colLoc = gl.getAttribLocation(shaderProgram, 'aVertexColor');

  const settings = window.sierpinskiSettings
  const buffers = init_canvas(gl, settings)

  gl.useProgram(shaderProgram);


  let canvas_background = hexToRgb(settings.canvasBg)

  let canvasBG_r = canvas_background[0];
  let canvasBG_g = canvas_background[1];
  let canvasBG_b = canvas_background[2];

  gl.clearColor(canvasBG_r, canvasBG_g, canvasBG_b, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Connect Position Buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posLoc);

  // Connect Color Buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colLoc);

  gl.drawArrays(gl.TRIANGLES, 0, buffers.allPoints.length / 2);

}


window.onload = function () {
  main();
};
