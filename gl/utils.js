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
    if (this.gl) this.gl.viewport(0, 0, width, height)
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
    if (vShaderCompileLog) console.log(vShaderCompileLog)
    vShader = this.gl.getShaderParameter(vShader, this.gl.COMPILE_STATUS) ? vShader : null
    console.log('Compiling fragment shader for matrix scaling')
    let fShaderCompileLog = this.gl.getShaderInfoLog(fShader)
    if (fShaderCompileLog) console.log(fShaderCompileLog)
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

const gpuutils = new GPUUtils()

export default gpuutils
