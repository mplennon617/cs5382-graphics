// Michael Lennon
// Computer Graphics Program 2
// "The Chain Critter"
// October 30, 2022

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
let nMatrix;

// Values set by sliders and render ticks.
let thetaView = [0.0, 4, 0.0]; // Rotation angles for x, y and z axes
let figureSliderVals = [0, 0, 0, 0, 0]; // Values for all user-controlled sliders
let lightSliderVals = [1, 1, 1];
let scaleSliderVal = 1;
let toggleRot = true; // Toggle Rotation Control
let dir = false; // Toggle Rotation Direction
let freeze = false; // Toggle Freeze effect (Chain chomp stops jumping)
let bigJumpState = false; // Toggle state -- is the Chomp performing a big jump?
let brightness = 0.8;

// Enum - Indices for all slider values. Used to index figureSliderVals
const Base = 0;
const HeadZ = 1;
const HeadY = 2;
const EyesX = 3;
const EyesY = 4;

// Uniform value locations.
let thetaViewLoc; // Holds shader uniform variable location
let deltaLoc; // Holds shader uniform variable location
let uColorLoc; // Uniform for Color shading.
let uOffsetLoc; // Uniform for point offsets.
let uPointSizeLoc; // Uniform for point size.

let modelViewMatrixLoc;
let nMatrixLoc;

// Arrays for keeping track of geometry.
let colors = []; // List of all colors. An array of vec4s
let vertices = []; // List of all vertices. An array of vec3s
let normals = []; // List of all vertex normals. An array of vec3s
let indices = []; // List of all indices.
let texCoords = []; // List of all texture coordinates. An array of vec2s

// Lighting and Texture constants.
let lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
let lightAmbient = vec4(0.8, 0.8, 0.8, 1.0);
let lightDiffuse = vec4(0.2, 0.3, 0.2, 1.0); // NOTE: Green diffuse component is a little higher
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

const materialDiffuse = vec4(0.15, 0.15, 0.15, 1.0);
const materialSpecular = vec4(0.8, 0.8, 0.8, 1.0);
const materialShininess = 20.0;

let texSize = 1024; // Size of the bump map image.

// Other Constants.
const numCirclePoints = 30; // Number of points used to construct each circle FIXME: This cannot be changed, unfortunately, due to other hardcoded constraints
const NUM_CHAINS = 10; // Number of chains 'binding' the chain chomp to the origin.
const NUM_CHAIN_POINTS = 30; // Number of points used to construct each circular XY cross section in each chain sphere.
const NUM_HEAD_POINTS = 50; // Number of points used to construct each circular XY cross section in the head sphere.
const NUM_MESH_POINTS = 20;
const CHAIN_INDICES_LENGTH = 4641; // The number of elements in indices taken up by the chain sphere.
const HEAD_INDICES_LENGTH = 12761 - 8; // The number of elements in indices taken up by the head sphere.
const EYES_INDICES_LENGTH = 228; // The number of elements in indices taken up by the eye cylinder.
const MESH_INDICES_LENGTH = 1806; // The number of elements in indices taken up by the 2D grass mesh.
const CHAIN_SPEED = 8; // The speed at which the chain chomp bounces up and down.
const LOOKING_DISTANCE = 0.5; // The distance that the eyes can translate relative to the center of the head.
const HEAD_SQUISH = 0.8; // The amount that the head "squishes" after performing a big jump.
const MESH_SCALE = 0.3; // The amount of random variation in the Y direction for the 2D mesh.

let test = 0;
// -----------------------------------------------------------------------------------------------
//                                        Fill Functions
// -----------------------------------------------------------------------------------------------

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
 * Fills the global vertices array with the given vertices.
 * @param {Array} newNormals - The normals to add to the global array
 */
const fillTexCoords = (newTexCoords) => {
  texCoords = texCoords.concat(newTexCoords); // #NewNormal
};

/**
 * Fills the global vertices array with the given vertices.
 * @param {Array} newNormals - The normals to add to the global array
 */
const fillNormals = (newNormals) => {
  normals = normals.concat(newNormals); // #NewNormal
};

/**
 * Fills the global indices array with the given indices. Each entry indexes to vertices in the global vertices array.
 * @param {Array} newIndices - The indices to add to the global array
 */
const fillIndices = (newIndices) => {
  indices = indices.concat([...newIndices, 65535]);
};

