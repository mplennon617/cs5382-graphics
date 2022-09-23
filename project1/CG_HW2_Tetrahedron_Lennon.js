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

var points;
//  = new Float32Array([
//   //Use Javascript typed arrays

//   //Tetrahedron
//   0.0, 0.0, 1.0, 1.0, 0.0, 0.0, -0.5, 0.866, 0.0,

//   1.0, 0.0, 0.0, -0.5, 0.866, 0.0, -0.5, -0.866, 0.0,

//   -0.5, 0.866, 0.0, -0.5, -0.866, 0.0, 0.0, 0.0, 1.0,

//   0.0, 0.0, 1.0, 1.0, 0.0, 0.0, -0.5, -0.866, 0.0,

//   //Trace back to starting point
//   0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
// ]);

var colors = new Float32Array([1.0, 0.0, 0.0, 1.0]);

/**
 * Returns a list of points representing a circle.
 *
 * @param {float} x - X offset position.
 * @param {float} y - Y offset position.
 * @param {float} z - Z offset position.
 * @param {float} radius - radius of the circle
 * @param {int} numPoints - Number of points used to draw the circle.
 * @returns A Float32Array containing all the points of the circle.
 */
const getCirclePoints = (
  x = 0.0,
  y = 0.0,
  z = 0.0,
  radius = 1.0,
  numPoints = 50
) => {
  // Adapted and modified from James' example in the class Slack.
  let points = [];
  points.push(x, y, z);
  for (let i = 0; i <= numPoints; i++) {
    points.push(
      radius * Math.cos((i * 2 * Math.PI) / numPoints) + x,
      radius * Math.sin((i * 2 * Math.PI) / numPoints) + y,
      z
    );
  }
  return points;
};

/**
 *
 * @param {*} shape
 * @param {*} len
 * @param {*} direction
 */
const extrudeShape = (shape, len = 1, direction = true) => {
  // Extrude in the negative direction if direction is set to false
  if (direction === false) len = -len;

  // Create parallel extruded shape
  let extrudedShape = shape.map((x, idx) => (idx % 3 === 2 ? x + len : x));

  let parallelShapes = shape.concat(extrudedShape);

  
//   console.log("shape:", shape);
//   console.log("extrudedShape:", extrudedShape);
//   console.log("parallelShapes:", parallelShapes);

  // Build up topology to connect the two parallel shapes.
  let indices = [];
};

/**
 * Initalization function for the gl program.
 * Intializes shaders and bufferData.
 */
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Bind vertex COLORS to the gl array buffer.

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Bind vertex POSITIONS to the gl array buffer.

  let pointsArray = getCirclePoints();
  extrudeShape(pointsArray);
  points = new Float32Array(pointsArray);
  console.log("points:", points);

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

  gl.uniform4fv(deltaLoc, deltaPoints);
  gl.uniform3fv(thetaLoc, theta); // Update uniform in vertex shader with new rotation angle
  gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length / 3); // Try changing the primitive type

  requestAnimationFrame(render); // Call to browser to refresh display
}
