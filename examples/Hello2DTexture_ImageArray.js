"use strict";

var canvas;
var gl;

var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

var texSize = 256;

// Bump Data

var data = new Uint8Array (3*texSize*texSize)   // Format grayscale into RGB format

for (var i = 0; i<= texSize; i++)  
    for (var j=0; j<=texSize; j++) {
        data[3*texSize*i+3*j  ] = rawData[i*256+j];
        data[3*texSize*i+3*j+1] = rawData[i*256+j];
        data[3*texSize*i+3*j+2] = rawData[i*256+j];
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
    vec4(0.0,  0.0,  0.0,  1.0),
    vec4(1.0,  0.0,  0.0,  1.0),
    vec4(1.0,  1.0,  0.0,  1.0),
    vec4(0.0,  1.0,  0.0,  1.0)
];

var texCoords = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1)
];

var modelViewMatrix, projectionMatrix, nMatrix;

var program;


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

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
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation( program, "aTexCoord");
    gl.vertexAttribPointer( texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);

    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};

    projectionMatrix = ortho(-1.2, 1.2, -1.2, 1.2,-10.0,10.0);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));

    render();
}

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(2.0, 3.0*(1.0+Math.cos(phi)), 2.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    modelViewMatrix  = lookAt(eye, at, up);
  
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(render);
}