/**
 * Fills the global color array by linearly interpolating 2 color vectors.
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

// -----------------------------------------------------------------------------------------------
//                      Utility functions for calculating vertices and indices
// -----------------------------------------------------------------------------------------------

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

  let cylinderVertexNormals = []; // FIXME: REMOVE WHEN WE GET EYES LIT CORRECTLY
  points.push(vec3(x, y, z));
  cylinderVertexNormals.push(vec4(0, 0, 1, 0)); // FIXME: REMOVE WHEN WE GET EYES LIT CORRECTLY
  cylinderVertexNormals.push(vec4(0, 0, 1, 0)); // FIXME: REMOVE WHEN WE GET EYES LIT CORRECTLY
  for (let i = 0; i <= numPoints; i++) {
    points.push(
      vec3(
        radius * Math.cos((i * 2 * Math.PI) / numPoints) + x,
        radius * Math.sin((i * 2 * Math.PI) / numPoints) + y,
        z
      )
    );
    cylinderVertexNormals.push(vec4(0, 0, 1, 0)); // FIXME: REMOVE WHEN WE GET EYES LIT CORRECTLY
    cylinderVertexNormals.push(vec4(0, 0, 1, 0)); // FIXME: REMOVE WHEN WE GET EYES LIT CORRECTLY
  }

  fillNormals(cylinderVertexNormals);
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
  let count = 0;
  for (let i = 0; i <= numCirclePoints; i++) {
    for (let j = 0; j < numCirclePoints; j++) {
      const theta = (i / 2 / numCirclePoints) * 2 * Math.PI;
      const phi = (j / numCirclePoints) * 2 * Math.PI;
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
 * Returns texture coordinates for a sphere.
 *
 * @param {float} x - X offset position.
 * @param {float} y - Y offset position.
 * @param {float} z - Z offset position.
 * @param {float} radius - radius of the sphere
 * @param {int} numPoints - Number of points used to draw the sphere.
 * @returns A Float32Array containing all the points of the sphere.
 */
