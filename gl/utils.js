/* gl/utils.js
 * COntains utility functions to make WebGL usage more convenient.
 */

let canvas = null
let gl = null

/**
 * Initializes WebGL object using the given canvas object.
 * If not canvas is provided, a standard hidden canvas is used instead.
 * @param {Object} canvas A HTML Canvas element
 * @return {Object?} WebGL object if GPU processing is possible, null otherwise
 */
export function initGL (userCanvas) {
  if (!userCanvas) { // userCanvas not specified
    if (!canvas) {  // Global canvas and gl not initialized, initialize now
      canvas = document.createElement('canvas')
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) { // Set up the GL object
        gl.clearColor(0, 0, 0, 0)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      }
    }
    if (!gl) console.log('Unable to get WebGL context.')
    return gl
  }

  // Attempt to get WebGL context for specified canvas so we can do GL and SL stuffs
  let finalGl = userCanvas.getContext('webgl') || userCanvas.getContext('experimental-webgl')
  if (!finalGl) console.log('Unable to get WebGL context.')

  // Set up the GL object
  finalGl.clearColor(0, 0, 0, 0)
  finalGl.enable(finalGl.DEPTH_TEST)
  finalGl.depthFunc(finalGl.LEQUAL)
  finalGl.clear(finalGl.COLOR_BUFFER_BIT | finalGl.DEPTH_BUFFER_BIT)

  return finalGl
}

/**
 * Converts 32-bit floating point number into an array of 4 byte-elements.
 * @param {Number} value
 * @return {Array} An array of 4 numbers less than 256 in magnitude
 */
function packValue (value) {
  const byteReducers = [16777216, 65536, 256, 1]
  return byteReducers.map(r => {
    if (Math.abs(value) < r) return 0
    let res = Math.floor(value / r)
    value %= r
    return res
  })
}

/**
 * Reconstructs 32-bit floating point number from the 4-byte input array.
 * @param {Array} bytes The input 4-element byte array
 * @return {Number} The nuber represented by the byte array
 */
function unpackValue (bytes) {
  const byteReducers = [16777216, 65536, 256, 1]
  return bytes.map((byte, i) => byte * byteReducers[i])
  .reduce((res, cur) => res + cur, 0)
}

/**
 * Converts given matrix into a canvas texture.
 * @param {Array<?>} mtx Matrix of 32-bit floating point numbers
 * @param {int} nRows Number of rows in matrix
 * @param {int} nCols Number of columns in matrix
 * @return {WebGLTexture} HTML Canas representation of the given matrix, null if parameters are invalid
 */
export function convertMatrixToTexture (mtx, nRows, nCols) {
  if (nRows <= 0 || nCols <= 0) return null

  // For each row, map each element into 4-element array.
  // Then within each row, merge the 4-element arrays.
  // Finally, merge all the mapped rows.
  let bytes = mtx.map(row => row.map(packValue).reduce((res, cur) => res.concat(cur), []))
  .reduce((res, cur) => res.concat(cur), [])

  // Create canvas if not created yet
  if (!gl) gl = initGL()

  // Fail to init WebGL
  if (!gl) {
    console.log('Unable to produce texture as GPU parallization is not supported.')
    return null
  }

  // Here onwards, canvas and gl are assumed to be valid.
  // Set up the canvas such that its image data texture corresponds to the matrix.
  canvas.width = nCols
  canvas.height = nRows
  let ctx = canvas.getContext('2d')
  let imgData = ctx.getImageData(0, 0, nCols, nRows)
  let textureIdx = 0

  // TODO: Fill in imgData from bytes

  // Write out the image data to canvas so we can use it to create WebGL texture.
  ctx.putImageData(imgData, 0, 0)

  // Create and set up the WebGL texture from canvas image data
  let texture = gl.createtexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}

/**
 * Constructs a matrix with specified dimensions from the given texture.
 * if texture has too few elements, remaining spaces in the matrix are filled with zeroes.
 * @param {Uint8ClampedArray} texture
 * @param {int} nRows Number of rows in the resulting matrix
 * @param {int} nCols Number of columns in the resulting matrix
 */
export function convertTextureToMatrix (texture, nRows, nCols) {
  if (nRows <= 0 || nCols <= 0) return null

  let textureIdx = 0
  let mtx = []
  for (let r = 0; r < nRows; r++) {
    let row = []
    for (let c = 0; c < nCols; c++) {
      if (textureIdx >= texture.length) row.push(0)
      else {
        row.push(unpackValue(texture.slice(textureIdx, textureIdx + 4)))
        textureIdx += 4
      }
    }
    mtx.push(row)
  }
  return mtx
}
