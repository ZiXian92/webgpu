/* gl/utils.js
 * COntains utility functions to make WebGL usage more convenient.
 */

let canvas = null
let gl = null

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