const getSphereTexCoords = (numCirclePoints = 50) => {
  // Adapted and modified from demo at end of class on 10.19.22.
  let points = [];
  let count = 0;

  for (let i = 0; i <= numCirclePoints; i++) {
    for (let j = 0; j < numCirclePoints; j++) {
      points.push(vec2(j / numCirclePoints, i / numCirclePoints));
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
 * @returns A list of points representing the two duplicated shapes.
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
 * Returns a list of points representing a 2D square mesh.
 * Y values of each point are randomized with respect to MESH_SCALE.
 * @param {int} sideLength - The length of each side in clip space.
 * @param {*} numMeshLinePoints - The number of points across 1 dimension of the mesh.
 * @returns A list of points representing a 2D square mesh.
 */
const getRandomMesh = (sideLength = 1.0, numMeshLinePoints = 20) => {
  const firstIdx = vertices.length;
  // Adapted and modified from demo at end of class on 10.19.22.
  let points = [];

  for (let i = 0; i < numMeshLinePoints; i++) {
    for (let j = 0; j < numMeshLinePoints; j++) {
      points.push(
        vec3(
          i * (sideLength / numMeshLinePoints) - sideLength / 2,
          MESH_SCALE * (2 * Math.random() - 1),
          j * (sideLength / numMeshLinePoints) - sideLength / 2
        )
      );
    }
  }
  return points;
};

/**
 * Utility function for returning the indices used to connect all the points in a sphere.
 * Pre: Vertices were created using getRandomMesh.
 *
 * @param {int} verticesOffset - Wherre to begin connecting circles from the global vertices array.
 * @param {int} numPoints - number of points for each circle (2D cross section).
 * @returns the modified indices array.
 */
const getMeshVertexNormals = (verticesOffset, numMeshLinePoints) => {
  let meshVertexNormals = [];

  for (let i = 0; i < numMeshLinePoints; i++) {
    const currVerticesOffset = verticesOffset + i * numMeshLinePoints;
    for (let j = 0; j < numMeshLinePoints; j++) {
      let pC, pN, pE, pS, pW;
      let hasN, hasE, hasS, hasW;
      hasE = hasS = hasW = false;

      // Defining 4 surface reference points (along with center)
      pC = vertices[currVerticesOffset + j];
      if (i !== numMeshLinePoints - 1) {
        pN = vertices[currVerticesOffset + j + numMeshLinePoints];
        hasN = true;
      }
      if (i !== 0) {
        pS = vertices[currVerticesOffset + j - numMeshLinePoints];
        hasS = true;
      }
      if (j !== numMeshLinePoints - 1) {
        pE = vertices[currVerticesOffset + j + 1];
        hasE = true;
      }
      if (j !== 0) {
        pW = vertices[currVerticesOffset + j - 1];
        hasW = true;
      }

      // Calculate normal vectors
      let normal = vec3(0, 0, 0);

      if (hasN === true) {
        const tN = subtract(pN, pC);

        // Northeast Normal
        if (hasE === true) {
          const tE = subtract(pE, pC);
          const n1 = cross(tN, tE);
          normal = add(normal, n1);
        }
        // Northwest Normal
        if (hasW === true) {
          const tW = subtract(pW, pC);
          const n4 = cross(tN, tW);
          normal = add(normal, n4);
        }
      }
      if (hasS === true) {
        const tS = subtract(pS, pC);

        // Southeast Normal
        if (hasE === true) {
          const tE = subtract(pE, pC);
          const n2 = cross(tS, tE);
          normal = add(normal, n2);
        }
        // Southwest Normal (Yeehaw)
        if (hasW === true) {
          const tW = subtract(pW, pC);
          const n3 = cross(tS, tW);
          normal = add(normal, n3);
        }
      }

      normal = normalize(normal);

      meshVertexNormals.push(vec4(normal[0], normal[1], normal[2], 0.0));
    }
  }

  return meshVertexNormals;
};

/**
 * Utility function for returning the indices used to connect all the points in a sphere.
 *
 * @param {int} verticesOffset - Where to begin connecting circles from the global vertices array.
 * @param {int} numPoints - number of points for each circle (2D cross section).
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
 * Utility function for returning the indices used to connect all the points in a sphere.
 * Pre: Vertices were created using getSphereVertices.
 *
 * @param {int} verticesOffset - Wherre to begin connecting circles from the global vertices array.
 * @param {int} numPoints - number of points for each circle (2D cross section).
 * @returns the modified indices array.
 */
const getSphereVertexNormals = (verticesOffset, numCirclePoints) => {
  let sphereVertexNormals = [];

  // Do in a loop:
  // If top point, make normal [0,0,1]. If bottom point, make normal [0,0,-1]. Otherwise...
  // Get

  for (let i = 0; i <= numCirclePoints; i++) {
    const currVerticesOffset = verticesOffset + i * numCirclePoints;
    for (let j = 0; j < numCirclePoints; j++) {
      // If we're at the bottom or top of the sphere, the normal will be straight down or straight up.
      if (i === 0 || i === numCirclePoints) {
        let dir = i === 0 ? -1 : 1;
        sphereVertexNormals.push(vec4(0, 0, dir, 0.0));
      }
      // Otherwise, calculate the average normal based on the 4 surfaces adjacent to the vertex.
      else {
        let pC = vertices[currVerticesOffset + j];
        let pN = vertices[currVerticesOffset + j + numCirclePoints];
        let pE = vertices[currVerticesOffset + j + 1];
        let pS = vertices[currVerticesOffset + j - numCirclePoints];
        let pW; // TODO: Check if this calculation is correct
        if (j === 0) {
          pW = vertices[currVerticesOffset + j + numCirclePoints - 1];
        } else {
          pW = vertices[currVerticesOffset + j - 1];
        }

        const t1 = subtract(pN, pC);
        const t2 = subtract(pE, pC);
        const t3 = subtract(pS, pC);
        const t4 = subtract(pW, pC);

        const n1 = cross(t1, t2);
        const n2 = cross(t2, t3);
        const n3 = cross(t3, t4);
        const n4 = cross(t4, t1);

        const normal = normalize(add(add(add(n1, n2), n3), n4));

        sphereVertexNormals.push(vec4(normal[0], normal[1], normal[2], 0.0));
      }
    }
  }

  return sphereVertexNormals;
};

/**
 * Utility function for returing the indices used to connect 2 parallel circles.
 * Defines the height of a cylinder.
 *
 * @param {int} verticesOffset - Wherre to begin connecting circles from the global vertices array.
 * @param {int} numPoints - number of points for each circle.
 * @returns the modified indices array.
 */
const connectParallelCylinders = (verticesOffset, numPoints) => {
  let indices = [];

  let circle2Idx = numPoints + 1;

  for (let i = verticesOffset; i <= verticesOffset + numPoints; i++) {
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

/**
 * Utility function for returing the indices used to connect a 2D square mesh.
 *
 * @param {int} verticesOffset - Wherre to begin connecting circles from the global vertices array.
 * @param {int} numMeshLinePoints - The number of points across 1 dimension of the mesh.
 * @returns the modified indices array.
 */
const connectMesh = (verticesOffset, numMeshLinePoints) => {
  let indices = [];
  let count = 0;

  for (
    let i = verticesOffset;
    i <
    verticesOffset +
      numMeshLinePoints * numMeshLinePoints -
      numMeshLinePoints -
      1;
    i += numMeshLinePoints
  ) {
    for (let j = i; j < i + numMeshLinePoints - 1; j++) {
      {
        indices = indices.concat([
          j,
          j + 1,
          j + numMeshLinePoints + 1,
          j + numMeshLinePoints,
          65535,
        ]);
      }
    }
  }

  return indices;
};

// -----------------------------------------------------------------------------------------------
//                                       Other Utility Functions
// -----------------------------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------------------------
//                                        Drawing Everything
// -----------------------------------------------------------------------------------------------

// -----------------------------------------------------------------------------------------------
//                                        Instance Building
// -----------------------------------------------------------------------------------------------

/**
 * Function used to build up the colors, vertices, and indices arrays with
 * all the instances to be drawn. Chains, head, eyes, and mesh.
 */
const buildInstances = () => {
  // ***** Building the chains *****
  let chainSphere = getSphereVertices(0, 0, 0, 0.4, NUM_CHAIN_POINTS);
  fillVertices(chainSphere);
  fillSphereColorGradient(
    vec4(1, 1, 1, 1.0),
    vec4(0.67, 0.67, 0.8, 1.0),
    chainSphere
  );
  fillIndices(connectSphere(0, NUM_CHAIN_POINTS));
  fillNormals(getSphereVertexNormals(0, NUM_CHAIN_POINTS));
  fillTexCoords(getSphereTexCoords(NUM_CHAIN_POINTS));
  // ***** Building the head *****
  let sphere1 = getSphereVertices(0, 0, 0, 3, NUM_HEAD_POINTS);
  fillVertices(sphere1);
  fillSphereColorGradient(
    vec4(0.27, 0.27, 0.4, 1.0),
    vec4(0, 0, 0, 1.0),
    sphere1
  );
  fillIndices(connectSphere(930, NUM_HEAD_POINTS));
  fillNormals(getSphereVertexNormals(930, NUM_HEAD_POINTS));
  fillTexCoords(getSphereTexCoords(NUM_HEAD_POINTS));

  // ***** Building the eyes *****
  let eyeOffset = vertices.length;
  let currOffset = vertices.length;
  let eyeLg = getParallelVertices(
    getCircleVertices(0, 0, 0, 0.8, numCirclePoints),
    0.5
  );
  let eyeSm = getParallelVertices(
    getCircleVertices(0, 0, 0, 0.4, numCirclePoints),
    0.5
  );

  fillVertices(eyeLg);
  fillColor(vec4(1, 1, 1, 1.0), eyeLg);
  fillVertices(eyeSm);
  fillColor(vec4(0.1, 0.1, 0.1, 1.0), eyeSm);
  // Parallel Circles
  fillIndices(range(currOffset, currOffset + eyeLg.length / 2 - 1));
  fillIndices(
    range(currOffset + eyeLg.length / 2, currOffset + eyeLg.length - 1)
  );
  fillIndices(connectParallelCylinders(eyeOffset + 1, numCirclePoints));
  currOffset += eyeLg.length;
  fillIndices(range(currOffset, currOffset + eyeSm.length / 2 - 1));
  fillIndices(
    range(currOffset + eyeSm.length / 2, currOffset + eyeSm.length - 1)
  );
  fillIndices(
    connectParallelCylinders(eyeOffset + eyeSm.length + 1, numCirclePoints)
  );

  // ***** Building the mesh *****
  let mesh = getRandomMesh(NUM_MESH_POINTS, NUM_MESH_POINTS);
  currOffset = vertices.length;
  fillVertices(mesh);
  fillColor(vec4(0, 0.6, 0.1, 1.0), mesh);
  const meshIndices = connectMesh(currOffset, NUM_MESH_POINTS);
  fillIndices(meshIndices);
  fillNormals(getMeshVertexNormals(currOffset, NUM_MESH_POINTS));

  // Prepare colors, vertices, and indices to be fed into the graphics pipeline.
  colors = flatten(colors);
  vertices = flatten(vertices);
  normals = flatten(normals);
  indices = new Uint16Array(indices);
};

// -----------------------------------------------------------------------------------------------
//                                 Image and Texture Configuration
// -----------------------------------------------------------------------------------------------

/**
 * Function for configuring the 1024x1024 bump map texture.
 * @param {*} image - the image to configure.
 */
const configureTexture = (image) => {
  console.log("configuring texture with image", image);
  let texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    texSize,
    texSize,
    0,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.generateMipmap(gl.TEXTURE_2D);
};

// TODO: Use https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html
const textureMapping = () => {
  let resultImage = new Image();
  resultImage.src = "MetalBumpMap.jpg"; // MUST BE SAME DOMAIN!!!
  resultImage.onload = () => {
    // *****onLoad code adopted from Hello2DTexture_ImageFileReader.js
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    texSize = resultImage.width; // Rendundant, but forces texSize variable to adjust if a different image is used
    // Render the loaded image to the canvas
    ctx.drawImage(resultImage, 0, 0, resultImage.width, resultImage.height);
    // Get the image rendered to the canvas, returns a Uint8ClampedArray
    let imageData = ctx.getImageData(
      0,
      0,
      resultImage.width,
      resultImage.height
    ); // FIXME: Why is most of the data 0?
    console.log(imageData.width, imageData.height);
    console.log(imageData);

    // Convert to Array for modification
    let image = new Array(resultImage.width * resultImage.height * 4);
    for (let i = 0; i < resultImage.width * resultImage.height * 4; i++)
      image[i] = imageData.data[i];

    // Normalize Data to [0,1]
    let normalizedData = image.map((x) => x / 255.0);
    console.log("normalizedData", normalizedData);

    // Bump Map Normals (Adopted from bumpMap.js)
    // Note conversion from 1D Array to 2D Array
    let normalst = new Array();
    for (let i = 0; i < texSize; i++) normalst[i] = new Array();
    for (let i = 0; i < texSize; i++)
      for (let j = 0; j < texSize; j++) normalst[i][j] = new Array();
    for (let i = 0; i < texSize; i++)
      for (let j = 0; j < texSize; j++) {
        normalst[i][j][0] =
          normalizedData[i * texSize + j] -
          normalizedData[(i + 1) * texSize + j];
        normalst[i][j][1] =
          normalizedData[i * texSize + j] - normalizedData[i * texSize + j + 1];
        normalst[i][j][2] = 1;
      }
    console.log("normalst:", normalst);

    // Scale to Texture Coordinates (Adopted from bumpMap.js)

    for (let i = 0; i < texSize; i++)
      for (let j = 0; j < texSize; j++) {
        let d = 0;
        for (let k = 0; k < 3; k++) d += normalst[i][j][k] * normalst[i][j][k];
        d = Math.sqrt(d);
        for (let k = 0; k < 3; k++)
          normalst[i][j][k] = (0.5 * normalst[i][j][k]) / d + 0.5;
      }
    console.log("normalst scaled:", normalst);

    // Normal Texture Array (Adopted from bumpMap.js)
    let normals = new Uint8Array(3 * texSize * texSize);

    for (let i = 0; i < texSize; i++)
      for (let j = 0; j < texSize; j++)
        for (let k = 0; k < 3; k++)
          normals[3 * texSize * i + 3 * j + k] = 255 * normalst[i][j][k];
    console.log("normals:", normals);

    // Configure the bump map texture with the resulting normal texture array.
    configureTexture(normals);
  };
};

// -----------------------------------------------------------------------------------------------
//                                  GL program and Shader Setup
// -----------------------------------------------------------------------------------------------

/**
 *
 */
const bindBuffers = () => {
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

  const positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Bind vertex normals (NORMALS) to the gl array buffer.
  let nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  const normalLoc = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  // Bind Texture (TEXCOORDS) to the gl array buffer.
  let tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

  let texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordLoc);

  // Bind topology (INDICES) to the gl element array buffer.
  let iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
};

/**
 *
 */
const defineConstantUniforms = () => {
  // Define uniforms for pedestal translation and rotation.
  thetaViewLoc = gl.getUniformLocation(program, "uThetaView");
  deltaLoc = gl.getUniformLocation(program, "uDelta");

  // Define transformation matrices for modelView, projections, and normals.
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrix = ortho(-15, 15, -15, 15, -15, 15);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );
  nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

  // Define Lighting constant uniforms.
  const diffuseProduct = mult(lightDiffuse, materialDiffuse);
  const specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "uLightAmbient"),
    flatten(lightAmbient)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uDiffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uSpecularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "uLightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);
};

/**
 *
 */
const setupSliders = () => {
  // Define javascript events for the HTML elements used to manipulate the scene.

  // *****  Reset, Freeze, and Big Jump (From Program 2) *****
  document.getElementById("ButtonR").onclick = () => {
    figureSliderVals = [0, 0, 0, 0, 0];
  };
  document.getElementById("ButtonF").onclick = () => {
    freeze = !freeze;
  };
  document.getElementById("ButtonJ").onclick = () => {
    freeze = false;
    bigJumpState = 3;
  };

  // ***** Lighting manipulation *****
  document.getElementById("ButtonB").onclick = () => {
    brightness += 0.1;
    lightAmbient = vec4(brightness, brightness, brightness, 1.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightAmbient"),
      flatten(lightAmbient)
    );
  };
  document.getElementById("ButtonD").onclick = () => {
    brightness -= 0.1;
    lightAmbient = vec4(brightness, brightness, brightness, 1.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightAmbient"),
      flatten(lightAmbient)
    );
  };
  document.getElementById("lightXSlider").onchange = () => {
    lightSliderVals[0] = event.srcElement.value;
    lightPosition = [...lightSliderVals, 0.0];
    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );
  };
  document.getElementById("lightYSlider").onchange = () => {
    lightSliderVals[1] = event.srcElement.value;
    lightPosition = [...lightSliderVals, 0.0];
    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );
  };
  document.getElementById("lightZSlider").onchange = () => {
    lightSliderVals[2] = event.srcElement.value;
    lightPosition = [...lightSliderVals, 0.0];
    gl.uniform4fv(
      gl.getUniformLocation(program, "uLightPosition"),
      lightPosition
    );
  };

  // ***** Scene Rotation *****
  document.getElementById("cSlide").onchange = () => {
    figureSliderVals[Base] = event.srcElement.value;
  };
  document.getElementById("hxSlide").onchange = () => {
    figureSliderVals[HeadZ] = event.srcElement.value;
  };
  document.getElementById("hySlide").onchange = () => {
    figureSliderVals[HeadY] = event.srcElement.value;
  };
  document.getElementById("exSlide").onchange = () => {
    figureSliderVals[EyesX] = event.srcElement.value;
  };
  document.getElementById("eySlide").onchange = () => {
    figureSliderVals[EyesY] = event.srcElement.value;
  };

  // ***** Articulated figure manipulation *****
  document.getElementById("rotXSlider").onchange = () => {
    thetaView[0] = event.srcElement.value;
  };
  document.getElementById("rotYSlider").onchange = () => {
    thetaView[1] = event.srcElement.value;
  };
  document.getElementById("rotZSlider").onchange = () => {
    thetaView[2] = event.srcElement.value;
  };
  document.getElementById("scaleSlider").onchange = () => {
    scaleSliderVal = event.srcElement.value;
  };
};

