"use strict";

var canvas;
var gl;

var theta = 0.0;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;

var texSize = 256;

// Bump Data
var channels = 4;
var data = new Uint8Array(channels * texSize * texSize); // Format grayscale into RGB format

for (var i = 0; i <= texSize; i++)
  for (var j = 0; j <= texSize; j++) {
    data[channels * texSize * i + channels * j] = rawData[i * 256 + j];
    data[channels * texSize * i + channels * j + 1] = rawData[i * 256 + j];
    data[channels * texSize * i + channels * j + 2] = rawData[i * 256 + j];
    data[channels * texSize * i + channels * j + 3] = 255;
  }
/* Draws in the XZ-plane
var vertices = [
    vec4(0.0,  0.0,  0.0,  1.0),
    vec4(1.0,  0.0,  0.0,  1.0),
    vec4(1.0,  0.0,  1.0,  1.0),
    vec4(0.0,  0.0,  1.0,  1.0)
];
*/
/* Draws in the XY-plane */
var vertices = [
  vec4(0.0, 0.0, 0.0, 1.0),
  vec4(1.0, 0.0, 0.0, 1.0),
  vec4(1.0, 1.0, 0.0, 1.0),
  vec4(0.0, 1.0, 0.0, 1.0),
];

var texCoords = [vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)];

var modelViewMatrix, projectionMatrix, nMatrix;

var program;

////  Move Texture Configuration to a function
function configureTexture(image, width, height) {
  console.log(width, height);

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
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2.0 isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);
  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

  var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(texCoordLoc);

  console.log("default Texture");
  configureTexture(data, texSize, texSize);
  console.log("file select");
  // var texture = gl.createTexture();
  // gl.activeTexture(gl.TEXTURE0);
  // gl.bindTexture(gl.TEXTURE_2D, texture);
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
  // gl.generateMipmap(gl.TEXTURE_2D);

  document.getElementById("Button4").onclick = function () {
    phi += dr;
  };
  document.getElementById("Button5").onclick = function () {
    phi -= dr;
  };

  ////////  Callback for FileReader to use Image Data File /////
  ////////    provided, and modified, with permission from student in CS 5382 Spring 2022

  document.getElementById("fileInput").onchange = (e) => {
    // Get the file data from the event variable
    let file = e.target.files[0];

    // The JavaScript FileReader is used to load files, such as .txt or .png files
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      // Grab the file from the event variable
      let result = e.target.result;

      // Create an HTML <img>, which will we attach the file data to
      let resultImage = new Image();
      //resultImage.src = result;

      // Again, create the onload() function before loading the file data
      resultImage.onload = () => {
        // Create a blank canvas and a canvas context
        // Canvas context is used to draw an image to the canvas
        // let canvas = document.getElementById('gl-canvas');
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");

        // Render the loaded image to the canvas
        ctx.drawImage(resultImage, 0, 0, resultImage.width, resultImage.height);

        // Get the image rendered to the canvas, returns a Uint8ClampedArray
        let imageData = ctx.getImageData(
          0,
          0,
          resultImage.width,
          resultImage.height
        );
        console.log(imageData.width, imageData.height);
        console.log(imageData);

        // Convert to a Uint8Array (not necessary)
        let image = new Uint8Array(resultImage.width * resultImage.height * 4);
        for (let i = 0; i < resultImage.width * resultImage.height * 4; i++)
          image[i] = imageData.data[i];

        // Do something with that image
        configureTexture(imageData, resultImage.width, resultImage.height);
      };

      // Start loading the image data
      resultImage.src = result;
    };

    // Read the image. Once this is finished, onload() will be called
    // If you want to read a .txt file, use readAsText(file, "utf-8")
    fileReader.readAsDataURL(file);
  };

  //////////////////////////////////////////////////////////////

  projectionMatrix = ortho(-1.2, 1.2, -1.2, 1.2, -10.0, 10.0);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "uProjectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var eye = vec3(2.0, 3.0 * (1.0 + Math.cos(phi)), 2.0);
  var at = vec3(0.0, 0.0, 0.0);
  var up = vec3(0.0, 1.0, 0.0);

  modelViewMatrix = lookAt(eye, at, up);

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "uModelViewMatrix"),
    false,
    flatten(modelViewMatrix)
  );

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(render);
};
