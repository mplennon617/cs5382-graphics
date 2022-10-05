"use strict"; // Enforce typing in javascript

var canvas; // Drawing surface
var gl; // Graphics context

var pedestalProgram; // GL Program for drawing the pedestal.
var scienceProgram; // GL Program for drawing the Do Science effect.

var t = 0; // Define t steps during the render process.

var axis = 1; // Currently active axis of rotation
var xAxis = 0; //  Will be assigned on of these codes for
var yAxis = 1; //
var zAxis = 2;

var theta = [-1.65, 0.0, 0.0]; // Rotation angles for x, y and z axes
var thetaLoc; // Holds shader uniform variable location
var delta = [0, 0, 0]; // Translation units for x, y, and z axes
var deltaLoc; // Holds shader uniform variable location
var flag = true; // Toggle Rotation Control
var dir = false; // Toggle Rotation Direction
var uColorLoc; // Uniform for Color shading.
var uOffsetLoc; // Uniform for point offsets.
var uPointSizeLoc; // Uniform for point size.

var colors = []; // List of all colors. An array of vec4s
var vertices = []; // List of all vertices. An array of vec3s
var indices = []; // List of all indices.

var numCirclePoints = 30; // Number of points used to construct each circle
var mOffset = 0;
var lOffset = 0;

var scienceCount = 0; // Number of science patterns to display

// ----------------------------------------------------------------------
//                Hardcoded Vertices (For the letters)
// ----------------------------------------------------------------------

var mVertices = [
  // Top left, going clockwise
  vec3(25, 0.1, 135 + 30),
  vec3(42, 0.1, 135 + 30),
  vec3(48, 0.1, 135 + 30),
  vec3(65, 0.1, 98 + 30),
  vec3(82, 0.1, 135 + 30),
  vec3(88, 0.1, 135 + 30),
  vec3(105, 0.1, 135 + 30),
  vec3(105, 0.1, 63 + 30),
  vec3(88, 0.1, 63 + 30),
  vec3(88, 0.1, 115 + 30),
  vec3(71, 0.1, 77 + 30),
  vec3(59, 0.1, 77 + 30),
  vec3(42, 0.1, 116 + 30),
  vec3(44, 0.1, 63 + 30),
  vec3(25, 0.1, 63 + 30),
];

var lVertices = [
  vec3(124, 0.1, 135 + 30),
  vec3(142, 0.1, 135 + 30),
  vec3(142, 0.1, 77 + 30),
  vec3(175, 0.1, 77 + 30),
  vec3(175, 0.1, 63 + 30),
  vec3(142, 0.1, 63 + 30),
  vec3(124, 0.1, 63 + 30),
];

// Starting Index: 192
// Parallel M starts at 207
// End Index: 221
var mIndices = [
  // Front Face
  192,
  206,
  205,
  193,
  255,
  193,
  204,
  194,
  255,
  194,
  204,
  203,
  195,
  255,
  195,
  202,
  203,
  255,
  195,
  196,
  201,
  202,
  255,
  196,
  197,
  201,
  255,
  197,
  198,
  199,
  200,
  255,

  // Back Face
  192 + 15,
  206 + 15,
  205 + 15,
  193 + 15,
  255,
  193 + 15,
  204 + 15,
  194 + 15,
  255,
  194 + 15,
  204 + 15,
  203 + 15,
  195 + 15,
  255,
  195 + 15,
  202 + 15,
  203 + 15,
  255,
  195 + 15,
  196 + 15,
  201 + 15,
  202 + 15,
  255,
  196 + 15,
  197 + 15,
  201 + 15,
  255,
  197 + 15,
  198 + 15,
  199 + 15,
  200 + 15,
  255,

  // Connecting Front and Back Faces
  192,
  194,
  209,
  207,
  255,
  194,
  195,
  195 + 15,
  194 + 15,
  255,
  196,
  195,
  195 + 15,
  196 + 15,
  255,
  196,
  198,
  198 + 15,
  196 + 15,
  255,
  198,
  199,
  214,
  213,
  255,
  200,
  199,
  214,
  215,
  255,
  201,
  200,
  215,
  216,
  255,
  201,
  202,
  217,
  216,
  255,
  203,
  202,
  217,
  218,
  255,
  204,
  203,
  218,
  219,
  255,
  204,
  205,
  220,
  219,
  255,
  206,
  205,
  220,
  221,
  255,
];