/**
 * Onload function.
 */
window.onload = () => {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.52, 0.8, 0.92, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.PRIMITIVE_RESTART_FIXED_INDEX);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Fill colors and vertices arrays with all the shapes.
  buildInstances();

  // Bind all array buffers used by gl.drawElements().
  bindBuffers();

  // Define uniforms for lighting and model transformation.
  defineConstantUniforms();

  // Setup the bumpmap texture.
  textureMapping();

  // Setup slider behavior on the UI.
  setupSliders();

  // Begin continuous rendering of the scene.
  render();
};

// -----------------------------------------------------------------------------------------------
//                      Render Functions (Called continuously during runtime)
// -----------------------------------------------------------------------------------------------

/**
 * Function to draw the 2D mesh.
 */
const mesh = () => {
  const instanceMatrix = mult(
    rotateZ(-8),
    mult(scale(15, 1, 1), translate(10, -1.6, 0))
  );
  const t = mult(modelViewMatrix, instanceMatrix);

  nMatrix = normalMatrix(t, true);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));
  gl.drawElements(
    gl.TRIANGLE_FAN,
    MESH_INDICES_LENGTH,
    gl.UNSIGNED_SHORT,
    (HEAD_INDICES_LENGTH + CHAIN_INDICES_LENGTH + EYES_INDICES_LENGTH * 2 - 4) *
      2
  );
};

