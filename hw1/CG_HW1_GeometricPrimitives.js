"use strict";			// Enforce typing in javascript

var canvas;			// Drawing surface 
var gl;				// Graphics context

var axis = 0;			// Currently active axis of rotation
var xAxis = 0;			//  Will be assigned on of these codes for
var yAxis =1;			//  
var zAxis = 2;

var theta = [0, 0, 0];		// Rotation angles for x, y and z axes
var thetaLoc;			// Holds shader uniform variable location
var flag = true;		// Toggle Rotation Control

    var cubePoints = [			// Use Javascript typed arrays
        // +Z    
        -0.5, -0.5,  0.5,		
        -0.5,  0.5,  0.5,		
        0.5,  0.5,  0.5,		
        0.5, -0.5,  0.5,
        // -X
        -0.5, -0.5,  0.5,		
        -0.5,  0.5,  0.5,		
        -0.5,  0.5, -0.5,		
        -0.5, -0.5, -0.5,
        // -Z
        0.5, -0.5,  -0.5,		
        0.5,  0.5,  -0.5,		
        -0.5,  0.5,  -0.5,		
        -0.5, -0.5,  -0.5,
        // +X
        0.5, -0.5,  -0.5,		
        0.5,  0.5,  -0.5,		
        0.5,  0.5, 0.5,		
        0.5, -0.5, 0.5,
        // Trace back to starting point
        0.5, -0.5,  -0.5,
        -0.5,-0.5, -0.5	
    
    ];

    var colors = new Float32Array ( [	
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
        0.0, 0.0, 0.0, 1.0,  // black
        1.0, 0.0, 0.0, 1.0,  // red
        1.0, 1.0, 0.0, 1.0,  // yellow
        0.0, 1.0, 0.0, 1.0,  // green
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 0.0, 1.0, 1.0,  // blue
        1.0, 0.0, 1.0, 1.0,  // magenta
        1.0, 1.0, 1.0, 1.0,  // white
        0.0, 1.0, 1.0, 1.0,  // cyan
    ]);

    function getCirclePoints(
        x = 0,
        y = 0,
        radius = 1,
        numPoints = 18
      ) {
        // Adapted and modified from James' example in the class Slack.
        let points = [];
        points.push(0,0,radius);

        for (let i = 0; i <= numPoints; i++) {
          points.push(
            radius*Math.cos((i * 2 * Math.PI) / numPoints) + x,
            radius*Math.sin((i * 2 * Math.PI) / numPoints) + y,
            0
          );
        }
        return points;
      }


    let circlePoints = getCirclePoints(0,0,0.5,18);
    console.log(circlePoints);

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    //gl.enable(gl.DEPTH_TEST);;

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

    // cube vertex array attribute buffer
    let points = new Float32Array(cubePoints.concat(circlePoints));

    for (let i = 0; i < points.length - 3; i+=3) {
        console.log(">>>",i/3);
        console.log(points[i],points[i+1],points[i+2]);
        // console.log("x,y,z:",points[i][0],points[i][1],points[i][2])
    }
    

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(cubePoints), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc );

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    //event listeners for buttons

    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 0.017;	// Increment rotation of currently active axis of rotation in radians

    gl.uniform3fv(thetaLoc, theta);	// Update uniform in vertex shader with new rotation angle

    gl.drawArrays(gl.LINE_LOOP, 0, cubePoints.length/3);	// Try changing the primitive type
    gl.drawArrays(gl.TRIANGLE_FAN, cubePoints.length/3, circlePoints.length/3);	// Try changing the primitive type

    requestAnimationFrame(render);	// Call to browser to refresh display
}
