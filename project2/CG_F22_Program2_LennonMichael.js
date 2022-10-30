// TODO: Feature list
// 1. Create shapes: one spheres for the chain chomp head and a bunch of cubes for the chains
// 2. Ability to rotate head about chain chomp "origin", causing all chains to rotate with it
// 3. Ability for chain chomp head to "look side to side" without the chains moving
// 4. Ability for chain chomp to "jump" (sine wave jump. When the chomp returns to the ground, the chomp causes a camera shake effect and "squishes vertically"). All cubes will jump with it, given a specified delay for each cube
// 5. Projection using MVnew code
// 6. Terrain mesh
// 7. If time: Create a slider to change the length the chain chomp from the origin. Should I procedurally add/remove cubes based on the length?

"use strict"; // Enforce typing in javascript

let canvas; // Drawing surface
let gl; // Graphics context
let program; // GL Program for drawing the pedestal.
let t = 0; // Define t steps during the render process.

let axis = 1; // Currently active axis of rotation
let xAxis = 0; //  Will be assigned on of these codes for
let yAxis = 1; //
let zAxis = 2;

// Global variables representing matrices for the Model view and projection pipelines.
let modelViewMatrix;
let projectionMatrix;

// Enum - Array of rotation angles (in degrees) for each rotation axis
var Base = 0;
var Head = 1;
var Eyes = 2;

// Values set by sliders and render ticks.
let thetaView = [0.0, 0.0, 0.0]; // Rotation angles for x, y and z axes
let theta = [0, 0, 0]; // Rotation angles for the chain chomp
let delta = [0, 0, 0]; // Translation units for x, y, and z axes
let flag = true; // Toggle Rotation Control
let dir = false; // Toggle Rotation Direction

// Uniform value locations.
let thetaViewLoc; // Holds shader uniform variable location
let deltaLoc; // Holds shader uniform variable location
let uColorLoc; // Uniform for Color shading.
let uOffsetLoc; // Uniform for point offsets.
let uPointSizeLoc; // Uniform for point size.
let modelViewMatrixLoc;

// Arrays for keeping track of geometry.
let colors = []; // List of all colors. An array of vec4s
let vertices = []; // List of all vertices. An array of vec3s
let indices = []; // List of all indices.

// Constants.
const numCirclePoints = 30; // Number of points used to construct each circle
const NUM_CHAINS = 5; // Number of chains 'binding' the chain chomp to the origin.
const CHAIN_LENGTH = 5;
const CHAIN_INDICES_LENGTH = 4641;
const HEAD_INDICES_LENGTH = 12761;

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
  indices = indices.concat([...newIndices, 65535]);
};

/**
 * Fills the global color array with the given vector.
 * @param {vec4} colorVec1 - The color to fill the vector with (RGBA)
 * @param {vec4} colorVec2 - The color to fill the vector with (RGBA)
 * @param {Array} vertices - The vertices to tie the color to (used for length)
 */
const fillSphereColorGradient = (colorVec1, colorVec2, vertices) => {
  const len = vertices.length;
  let colorArr = Array(len).fill(colorVec1);
  colorArr = colorArr.map((currColorVec, idx) =>
    vec4(
      currColorVec[0] * ((len - idx) / len) +
        colorVec2[0] * ((1.0 * idx) / len),
      currColorVec[1] * ((len - idx) / len) +
        colorVec2[1] * ((1.0 * idx) / len),
      currColorVec[2] * ((len - idx) / len) +
        colorVec2[2] * ((1.0 * idx) / len),
      currColorVec[3] * ((len - idx) / len) + colorVec2[3] * ((1.0 * idx) / len)
    )
  );
  colors = colors.concat(colorArr);
};