/**
 * Function to draw the base (Each of the chain spheres).
 * Note the change in the instanceMatrix depending on bigJumpState.
 * @param {*} time - The current time step - used for the bounce effect.
 */
const base = (time) => {
  let bigJumpScale = bigJumpState === 1 ? 5 : 1;

  if (
    bigJumpState === 1 &&
    bigJumpScale *
      Math.abs(
        Math.sin((1 / bigJumpScale) * (time * CHAIN_SPEED + (NUM_CHAINS - 1)))
      ) <=
      0.05
  ) {
    bigJumpState = 2;
  }

  // Draw each of the the 'chain' spheres, layering translation matrices
  // each time.
  for (let i = 0; i < NUM_CHAINS; i++) {
    let instanceMatrix = mult(
      translate(
        (NUM_CHAINS + 2) * (i / NUM_CHAINS),
        bigJumpScale *
          Math.abs(Math.sin((1 / bigJumpScale) * (time * CHAIN_SPEED + i))),
        0.0
      ),
      rotateX(270)
    );

    // Change instanceMatrix for special cases regarding bigJumpState === 2
    if (bigJumpState === 2) {
      if (i === NUM_CHAINS - 1) {
        instanceMatrix = mult(
          mult(
            translate(
              (NUM_CHAINS + 2) * ((NUM_CHAINS - 1) / NUM_CHAINS),
              0.0,
              0.0
            ),
            rotateX(270)
          ),
          scale(
            1,
            1,
            1 -
              HEAD_SQUISH +
              HEAD_SQUISH *
                Math.abs(
                  Math.cos(
                    (1 / bigJumpScale) * (time * CHAIN_SPEED + (NUM_CHAINS - 1))
                  )
                )
          )
        );

        if (
          time >= 2.82 &&
          Math.abs(
            Math.cos(
              (1 / bigJumpScale) * (time * CHAIN_SPEED + (NUM_CHAINS - 1))
            )
          ) >= 0.98
        ) {
          bigJumpState = 0;
        }
      }
    }

    const t = mult(modelViewMatrix, instanceMatrix);
    nMatrix = normalMatrix(t, true);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));
    gl.drawElements(
      gl.TRIANGLE_FAN,
      CHAIN_INDICES_LENGTH,
      gl.UNSIGNED_SHORT,
      0
    );
  }
};

