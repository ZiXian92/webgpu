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
    }
    if (!gl) console.log('Unable to get WebGL context.')
    return gl
  }

  // Attempt to get WebGL context for specified canvas so we can do GL and SL stuffs
  let finalGl = userCanvas.getContext('webgl') || userCanvas.getContext('experimental-webgl')
  if (!finalGl) console.log('Unable to get WebGL context.')

  return finalGl
}
