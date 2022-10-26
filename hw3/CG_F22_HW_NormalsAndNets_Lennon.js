"use strict"; // Enforce typing in javascript

var canvas; // Drawing surface
var gl; // Graphics context

var axis = 0; // Currently active axis of rotation
var xAxis = 0; //  Will be assigned on of these codes for
var yAxis = 1; //
var zAxis = 2;

var theta = [0, 0, 0]; // Rotation angles for x, y and z axes
var thetaLoc; // Holds shader uniform variable location
var delta = [0, 0, 0]; // Translation units for x, y, and z axes
var deltaLoc; // Holds shader uniform variable location
var flag = true; // Toggle Rotation Control

var points = [
  // Use Javascript typed arrays

  // Tetrahedron
  vec3(0.0, 0.0, 1.0),
  vec3(1.0, 0.0, 0.0),
  vec3(-0.5, 0.866, 0.0),

  vec3(1.0, 0.0, 0.0),
  vec3(-0.5, 0.866, 0.0),
  vec3(-0.5, -0.866, 0.0),

  vec3(-0.5, 0.866, 0.0),
  vec3(-0.5, -0.866, 0.0),
  vec3(0.0, 0.0, 1.0),

  vec3(0.0, 0.0, 1.0),
  vec3(1.0, 0.0, 0.0),
  vec3(-0.5, -0.866, 0.0),

  // Trace back to starting point
  // 0.5, -0.5,  -0.5,
  // -0.5,-0.5, -0.5
];

var colors = new Float32Array([
  1.0,
  0.0,
  0.0,
  1.0,
  1.0,
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  0.0,
  1.0,
  1.0,
  0.0,
  0.0,
  1.0,
  1.0,
  0.0,
  0.0,
  0.0,
  1.0, // black
  1.0,
  0.0,
  0.0,
  1.0, // red
  1.0,
  1.0,
  0.0,
  1.0, // yellow
  0.0,
  1.0,
  0.0,
  1.0, // green
  1.0,
  1.0,
  1.0,
  1.0, // white
  0.0,
  0.0,
  1.0,
  1.0, // blue
  1.0,
  0.0,
  1.0,
  1.0, // magenta
  1.0,
  1.0,
  1.0,
  1.0, // white
  0.0,
  1.0,
  1.0,
  1.0, // cyan
  0.0,
  0.0,
  0.0,
  1.0, // black
  1.0,
  0.0,
  0.0,
  1.0, // red
  1.0,
  1.0,
  0.0,
  1.0, // yellow
  0.0,
  1.0,
  0.0,
  1.0, // green
  1.0,
  1.0,
  1.0,
  1.0, // white
  0.0,
  0.0,
  1.0,
  1.0, // blue
  1.0,
  1.0,
  0.0,
  1.0, // yellow
  0.0,
  1.0,
  0.0,
  1.0, // green
  1.0,
  1.0,
  1.0,
  1.0, // white
  0.0,
  0.0,
  1.0,
  1.0, // blue
]);

const dist = (p0, p1) => {
  const dx = Math.abs(p0[0] - p1[0]);
  const dy = Math.abs(p0[1] - p1[1]);
  const dz = Math.abs(p0[2] - p1[2]);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const getCrossProduct = (startIdx) => {
  const p0 = points[startIdx];
  const p1 = points[startIdx + 1];
  const p2 = points[startIdx + 2];
  console.log("Finding cp of", p0, p1, p2);

  const A = vec3(p0[0] - p1[0], p0[1] - p1[1], p0[2] - p1[2]);
  const B = vec3(p0[0] - p2[0], p0[1] - p2[1], p0[2] - p2[2]);

  console.log("A:", A, "B:", B);

  const cp = vec3(
    A[1] * B[2] - A[2] * B[1],
    A[2] * B[0] - A[0] * B[2],
    A[0] * B[1] - A[1] * B[0]
  );
  console.log("cp: " + cp);

  return cp;
};

const getCenterOfTriangle = (startIdx) => {
  const p0 = points[startIdx];
  const p1 = points[startIdx + 1];
  const p2 = points[startIdx + 2];
  console.log("Finding center of", p0, p1, p2);

  const center = vec3(
    (p0[0] + p1[0] + p2[0]) / 3,
    (p0[1] + p1[1] + p2[1]) / 3,
    (p0[2] + p1[2] + p2[2]) / 3
  );
  console.log("center:", center);
  return center;
};

const appendNormals = () => {
  const len = points.length;
  for (let i = 0; i < len; i += 3) {
    console.log("----------------");
    const cp = getCrossProduct(i);
    const center = getCenterOfTriangle(i);

    const normalStart = center;
    const normalEnd = vec3(
      cp[0] + center[0],
      cp[1] + center[1],
      cp[2] + center[2]
    );
    console.log("normalStart:", normalStart);
    console.log("normalEnd:", normalEnd);

    points = [...points, normalStart, normalEnd];
  }
};

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // Calculate normals and append to points array

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // cube color array atrribute buffer

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Append normals to the points array then change the array to Float32Array
  console.log("Points without normals", points);
  appendNormals();
  console.log("Points with normals", points);
  points = new Float32Array(flatten(points));

  // vertex position array atrribute buffer

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  //gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  thetaLoc = gl.getUniformLocation(program, "uTheta");
  deltaLoc = gl.getUniformLocation(program, "uDelta");
  //event listeners for buttons

  document.getElementById("xButton").onclick = function () {
    axis = xAxis;
  };
  document.getElementById("yButton").onclick = function () {
    axis = yAxis;
  };
  document.getElementById("zButton").onclick = function () {
    axis = zAxis;
  };
  document.getElementById("ButtonT").onclick = function () {
    flag = !flag;
  };

  document.getElementById("xSlide").onchange = function () {
    delta[0] = event.srcElement.value;
  };
  document.getElementById("ySlide").onchange = function () {
    delta[1] = event.srcElement.value;
  };
  document.getElementById("zSlide").onchange = function () {
    delta[2] = event.srcElement.value;
  };
  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (flag) theta[axis] += 0.017; // Increment rotation of currently active axis of rotation in radians

  let deltaPoints = new Float32Array([delta[0], delta[1], delta[2], 0.0]);

  gl.uniform3fv(thetaLoc, [0, 0, 0]); // Update uniform in vertex shader with new rotation angle
  gl.uniform4fv(deltaLoc, [0, 0, 0, 0]); // Update uniform in vertex shader with new rotation angle
  gl.uniform4fv(deltaLoc, deltaPoints);
  gl.uniform3fv(thetaLoc, theta); // Update uniform in vertex shader with new rotation angle
  // gl.drawArrays(gl.TRIANGLES, 0, 12); // Try changing the primitive type
  gl.drawArrays(gl.LINES, 11, 8); // Try changing the primitive type

  requestAnimationFrame(render); // Call to browser to refresh display
}

console.log(flatten(points));