/**
 * Function to draw the head (The large sphere, and the eye 'outlines').
 * Note the changes in the instanceMatrix depending on bigJumpState.
 * @param {*} time - The current time step - used for the bounce effect.
 */
const head = (time) => {
  let bigJumpScale = bigJumpState === 1 ? 5 : 1;
  const timeOffset = 1.7;

  gl.drawElements(
    gl.TRIANGLE_FAN,
    HEAD_INDICES_LENGTH,
    gl.UNSIGNED_SHORT,
    CHAIN_INDICES_LENGTH * 2
  );

  const headX = NUM_CHAINS + 2;
  const toOrigin = translate(-headX, 0, 0);
  const backToInitial = translate(
    0,
    bigJumpScale *
      Math.abs(
        Math.sin((1 / bigJumpScale) * (time * CHAIN_SPEED) + timeOffset)
      ),
    headX
  );

  let instanceMatrix = mult(
    mult(
      mult(mult(toOrigin, rotateY(90)), rotateX(-10)),
      translate(1.6, -0.3, 2.2)
    ),
    backToInitial
  );

  let t = mult(modelViewMatrix, instanceMatrix);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawElements(
    gl.TRIANGLE_FAN,
    EYES_INDICES_LENGTH,
    gl.UNSIGNED_SHORT,
    (HEAD_INDICES_LENGTH + CHAIN_INDICES_LENGTH) * 2
  );

  instanceMatrix = mult(
    mult(
      mult(mult(toOrigin, rotateY(90)), rotateX(-10)),
      translate(-1.6, -0.3, 2.2)
    ),
    backToInitial
  );

  t = mult(modelViewMatrix, instanceMatrix);

  nMatrix = normalMatrix(t, true);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));

  gl.drawElements(
    gl.TRIANGLE_FAN,
    EYES_INDICES_LENGTH,
    gl.UNSIGNED_SHORT,
    (HEAD_INDICES_LENGTH + CHAIN_INDICES_LENGTH) * 2
  );
};