// ----------------------------------------------------------------------
//         Utility functions for calculating vertices and indices
// ----------------------------------------------------------------------

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
const getCircleVertices = (
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
 * Returns a list of points representing a sphere.
 *
 * @param {float} x - X offset position.
 * @param {float} y - Y offset position.
 * @param {float} z - Z offset position.
 * @param {float} radius - radius of the sphere
 * @param {int} numPoints - Number of points used to draw the sphere.
 * @returns A Float32Array containing all the points of the sphere.
 */
const getSphereVertices = (
  x = 0.0,
  y = 0.0,
  z = 0.0,
  radius = 1.0,
  numCirclePoints = 50
) => {
  // Adapted and modified from demo at end of class on 10.19.22.
  let points = [];
  points.push(vec3(x, y, z));

  for (let i = 0; i <= numCirclePoints; i++) {
    for (let j = 0; j < numCirclePoints; j++) {
      const theta = (i/2/numCirclePoints) * 2 * Math.PI;
      const phi = (j/numCirclePoints) * 2 * Math.PI;
      points.push(
        vec3(
          x + radius * Math.sin(theta) * Math.cos(phi),
          y + radius * Math.sin(theta) * Math.sin(phi),
          z + radius * Math.cos(theta)
        )
      );
    }
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
const connectSphere = (verticesOffset, numCirclePoints) => {
  let indices = [];

  for (let i = 0; i < numCirclePoints; i++) {
    const currVerticesOffset = verticesOffset + i * numCirclePoints;
    for (let j = 0; j < numCirclePoints; j++) {
      indices = indices.concat([
        currVerticesOffset + j,
        currVerticesOffset + j + 1,
        currVerticesOffset + j + numCirclePoints + 1,
        currVerticesOffset + j + numCirclePoints,
        65535,
      ]);
      console.log([currVerticesOffset + j,
        currVerticesOffset + j + 1,
        currVerticesOffset + j + numCirclePoints + 1,
        currVerticesOffset + j + numCirclePoints])
    }
    indices = indices.concat([
      currVerticesOffset,
      currVerticesOffset + (numCirclePoints - 1),
      currVerticesOffset - 1,
      Math.max(0, currVerticesOffset - (numCirclePoints - 1)),
      65535,
    ]);
  }

  return indices;
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
      65535,
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

  for (let i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
};

// ----------------------------------------------------------------------
//                         Drawing Everything
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
//                     GL program and Shader Setup
// ----------------------------------------------------------------------

/**
 *
 */
const buildInstances = () => {
  let currOffset = 0;

  let chainSphere = getSphereVertices(0, 0, 0, 0.4, 30);
  fillVertices(chainSphere);
  fillSphereColorGradient(
    vec4(1, 1, 1, 1.0),
    vec4(0.67, 0.67, 0.8, 1.0),
    chainSphere
  );
  fillIndices(connectSphere(0, 30));
  console.log(vertices);

  let sphere1 = getSphereVertices(0, 0, 0, 2, 50);
  fillVertices(sphere1);
  fillSphereColorGradient(
    vec4(0.27, 0.27, 0.4, 1.0),
    vec4(0, 0, 0, 1.0),
    sphere1
  );
  fillIndices(connectSphere(931, 50));
  console.log(vertices);

  // Prepare colors, vertices, and indices to be fed into the graphics pipeline.
  colors = flatten(colors);
  vertices = flatten(vertices);
  indices = new Uint16Array(indices);
};

/**
 * Intializes shaders and bufferData.
 */
window.onload = () => {
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
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Fill colors and vertices arrays with all the shapes.
  buildInstances();

  // Bind vertex colors (COLORS) to the gl array buffer.
  const cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  const colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Bind vertex positions (VERTICES)  to the gl array buffer.
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Bind topology (INDICES) to the gl element array buffer.
  let iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Define uniforms for pedestal translation and rotation.
  thetaViewLoc = gl.getUniformLocation(program, "uThetaView");
  deltaLoc = gl.getUniformLocation(program, "uDelta");

  // Define transformation matrices for modelView and Projections.
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

  const projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  // Event Listeners for all buttons.
  document.getElementById("xButton").onclick = () => {
    axis = xAxis;
  };
  document.getElementById("yButton").onclick = () => {
    axis = yAxis;
  };
  document.getElementById("zButton").onclick = () => {
    axis = zAxis;
  };
  document.getElementById("ButtonC").onclick = () => {
    dir = !dir;
  };
  document.getElementById("ButtonT").onclick = () => {
    flag = !flag;
  };

  // document.getElementById("xSlide").onchange = () => {
  //   delta[0] = event.srcElement.value;
  // };
  // document.getElementById("ySlide").onchange = () => {
  //   delta[1] = event.srcElement.value;
  // };
  // document.getElementById("zSlide").onchange = () => {
  //   delta[2] = event.srcElement.value;
  // };

  render();
};

let x;
let y;
let z;
let size;
let b;
let r;

// ----------------------------------------------------------------------
//                            Render Functions
// ----------------------------------------------------------------------

const base = () => {
  // Draw each of the the 'chain' spheres, layering translation matrices
  // each time.
  for (let i = 0; i < NUM_CHAINS; i++) {
    let instanceMatrix = translate(
      (NUM_CHAINS + 2) * (i / NUM_CHAINS),
      0.0,
      0.0
    );
    const t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawElements(gl.TRIANGLE_FAN, CHAIN_INDICES_LENGTH, gl.UNSIGNED_SHORT, 0);
  }

  // TODO: Move the 'head' drawing to the head method.

  let instanceMatrix = translate(NUM_CHAINS + 2, 0.0, 0.0);
  const t = mult(modelViewMatrix, instanceMatrix);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawElements(gl.TRIANGLE_FAN, HEAD_INDICES_LENGTH, gl.UNSIGNED_SHORT, CHAIN_INDICES_LENGTH*2);
};

const head = () => {};

const eyes = () => {};

/**
 * Main Render function.
 */
const render = () => {
  gl.useProgram(program);
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
      thetaView[axis] += 0.017 * speedMultiplier; // Increment rotation of currently active axis of rotation in radians
    } else {
      thetaView[axis] -= 0.017 * speedMultiplier;
    }
  }

  modelViewMatrix = rotate(0, vec3(0, 1, 0));
  base();

  // Define Translation offset for the pedestal.
  let deltaPoints = new Float32Array([delta[0], delta[1], delta[2], 0.0]);

  // Draw the pedestal.
  gl.uniform4fv(deltaLoc, deltaPoints);
  gl.uniform3fv(thetaViewLoc, thetaView); // Update uniform in vertex shader with new rotation angle

  base();
  // gl.drawElements(gl.TRIANGLE_FAN, indices.length, gl.UNSIGNED_SHORT, 0);

  t = t + 0.01;
  requestAnimationFrame(render); // Call to browser to refresh display
};
