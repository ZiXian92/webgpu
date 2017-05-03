/* gl/matrixscaling.js
 * Defines function to parallelize matrix scaling on GPU.
 */

import { initGL } from './utils.js'

const vertexShaderSrc =
`
`

const fragmentShaderSrc =
`

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