/**
 * Function to draw the eyes (The small dark eye cylinders).
 * Note the changes in the instanceMatrix depending on bigJumpState.
 * @param {*} time - The current time step - used for the bounce effect.
 */
const eyes = (time) => {
  let bigJumpScale = bigJumpState === 1 ? 5 : 1;
  const timeOffset = 1.7;

  const headX = NUM_CHAINS + 2;
  const toOrigin = translate(-headX, 0, 0);
  const backToInitial = translate(
    0,
    bigJumpScale *
      Math.abs(Math.sin((1 / bigJumpScale) * time * CHAIN_SPEED + timeOffset)),
    headX
  );

  let instanceMatrix = mult(
    mult(
      mult(mult(toOrigin, rotateY(90)), rotateX(-10)),
      translate(1.6, -0.3, 2.3)
    ),
    backToInitial
  );

  let t = mult(modelViewMatrix, instanceMatrix);

  nMatrix = normalMatrix(t, true); // TODO: Is t correct here?

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));

  gl.drawElements(
    gl.TRIANGLE_FAN,
    EYES_INDICES_LENGTH - 6,
    gl.UNSIGNED_SHORT,
    (HEAD_INDICES_LENGTH + CHAIN_INDICES_LENGTH + EYES_INDICES_LENGTH) * 2
  );

  instanceMatrix = mult(
    mult(
      mult(mult(toOrigin, rotateY(90)), rotateX(-10)),
      translate(-1.6, -0.3, 2.3)
    ),
    backToInitial
  );

  t = mult(modelViewMatrix, instanceMatrix);

  nMatrix = normalMatrix(t, true);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix));

  gl.drawElements(
    gl.TRIANGLE_FAN,
    EYES_INDICES_LENGTH - 6,
    gl.UNSIGNED_SHORT,
    (HEAD_INDICES_LENGTH + CHAIN_INDICES_LENGTH + EYES_INDICES_LENGTH) * 2
  );
};

