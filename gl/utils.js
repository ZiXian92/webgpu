/* gl/utils.js
 * Contains utility functions to make WebGL usage more convenient.
 * Supports data only up to 2-dimensional arrays due to the nature of
 * textures.
 * 3-dimensional arrays may be supported in the future after getting things to work.
 */

/**
 * Defines utility class for general-purpose GPU computations.
 * If you want to use some of these methods for actual rendering,
 * at the end of rendering pipeline, grab the pixels from output frame buffer,
 * process into ImageData and draw it onto your ouwn canvas.
 */
class GPUUtils {
  constructor () {
    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
    if (this.gl) {
      this.initGlContext()
      this.gl.getExtension('OES_texture_float')
      this.frameBuffer = this.gl.createFramebuffer()
    } else {
      console.log('WebGL not supported')
    }
  }

  /**
   * Gets the WebGL rendering context.
   * @return {WebGLRenderingContext} Returns null if WebGL is not supported.
   */
  getGlContext () { return this.gl }

  // Initializes the WebGL rendering context
  initGlContext () {
    if (!this.gl) return
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  /**
   * Sets the canvas and viewport size to reflect the problem size.
   * @param {Number} width Positive number indicating width of canvas.
   * @param {Number} height Positive number indicating height of canvas.
   */
  setCanvasSize (width, height) {
    this.canvas.width = width
    this.canvas.height = height
    if (this.gl) gl.viewport(0, 0, width, height)
  }

  /**
   * Builds a WebGLTexture out of the given data.
   * No error checking is done so make sure nRows and nCols are consistent with data.
   * @param {Array<Number>?|Array<Array<Number>>?} data Null if everything si to be set to 0. 1D or 2D array otherwise.
   * @param {Integer} nRows Number of rows in data. Set to 1 for 1D data.
   * @param {Integer} nCols Number of columns in data. Same for both 1D and 2D data.
   */
  makeTexture (data, nRows, nCols) {
    if (!this.gl) return null
    let textureData
    if (!data) textureData = new Uint8Array(nRows * nCols * 4)
    else if (nRows === 1) textureData = new Uint8Array(new Float32Array(data).buffer)
    else
      textureData = data.map(row => new Uint8Array(new Float32Array(row).buffer))
        .reduce((res, cur) => {
          let arr = new Uint8Array(res.length + cur.length)
          arr.set(res)
          arr.set(cur, res.length)
          return arr
        }, new Uint8Array(0))
    // console.log(textureData)
    let texture = this.gl.createTexture()
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, nCols, nRows, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, textureData, 0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)

    return texture
  }

  /**
   * Sets frame buffer to use specified texture.
   * @param {WebGLTexture} texture The texture to attach to frame buffer.
   */
  setFramebufferTexture (texture) {
    if (!this.gl) return
    let frameBuffer = this.frameBuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0)

    // Get frame buffer status
    let status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)
    switch (status) {
      case this.gl.FRAMEBUFFER_COMPLETE:
        console.log('Framebuffer ready to use')
        break
      case this.gl.FRAMEBUFFER_UNSUPPORTED:
        console.log('Framebuffer unsupported')
        break
      case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        console.log('Incomplete attachment')
        break
      case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        console.log('Incomplete dimensions')
        break
      case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATATCHMENT:
        console.log('Missing attachment')
        break
      default:
        console.log('Unexpected error occurred')
    }
  }

  /**
   * Compiles the 2 shaders and returns the program.
   * @param {String} vertexShaderSrc Source code for vertex shader
   * @param {String} fragmentShaderSrc Source code for fragment shader
   * @return {WebGLProgram} The compiled program. Returns null if WebGL is not supported or compilation fails.
   */
  makeShaderPrograms (vertexShaderSrc, fragmentShaderSrc) {
    if (!this.gl) return null

    // Create and compile shaders
    let vShader = this.gl.createShader(this.gl.VERTEX_SHADER)
    let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
    this.gl.shaderSource(vShader, vertexShaderSrc)
    this.gl.compileShader(vShader)
    this.gl.shaderSource(fShader, fragmentShaderSrc)
    this.gl.compileShader(fShader)
    console.log('Compiling vertex shader for matrix scaling')
    let vShaderCompileLog = this.gl.getShaderInfoLog(vShader)
    console.log(vShaderCompileLog)
    vShader = this.gl.getShaderParameter(vShader, this.gl.COMPILE_STATUS) ? vShader : null
    console.log('Compiling fragment shader for matrix scaling')
    let fShaderCompileLog = this.gl.getShaderInfoLog(fShader)
    console.log(fShaderCompileLog)
    fShader = this.gl.getShaderParameter(fShader, this.gl.COMPILE_STATUS) ? fShader : null

    // Stop if any shader compilation fails
    if (vShaderCompileLog || fShaderCompileLog) return null

    // Create program
    let program = this.gl.createProgram()
    this.gl.attachShader(program, vShader)
    this.gl.attachShader(program, fShader)
    this.gl.linkProgram(program)

    return program
  }

  /**
   * Sets the program to be used.
   * @param {WebGLProgram} program
   */
  setProgram (program) {
    if (!this.gl) return
    this.gl.useProgram(program)
  }

  /**
   * Binds the given texture to the specified texture unit.
   * @param {Integer} textureUnit
   * @param {WebGLTexture} texture
   * @param {WebGLUniformLocation} textureLoc
   */
  bindTexture (textureUnit, texture, textureLoc) {
    if (!this.gl) return null

    this.gl.activeTexture(this.gl[`TEXTURE${textureUnit}`])
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.uniform1i(textureLoc, textureUnit)
  }

  /**
   * Reads contents of framebuffer into 2D float array.
   * @param {Integer} nRows
   * @param {Integer} nCols
   * @return {Array<Float32Array>} Returns matrix on success and null if WebGL is not supported.
   */
  readFramebuffer2f (nRows, nCols) {
    if (!this.gl) return null

    // Read pixels and convert into Float32Array by byte interpretation
    let pixels = new Uint8Array(nRows * nCols * 4)
    this.gl.readPixels(0, 0, nCols, nRows, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)
    pixels = new Float32Array(pixels.buffer)

    // Convert into 2D matrix
    let mtx = []
    for (let r = 0; r < nRows; r++) mtx.push(new Array(nCols))
    pixels.forEach((pixel, i) => {
      let r = Math.floor(i / nCols)
      let c = i - r * nCols
      mtx[r][c] = pixel
    })
    return mtx
  }
}

