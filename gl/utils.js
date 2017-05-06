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

      // Pre-compile vertex shader for GPGPU operations.
      // This is to save programmers the trouble of repeating the
      // same vertex shader each time.
      this.vShader = this.gl.createShader(this.gl.VERTEX_SHADER)
      this.gl.shaderSource(this.vShader, GPUUtils.vertexShaderSrc)
      this.gl.compileShader(this.vShader)
      console.log('Compiling vertex shader for matrix scaling')
      let vShaderCompileLog = this.gl.getShaderInfoLog(this.vShader)
      if (vShaderCompileLog) console.log(vShaderCompileLog)

      // Set up beffer for vertex shader
      this.vertexTextureCoordsBuffer = this.gl.createBuffer()
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordsBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(GPUUtils.vertexTextureCoords), this.gl.STATIC_DRAW)
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
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
   * Builds a float WebGLTexture out of the given data.
   * No error checking is done so make sure nRows and nCols are consistent with data.
   * @param {Array<Number>?|Array<Array<Number>>?} data Null if everything si to be set to 0. 1D or 2D array otherwise.
   * @param {Integer} nRows Number of rows in data. Set to 1 for 1D data.
   * @param {Integer} nCols Number of columns in data. Same for both 1D and 2D data.
   */
  makeTexturef (data, nRows, nCols) {
    if (!this.gl) return null

    // Set up texture data
    let textureData
    if (!data) textureData = new Uint8Array(nRows * nCols * 4)
    else if (nRows === 1) textureData = new Uint8Array(new Float32Array(data).buffer)
    else textureData = data.map(row => new Uint8Array(new Float32Array(row).buffer))
      .reduce((res, cur) => {
        let arr = new Uint8Array(res.length + cur.length)
        arr.set(res)
        arr.set(cur, res.length)
        return arr
      }, new Uint8Array(0))

    // Create and initialize texture
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
   * Destroys the given texture and free up resources.
   * @param {WebGLTexture} texture
   */
  destroyTexture (texture) {
    if (!this.gl) return
    this.gl.deleteTexture(texture)
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
   * @param {String} fragmentShaderSrc Source code for fragment shader
   * @return {WebGLProgram} The compiled program. Returns null if WebGL is not supported or compilation fails.
   */
  makeShaderPrograms (fragmentShaderSrc) {
    if (!this.gl) return null

    // Create and compile shader
    let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
    this.gl.shaderSource(fShader, fragmentShaderSrc)
    this.gl.compileShader(fShader)
    console.log('Compiling fragment shader')
    let fShaderCompileLog = this.gl.getShaderInfoLog(fShader)
    if (fShaderCompileLog) console.log(fShaderCompileLog)

    // Stop if any shader compilation fails
    // Assumes that vertex shader compilation succeeds.
    // Else this class should not be used until it is fixed!
    if (fShaderCompileLog) return null

    // Create program
    let program = this.gl.createProgram()
    this.gl.attachShader(program, this.vShader)
    this.gl.attachShader(program, fShader)
    this.gl.linkProgram(program)

    // Set up stuffs for vertex shader
    program.vertexCoordAttribute = this.gl.getAttribLocation(program, 'aVertexCoord')
    program.textureCoordAttribute = this.gl.getAttribLocation(program, 'aTextureCoord')
    this.gl.enableVertexAttribArray(program.vertexCoordAttribute)
    this.gl.enableVertexAttribArray(program.textureCoordAttribute)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordsBuffer)
    this.gl.vertexAttribPointer(program.vertexCoordAttribute, 3, this.gl.FLOAT, this.gl.FALSE, 20, 0)
    this.gl.vertexAttribPointer(program.textureCoordAttribute, 2, this.gl.FLOAT, this.gl.FALSE, 20, 12)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    program.initVShader = () => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordsBuffer)
    }

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

GPUUtils.vertexTextureCoords = [
  -1.0, -1.0, 0.0, 0.0, 0.0,
  1.0, -1.0, 0.0, 1.0, 0.0,
  -1.0, 1.0, 0.0, 0.0, 1.0,
  1.0, 1.0, 0.0, 1.0, 1.0
]

GPUUtils.vertexShaderSrc = `
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

const gpuutils = new GPUUtils()

export default gpuutils