/**
 * Main Render function.
 */
const render = () => {
  gl.useProgram(program);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Scene Scaler
  modelViewMatrix = scale(1, scaleSliderVal, 1);

  // ***** Draw each part of the figure, manipulating the model View matrix as we go. *****
  mesh();

  modelViewMatrix = mult(
    modelViewMatrix,
    rotate(figureSliderVals[Base], vec3(0, 1, 0))
  );
  base(t);

  gl.uniform3fv(thetaViewLoc, thetaView); // Update uniform in vertex shader with new rotation angle

  modelViewMatrix = mult(
    modelViewMatrix,
    translate((NUM_CHAINS + 2) * ((NUM_CHAINS - 1) / NUM_CHAINS), 0.0, 0.0)
  );
  modelViewMatrix = mult(
    modelViewMatrix,
    rotate(figureSliderVals[HeadZ], vec3(0, 0, 1))
  );
  modelViewMatrix = mult(
    modelViewMatrix,
    rotate(figureSliderVals[HeadY], vec3(0, 1, 0))
  );
  head(t);

  modelViewMatrix = mult(
    modelViewMatrix,
    translate(0, 0, figureSliderVals[EyesX] * LOOKING_DISTANCE)
  );
  modelViewMatrix = mult(
    modelViewMatrix,
    translate(0, figureSliderVals[EyesY] * LOOKING_DISTANCE, 0)
  );
  eyes(t);

  // ***** Advance time and adjust movement based on user input. *****
  // Speed

  // Advance time and rotate view
  if (freeze === false) {
    // Big jump is ready to go -- "Rewind time" to the beginning of the jump.
    if (bigJumpState === 3) {
      t = 0.86;
      bigJumpState = 1;
    }

    t = t + 0.01;
  }

  requestAnimationFrame(render); // Call to browser to refresh display
};
