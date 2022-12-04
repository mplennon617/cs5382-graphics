// Michael Lennon
// Computer Graphics Program 2
// "The Chain Critter"
// October 30, 2022

"use strict"; // Enforce typing in javascript

let canvas; // Drawing surface
let gl; // Graphics context
let programs = []; // GL Programs for each of the processed images.
let t = 0; // Define t steps during the render process.

// Hardcoded rectangle vertex.
let vertices = [vec2(-1, -1), vec2(-1, 1), vec2(1, -1), vec2(1, 1)]; // List of all vertices. An array of vec2s

let texCoords = [vec2(0, 0), vec2(0, 1), vec2(1, 0), vec2(1, 1)]; // List of all texture coordinates. An array of vec2s

// Texture constants.
let texSize = 1024; // Size of the bump map image.

// -----------------------------------------------------------------------------------------------
//                                        Fill Functions
// -----------------------------------------------------------------------------------------------

/**
 * Fills the global vertices array with the given vertices.
 * @param {Array} newVertices - The vertices to add to the global array
 */
const fillVertices = (newVertices) => {
  vertices = vertices.concat(newVertices);
};

/**
 * Fills the global vertices array with the given vertices.
 * @param {Array} newTexCoords - The TexCoords to add to the global array
 */
const fillTexCoords = (newTexCoords) => {
  texCoords = texCoords.concat(newTexCoords); // #NewNormal
};

// -----------------------------------------------------------------------------------------------
//                      Utility functions for calculating vertices and indices
// -----------------------------------------------------------------------------------------------

// /**
//  * Returns a list of points representing a 2D rectangle.
//  *
//  * @param {float} x - X offset position.
//  * @param {float} y - Y offset position.
//  * @param {float} w - width (x side length) of the rectangle
//  * @param {float} h - height (y side length) of the rectangle
//  * @returns An array containing the 4 rectangle points.
//  */
// const getRectanglePoints = (x = 0.0, y = 0.0, w = 1.0, h = 1.0) => {
//   let points = [];
//   points.push(vec2(x, y));
//   points.push(vec2(x + w, y));
//   points.push(vec2(x, y + h));
//   points.push(vec2(x + w, y + h));
//   return points;
// };

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

// -----------------------------------------------------------------------------------------------
//                                        Instance Building
// -----------------------------------------------------------------------------------------------

/**
 * Function used to prepare the vertices and texCoords to be drawn.
 */
const buildInstances = () => {
  // Prepare vertices and texCoords to be fed into the graphics pipeline.
  vertices = flatten(vertices);
  texCoords = flatten(texCoords);
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
  let img = new Image();
  const url = "StyleGAN2Face.jpeg";
  img.src = url;
  img.onload = () => {
    // *****onLoad code adopted from Hello2DTexture_ImageFileReader.js
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    texSize = img.width; // Rendundant, but forces texSize variable to adjust if a different image is used
    // Render the loaded image to the canvas
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // Get the image rendered to the canvas, returns a Uint8ClampedArray
    let imageData = ctx.getImageData(
      0,
      0,
      img.width,
      img.height
    ); // FIXME: Why is most of the data 0?
    console.log(imageData.width, imageData.height);
    console.log(imageData);

    // Convert to Array for modification
    let image = new Uint8Array(img.width * img.height * 4);
    for (let i = 0; i < img.width * img.height * 4; i++)
      image[i] = imageData.data[i];

      console.log(image);
    // Configure the texture with the resulting normal texture array.
    configureTexture(image);
  };
};

// -----------------------------------------------------------------------------------------------
//                                  GL program and Shader Setup
// -----------------------------------------------------------------------------------------------

/**
 * Function to bind all the attribute buffers to the gl.ARRAY_BUFFER for each program.
 */
const bindBuffers = () => {
  programs.map((program) => {
    // Bind vertex positions (VERTICES)  to the gl array buffer.
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Bind Texture (TEXCOORDS) to the gl array buffer.
    // TODO: Complete
    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    let texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
  });
};

/**
 * Function used for setting up Slider behavior in the HTML.
 */
const setupUI = () => {
  // Define javascript events for the HTML elements used to manipulate the scene.
  // *****  Reset, Freeze, and Big Jump (From Program 2) *****
  // document.getElementById("ButtonR").onclick = () => {
  //   figureSliderVals = [0, 0, 0, 0, 0];
  // };
};

/**
 * Onload function.
 */
window.onload = () => {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.PRIMITIVE_RESTART_FIXED_INDEX);

  //
  //  Load all shaders and initialize attribute buffers
  //
  programs.push(initShaders(gl, "vertex-shader", "fragment-shader-1"));
  // programs.push(initShaders(gl, "vertex-shader", "fragment-shader-2"));
  // programs.push(initShaders(gl, "vertex-shader", "fragment-shader-3"));
  gl.useProgram(programs[0]);

  // Fill colors and vertices arrays with all the shapes.
  buildInstances();

  // Bind all array buffers used by gl.drawArrays().
  bindBuffers();

  // Setup the bumpmap textures.
  // TODO: Texture mapping
  textureMapping();

  // Setup slider behavior on the UI.
  setupUI();

  // Begin continuous rendering of the scene.
  render();
};

// -----------------------------------------------------------------------------------------------
//                      Render Functions (Called continuously during runtime)
// -----------------------------------------------------------------------------------------------

/**
 * Main Render function.
 */
const render = () => {
  gl.useProgram(programs[0]);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ***** Draw each part of the figure, manipulating the model View matrix as we go. *****
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(render); // Call to browser to refresh display
};