// Starting Index: 222
// Parallel L starts at 229
// End Index: 235
var lIndices = [
  // Front Face
  222,
  223,
  227,
  228,
  255,
  224,
  225,
  226,
  228,
  255,

  // Back Face
  222 + 7,
  223 + 7,
  227 + 7,
  228 + 7,
  255,
  224 + 7,
  225 + 7,
  226 + 7,
  228 + 7,
  255,

  // Connecting Front and Back Faces
  222,
  227,
  234,
  229,
  255,
  223,
  222,
  229,
  230,
  255,
  223,
  224,
  231,
  230,
  255,
  224,
  225,
  232,
  231,
  255,
  225,
  226,
  233,
  232,
  255,
  228,
  226,
  233,
  235,
  255,
];

// ----------------------------------------------------------------------
//                           Fill Functions
// ----------------------------------------------------------------------

/**
 * Fills the global color array with the given vector.
 * @param {vec4} colorVec - The color to fill the vector with (RGBA)
 * @param {Array} vertices - The vertices to tie the color to (used for length)
 */
const fillColor = (colorVec, vertices) => {
  const len = vertices.length;
  const colorArr = Array(len).fill(colorVec);
  colors = colors.concat(colorArr);
};

/**
 * Fills the global vertices array with the given vertices.
 * @param {Array} newVertices - The vertices to add to the global array
 */
const fillVertices = (newVertices) => {
  vertices = vertices.concat(newVertices);
};

/**
 * Fills the global indices array with the given indices. Each entry indexes to vertices in the global vertices array.
 * @param {Array} newIndices - The indices to add to the global array
 */
const fillIndices = (newIndices) => {
  indices = indices.concat([...newIndices, 255]);
};

// ----------------------------------------------------------------------
//         Utility functions for calculating vertices and indices
// ----------------------------------------------------------------------
/**
 * Gets vertices for the M defined above in clip space.
 * @returns array of vertex locations in clip space.
 */

const getMVertices = () => {
  let transformedM = mVertices.map((x) => [
    x[0] / 100 - 1,
    x[1],
    x[2] / 100 - 1,
  ]);

  return transformedM;
};

/**
 * Gets vertices for the L defined above in clip space.
 * @returns array of vertex locations in clip space.
 */
const getLVertices = () => {
  let transformedL = lVertices.map((x) => [
    x[0] / 100 - 1,
    x[1],
    x[2] / 100 - 1,
  ]);

  return transformedL;
};

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
  points.push(vec3(x, y, z));
  for (let i = 0; i <= numPoints; i++) {
    points.push(
      vec3(
        radius * Math.cos((i * 2 * Math.PI) / numPoints) + x,
        radius * Math.sin((i * 2 * Math.PI) / numPoints) + y,
        z
      )
    );
  }
  return points;
};

/**
 * Duplicates a shape, defining vertices for a new shape. Effectively creates two parallel shapes.
 *
 * @param {Array} shape - Array of vec3s containing the shape to duplicate.
 * @param {*} len - The distance between the two parallel shapes.
 * @param {*} direction - The axis to duplicate the shape.
 */
const getParallelVertices = (shape, len = 1, dir = "z") => {
  // Extrude in the negative direction if direction is set to false

  let extrudedShape = [];
  // Create parallel extruded shape
  if (dir === "z") {
    extrudedShape = shape.map((x) => [x[0], x[1], x[2] + len]);
  } else if (dir === "y") {
    extrudedShape = shape.map((x) => [x[0], x[1] + len, x[2]]);
  } else {
    extrudedShape = shape.map((x) => [x[0] + len, x[1], x[2]]);
  }

  let parallelShapes = shape.concat(extrudedShape);

  return parallelShapes;
};

