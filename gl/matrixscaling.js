/* gl/matrixscaling.js
 * Defines function to parallelize matrix scaling on GPU.
 */

import { initGL } from './utils.js'

const vertexPositions = [
  0, 0, 0,
  1, 0, 0,
  0, 1, 0,
  1, 1, 0
]

const textureCoords = [
  0, 0,
  1, 0,
  1, 1,
  0, 1
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
  rgb*=vec3(255.0, 255.0, 255.0);
  return rgb.x*65536.0+rgb.y*256.0+rgb.z;
}

vec3 pack(float val) {
  return vec3(mod(val/65536.0, 256.0), mod(val/256.0, 256.0), mod(val, 256.0))/vec3(255.0, 255.0, 255.0);
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
console.log('Compiling vertex shader for matrix scaling')
console.log(gl.getShaderInfoLog(vShader))
vShader = gl.getShaderParameter(vShader, gl.COMPILE_STATUS) ? vShader : null
console.log('Compiling fragment shader for matrix scaling')
console.log(gl.getShaderInfoLog(fShader))
fShader = gl.getShaderParameter(fShader, gl.COMPILE_STATUS) ? fShader : null

let program = vShader && fShader ? gl.createProgram() : null
console.log(program)
let cubeVertexPositionBuffer
let cubeTextureCoordBuffer
if (program) {
  gl.attachShader(program, vShader)
  gl.attachShader(program, fShader)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Get variable locations of those that take data from buffer or outside
  // Refer to https://github.com/bunions1/matrixMultiplyGpu/blob/master/static/sylvester.js and
  // http://learningwebgl.com/blog/?p=28
  program.vertexCoordAttribute = gl.getAttribLocation(program, 'aVertexCoord')
  gl.enableVertexAttribArray(program.vertexCoordAttribute)
  program.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord')
  gl.enableVertexAttribArray(program.textureCoordAttribute)
  program.mtxUniformLoc = gl.getUniformLocation(program, 'mtx')
  program.scaleFactorUniformLoc = gl.getUniformLocation(program, 'scaleFactor')
  program.numRowsUniformLoc = gl.getUniformLocation(program, 'numRows')
  program.numColsUniformLoc = gl.getUniformLocation(program, 'numCols')

  // Pre-bind the coords buffers
  cubeVertexPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW)
  cubeTextureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW)
}

export function scaleMatrix (mtx, numRows, numCols, scaleFactor) {
  // Handle case where imposible to run on GPU
  if (!program) {
    console.log('Unable to prepare GPU-parallel program. Falling back to CPU.')
    return mtx.map(row => row.map(elem => Math.round(elem * scaleFactor * 100.0) / 100.0))
  }

  // Set current program
  gl.useProgram(program)

  // Convert mtx to vertices/texture
  // TODO: Implement
  let mtxTexture = null

  // Init buffer properties
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  gl.vertexAttribPointer(program.vertexCoordAttribute, 3, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer)
  gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0)

  // Activate and bind textures
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, mtxTexture)
  gl.uniform1i(program.mtxUniformLoc, 0)

  // Set other uniform constants
  gl.uniform1f(program.scaleFactorUniformLoc, scaleFactor)
  gl.uniform1i(program.numRowsUniformLoc, numRows)
  gl.uniform1i(program.numColsUniformLoc, numCols)

  // Use gl to "draw" points.
  // Here drawing square using triangle strip and then doing texture mapping.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  // Reconstruct matrix from texture
  // TODO: Implement

  // Return matrix
  return mtx
}