export const gpuutils = new GPUUtils()

let canvas = null
let frameCanvas = document.createElement('canvas')
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
        gl.getExtension('OES_texture_float')
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
  finalGl.getExtension('OES_texture_float')

  return finalGl
}

/**
 * Converts 32-bit floating point number into an array of 4 byte-elements.
 * @param {Number} value
 * @return {Array} An array of 4 numbers less than 256 in magnitude
 */
function packValue (value) {
  const byteReducers = [16777216.0, 65536.0, 256.0, 1.0]
  return byteReducers.map(r => {
    if (r === 1.0) return value
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
 * Creates a WebGLTexture object fromt he given canvas.
 * @param {Canvas} inputCanvas
 * @return {WebGLTexture}
 */
function makeTexture (nRows, nCols, bytes = null) {
  bytes = bytes || new Float32Array(nRows * nCols * 4)
  let texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, nCols, nRows, 0, gl.RGBA, gl.FLOAT, bytes, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
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

  // Create and set up the WebGL texture from canvas image data
  return makeTexture(nRows, nCols, new Float32Array(bytes))
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

/**
 * Creates an output buffer of the given size.
 * @param {int} nRows
 * @param {int} nCols
 * @return {{texture: WebGLTexture, renderBuffer: WebGLRenderbuffer, frameBuffer: WebGLFramebuffer}}
 */
export function makeOutputBuffer (nRows, nCols) {
  // Get texture to attach to framebuffer
  frameCanvas.width = nCols
  frameCanvas.height = nRows
  let texture = makeTexture(nRows, nCols)

  // Set up render buffer to be used by framebuffer
  // let renderBuffer = gl.createRenderbuffer()
  // gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
  // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, nCols, nRows)
  // gl.isRenderbuffer(renderBuffer)
  // gl.bindRenderbuffer(gl.RENDERBUFFER, null)

  // Set up frame buffer
  let frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer)
  let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  switch (status) {
    case gl.FRAMEBUFFER_COMPLETE:
      console.log('Framebuffer ready to use')
      break
    case gl.FRAMEBUFFER_UNSUPPORTED:
      console.log('Framebuffer unsupported')
      break
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      console.log('Incomplete attachment')
      break
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      console.log('Incomplete dimensions')
      break
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATATCHMENT:
      console.log('Missing attachment')
      break
    default:
      console.log('Unexpected error occurred')
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return { texture, frameBuffer }
}

/**
 * De-initialize the output buffer.
 * @param {Object} buf The output of makeOutputBuffer function
 */
export function deleteOutputBuffer (buf) {
  if (!buf) return
  if (buf.texture) gl.deleteTexture(buf.texture)
  if (buf.renderBuffer) gl.deleteRenderbuffer(buf.renderBuffer)
  if (buf.frameBuffer) gl.deleteFramebuffer(buf.frameBuffer)
}