/**
 * Utility function for returing the indices used to connect 2 parallel circles.
 * Defines the height of a cylinder.
 *
 * @param {int} indicesOffset - Wherre to begin connecting circles from the global indices array.
 * @param {int} numPoints - number of points for each circle.
 * @returns the modified indices array.
 */
const connectParallelCylinders = (indicesOffset, numPoints) => {
  let indices = [];

  let circle2Idx = numPoints + 1;

  for (let i = indicesOffset; i <= indicesOffset + numPoints; i++) {
    indices = indices.concat([
      i,
      i + 1,
      i + circle2Idx + 1,
      i + circle2Idx,
      255,
    ]);
  }

  return indices;
};

// ----------------------------------------------------------------------
//                       Other Utility Functions
// ----------------------------------------------------------------------

/**
 * Utility function to return an array from [start, end].
 * (e.g. Python's range function)
 *
 * @param {int} start - start of the range, inclusive.
 * @param {int} end  - end of the range, inclusive.
 * @returns Array from [start, end].
 */
const range = (start, end) => {
  let arr = [];

  for (var i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
};

// ----------------------------------------------------------------------
//                     GL pedestalProgram and Shader Setup
// ----------------------------------------------------------------------

/**
 * Intializes shaders and bufferData.
 */
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.PRIMITIVE_RESTART_FIXED_INDEX);

  //
  //  Load shaders and initialize attribute buffers
  //
  pedestalProgram = initShaders(gl, "vertex-shader-p", "fragment-shader-p");
  gl.useProgram(pedestalProgram);

  scienceProgram = initShaders(gl, "vertex-shader-s", "fragment-shader-s");

  // Fill colors and vertices arrays with all the shapes.
  let cyl1 = getParallelVertices(
    getCirclePoints(0, 0, -0.5, 0.5, numCirclePoints),
    0.2
  );
  let cyl2 = getParallelVertices(
    getCirclePoints(0, 0, -0.5 + 0.21, 0.6, numCirclePoints),
    0.1
  );
  let cyl3 = getParallelVertices(
    getCirclePoints(0, 0, -0.5 + -0.11, 0.6, numCirclePoints),
    0.1
  );
  let m = getParallelVertices(getMVertices(), -0.2, "y"); // Vertices -- Indices 104 to 134
  let l = getParallelVertices(getLVertices(), -0.2, "y"); // Vertices -- Indices 135 to 149

  fillVertices(cyl1);
  fillColor(vec4(0.82, 0.71, 0.54, 1.0), cyl1);
  fillVertices(cyl2);
  fillColor(vec4(0.21, 0.15, 0.08, 1.0), cyl2);
  fillVertices(cyl3);
  fillColor(vec4(0.21, 0.15, 0.08, 1.0), cyl3);
  fillVertices(m);
  fillColor(vec4(1.0, 0.0, 0.0, 1.0), m);
  fillVertices(l);
  fillColor(vec4(0.0, 0.0, 1.0, 1.0), l);

  // Fill indices arrays with all the triangle connections.
  let currOffset = 0;
  fillIndices(range(0, cyl1.length / 2 - 1));
  fillIndices(range(cyl1.length / 2 + 1, cyl1.length - 1));
  currOffset += cyl1.length;

  fillIndices(range(currOffset, currOffset + cyl2.length / 2 - 1));
  fillIndices(
    range(currOffset + cyl2.length / 2, currOffset + cyl2.length - 1)
  );
  currOffset += cyl2.length;

  fillIndices(range(currOffset, currOffset + cyl3.length / 2 - 1));
  fillIndices(
    range(currOffset + cyl3.length / 2, currOffset + cyl3.length - 1)
  );

  fillIndices(connectParallelCylinders(0, numCirclePoints));
  fillIndices(connectParallelCylinders(cyl1.length + 1, numCirclePoints));
  fillIndices(
    connectParallelCylinders(cyl1.length + cyl2.length + 1, numCirclePoints)
  );

  fillIndices(mIndices);
  fillIndices(lIndices);

  // Prepare colors, vertices, and indices to be fed into the graphics pipeline.
  colors = flatten(colors);
  vertices = flatten(vertices);
  indices = new Uint8Array(indices);

  // Bind vertex colors (COLORS) to the gl array buffer.
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(pedestalProgram, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Bind vertex positions (VERTICES)  to the gl array buffer.
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Bind topology (INDICES) to the gl element array buffer.
  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(pedestalProgram, "aPosition");
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Define uniforms for pedestal translation and rotation.
  thetaLoc = gl.getUniformLocation(pedestalProgram, "uTheta");
  deltaLoc = gl.getUniformLocation(pedestalProgram, "uDelta");

  // Define uniforms for Science! (Point size, color, and offset)
  uColorLoc = gl.getUniformLocation(scienceProgram, "uColor");
  uOffsetLoc = gl.getUniformLocation(scienceProgram, "uOffset");
  uPointSizeLoc = gl.getUniformLocation(scienceProgram, "uPointSize");

  // Event Listeners for all buttons.
  document.getElementById("xButton").onclick = function () {
    axis = xAxis;
  };
  document.getElementById("yButton").onclick = function () {
    axis = yAxis;
  };
  document.getElementById("zButton").onclick = function () {
    axis = zAxis;
  };
  document.getElementById("ButtonC").onclick = function () {
    dir = !dir;
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
  document.getElementById("sciButton").onclick = function () {
    scienceCount++;
  };
  render();
};

var x;
var y;
var z;
var t;
var size;
var b;
var r;

/**
 * Render function.
 */
function render() {
  gl.useProgram(pedestalProgram);
  t += 0.01;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Handles rotation of the pedestal.
  // Define controls for speed and direction of rotation.
  let el = document.querySelector("#speedselector");
  let speedString = el.options[el.selectedIndex].text;
  let speedMultiplier = 1;
  switch (speedString) {
    case "Slow":
      speedMultiplier = 0.5;
      break;
    case "Normal":
      speedMultiplier = 1;
      break;
    case "Fast":
      speedMultiplier = 2;
      break;
  }
  if (flag) {
    if (dir) {
      theta[axis] += 0.017 * speedMultiplier; // Increment rotation of currently active axis of rotation in radians
    } else {
      theta[axis] -= 0.017 * speedMultiplier;
    }
  }

  // Define Translation offset for the pedestal.
  let deltaPoints = new Float32Array([delta[0], delta[1], delta[2], 0.0]);

  // Draw the pedestal.
  gl.uniform4fv(deltaLoc, deltaPoints);
  gl.uniform3fv(thetaLoc, theta); // Update uniform in vertex shader with new rotation angle
  gl.drawElements(gl.TRIANGLE_FAN, indices.length, gl.UNSIGNED_BYTE, 0);

  // Do Science!
  gl.useProgram(scienceProgram);

  t = t + 0.01;
  x = (0.8 * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
  y = (0.8 * Math.cos(t) * Math.sin(t)) / (1 + Math.sin(t) * Math.sin(t));
  z = Math.sin(t);

  size = 30 + 20 * Math.sin(t);
  b = 0.1 * Math.floor(t);
  r = Math.max(0.0, 0.1 * Math.floor(t) - 1.0);

  // Offsets for science.
  gl.uniform4fv(uOffsetLoc, [x, y, z, 0.0]);
  gl.uniform1f(uPointSizeLoc, size);
  gl.uniform4fv(uColorLoc, [r, 1.0 - b, b - r, 1.0]);

  gl.drawArraysInstanced(gl.POINTS, vertices.length - 1, scienceCount, 8);

  // Render frame
  requestAnimationFrame(render); // Call to browser to refresh display
}
