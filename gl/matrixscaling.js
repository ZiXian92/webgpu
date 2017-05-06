/* gl/matrixscaling.js
 * Defines function to parallelize matrix scaling on GPU.
 */

import gpuutils from './utils.js'

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

float unpack(vec4 rgb) {
  return 0.0;
}

vec4 pack(float val) {
  return vec4(0.0, 0.0, 0.0, 195.0);
}

void main() {
  // float newValue = scaleFactor*unpack(texture2D(mtx, vTextureCoord).xyzw);
  // gl_FragColor = vec4(pack(newValue), 1);
  gl_FragColor = texture2D(mtx, vTextureCoord);
}
`

let gl = gpuutils.getGlContext()
let program = gpuutils.makeShaderPrograms(fragmentShaderSrc)
let cubeVertexPositionBuffer
let cubeTextureCoordBuffer

if (program) {
  gl.useProgram(program)

  // Get variable locations of those that take data from buffer or outside
  // Refer to https://github.com/bunions1/matrixMultiplyGpu/blob/master/static/sylvester.js and
  // http://learningwebgl.com/blog/?p=28

  program.mtxUniformLoc = gl.getUniformLocation(program, 'mtx')
  program.scaleFactorUniformLoc = gl.getUniformLocation(program, 'scaleFactor')
  program.numRowsUniformLoc = gl.getUniformLocation(program, 'numRows')
  program.numColsUniformLoc = gl.getUniformLocation(program, 'numCols')

  // Pre-bind the coords buffers
  // cubeVertexPositionBuffer = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW)
  // cubeTextureCoordBuffer = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer)
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW)
}

export function scaleMatrix (mtx, numRows, numCols, scaleFactor) {
  // Handle case where imposible to run on GPU
  if (!program) {
    console.log('Unable to prepare GPU-parallel program. Falling back to CPU.')
    return mtx.map(row => row.map(elem => Math.round(elem * scaleFactor * 100.0) / 100.0))
  }

  gpuutils.setCanvasSize(numCols, numRows)

  // Set current program
  gl.useProgram(program)

  // Convert mtx to vertices/texture
  let mtxTexture = gpuutils.makeTexturef(mtx, numRows, numCols)

  // Init buffer properties
  // gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  // gl.vertexAttribPointer(program.vertexCoordAttribute, 3, gl.FLOAT, gl.FALSE, 12, 0)
  // gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer)
  // gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, gl.FALSE, 8, 0)

  // Prepare output frame buffer
  let outputTexture = gpuutils.makeTexturef(null, numRows, numCols)
  gpuutils.setFramebufferTexture(outputTexture)

  program.initVShader()

  // Activate and bind textures
  gpuutils.bindTexture(0, mtxTexture, program.mtxUniformLoc)

  // Set other uniform constants
  gl.uniform1f(program.scaleFactorUniformLoc, scaleFactor)
  gl.uniform1i(program.numRowsUniformLoc, numRows)
  gl.uniform1i(program.numColsUniformLoc, numCols)

  // Use gl to "draw" points.
  // Here drawing square using triangle strip and then doing texture mapping.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  // Reconstruct matrix from texture
  let res = gpuutils.readFramebuffer2f(numRows, numCols)

  // Cleanup
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gpuutils.destroyTexture(mtxTexture)
  gpuutils.destroyTexture(outputTexture)

  return res
}
