// Michael Lennon
// Computer Graphics Program 2
// "The Chain Critter"
// October 30, 2022

"use strict"; // Enforce typing in javascript

let canvas; // Drawing surface
let gl; // Graphics context

let programs = []; // GL Programs for each of the processed images.
let shaderIdx = 0; // Index to the shader program to use (in the programs array).
let imageSrc = "StyleGAN2FaceSmall.png";
// Hardcoded rectangle vertex.
let vertices = [vec2(-1, -1), vec2(1, -1), vec2(1, 1), vec2(-1, 1)]; // List of all vertices. An array of vec2s
let texCoords = [vec2(1, 1), vec2(0, 1), vec2(0, 0), vec2(1, 0)]; // List of all texture coordinates. An array of vec2s

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
const configureTexture = (image, width, height) => {
  // console.log("configuring texture with image", image);

  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};

const textureMapping = () => {
  let imageElement = new Image();
  const url = imageSrc;
  imageElement.src = url;
  imageElement.onload = () => {
    // *****onLoad code adopted from Hello2DTexture_ImageFileReader.js
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    // Render the loaded image to the canvas
    ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
    // Get the image rendered to the canvas, returns a Uint8ClampedArray
    let imageData = ctx.getImageData(
      0,
      0,
      imageElement.width,
      imageElement.height
    );

    // Convert to Array for modification
    let image = new Uint8Array(imageElement.width * imageElement.height * 4);
    for (let i = 0; i < imageElement.width * imageElement.height * 4; i++)
      image[i] = imageData.data[i];

    // Configure the texture with the resulting normal texture array.
    configureTexture(image, imageElement.width, imageElement.height);
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
    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    let texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);
  });
};

/**
 * Function used for setting up UI behavior in the HTML.
 */
const setupUI = () => {
  // Define javascript events for the HTML elements used to manipulate the scene.
  // ***** Image Processing Technique Dropdown *****
  document.getElementById("programDropdown").onchange = (el) => {
    shaderIdx = document.getElementById("programDropdown").value;
  };
  // ***** Image Dropdown *****
  document.getElementById("imageDropdown").onchange = (el) => {
    imageSrc = document.getElementById("imageDropdown").value;
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
  gl.clearColor(0, 0, 0, 1.0);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.PRIMITIVE_RESTART_FIXED_INDEX);

  //
  //  Load all shaders and initialize attribute buffers
  //
  programs.push(initShaders(gl, "vertex-shader", "fragment-shader-1"));
  programs.push(initShaders(gl, "vertex-shader", "fragment-shader-2"));
  programs.push(initShaders(gl, "vertex-shader", "fragment-shader-3"));
  programs.push(initShaders(gl, "vertex-shader", "fragment-shader-4"));
  gl.useProgram(programs[0]);

  // Fill colors and vertices arrays with all the shapes.
  buildInstances();

  // Bind all array buffers used by gl.drawArrays().
  bindBuffers();

  // Setup the texture.
  textureMapping();

  // Map the texture to the program.
  gl.uniform1i(gl.getUniformLocation(programs[0], "uTexMap"), 0);

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
  gl.useProgram(programs[shaderIdx]);

  textureMapping();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // ***** Draw each part of the figure, manipulating the model View matrix as we go. *****
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(render); // Call to browser to refresh display
};
