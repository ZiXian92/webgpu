/* gl/matrixscaling.js
 * Defines function to parallelize matrix scaling on GPU.
 */

import { initGL } from './utils.js'

const vertexPositions = [
  0, 0, 0,
  1, 0, 0,
  1, 1, 0,
  0, 1, 0
]

const vertexShaderSrc =
`
#ifdef GL_ES
precision highp float;
#endif
attribute vec3 aVertexCoord;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;

void main() {
  gl_Position = vec4(aVertexCoord, 1);
  vTextureCoord = aTextureCoord;
}
`

const fragmentShaderSrc =
`
#ifdef GL_ES
precision highp float;
#endif
varying vec2 vTextureCoord;
uniform sampler2D mtx;
uniform float scaleFactor;
uniform int numRows;
uniform int numCols;
float unpack(vec3 rgb) {
  rgb*=vec3(255, 255, 255)
  return round(rgb.x)*65536+round(rgb.y)*256+round(rgb.z);
}
vec3 pack(float val) {
  return vec3(mod(val/65536, 256), mod(val/256, 256), mod(val, 256))/vec3(255, 255, 255);
}
void main() {
  float newValue = scaleFactor*unpack(texture2D(mtx, vTextureCoord).xyz);
  gl_FragColor = vec4(pack(newValue), 1);
}
`

let gl = initGL()

// Create and compile shaders
let vShader = gl.createShader(gl.VERTEX_SHADER)
let fShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(vShader, vertexShaderSrc)
gl.compileShader(vShader)
gl.shaderSource(fShader, fragmentShaderSrc)
gl.compileShader(fShader)
vShader = gl.getShaderParameter(vShader, gl.COMPILE_STATUS) ? vShader : null
fShader = gl.getShaderParameter(fShader, gl.COMPILE_STATUS) ? fShader : null

let program = vShader && fShader ? gl.createProgram() : null
let cubeVertexPositionBuffer
let cubeTextureCoordBuffer
if (program) {
  gl.attachShader(program, vShader)
  gl.attachShader(program, fShader)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Vertex and texture position stuffs here.
  // To be implemented after implementing the shader source codes.
  // Refer to https://github.com/bunions1/matrixMultiplyGpu/blob/master/static/sylvester.js and
  // http://learningwebgl.com/blog/?p=28
}

export function scaleMatrix (mtx, numRows, numCols, scaleFactor) {
  // Convert mtx to vertices/texture

  // Use gl to "draw" points

  // Reconstruct matrix from texture

  // Return matrix
  return mtx
}
