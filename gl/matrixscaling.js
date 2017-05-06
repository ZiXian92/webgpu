/* gl/matrixscaling.js
 * Defines function to parallelize matrix scaling on GPU.
 */

import gpuutils from './utils.js'

const fragmentShaderSrc =
`
${gpuutils.headerSrc}
uniform sampler2D mtx;
uniform float scaleFactor;

${gpuutils.packValueSrc}

${gpuutils.unpackValueSrc}

void main() {
  // float newValue = scaleFactor*unpack(texture2D(mtx, vTextureCoord).xyzw);
  // gl_FragColor = vec4(pack(newValue), 1);
  gl_FragColor = texture2D(mtx, vTextureCoord);
}
`

let program = gpuutils.makeKernel(fragmentShaderSrc, [
  'mtx', 'scaleFactor'
])

export function scaleMatrix (mtx, numRows, numCols, scaleFactor) {
  // Handle case where imposible to run on GPU
  if (!program) {
    console.log('Unable to prepare GPU-parallel program. Falling back to CPU.')
    return mtx.map(row => row.map(elem => Math.round(elem * scaleFactor * 100.0) / 100.0))
  }

  return program([mtx], [{ name: 'mtx', width: numCols, height: numRows }], {
    scaleFactor: { type: 'float', value: scaleFactor }
  }, numCols, numRows)
}
