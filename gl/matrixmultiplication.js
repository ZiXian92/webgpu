/**
 * gl/matrixmultiplication.js
 */

import gpuutils from './utils.js'

const fragmentShaderSrc = `
${gpuutils.headerSrc}
uniform sampler2D mtx1;
uniform sampler2D mtx2;
uniform int width1;
${gpuutils.packValueSrc}
${gpuutils.unpackValueSrc}
void main() {
  float increment = 1.0 / float(width1);
  float startCoord =  increment / 2.0;
  vec2 mtx1Coord = vec2(startCoord, vTextureCoord.t);
  vec2 mtx2Coord = vec2(vTextureCoord.s, startCoord);
  float ans = unpackValue(texture2D(mtx1, mtx1Coord)) * unpackValue(texture2D(mtx2, mtx2Coord));
  for(int k=1; k<2048; k++) {
    if (k >= width1) break;
    mtx1Coord.s += increment;
    mtx2Coord.t += increment;
    ans += unpackValue(texture2D(mtx1, mtx1Coord)) * unpackValue(texture2D(mtx2, mtx2Coord));
  }
  gl_FragColor = packValue(ans);
}
`

let program = gpuutils.makeKernel(fragmentShaderSrc, [
  'mtx1', 'mtx2', 'width1'
])

export default function matrixMultiply (mtx1, mtx2, w1, h1, w2, h2, useGPU = 0) {
  if (!useGPU || !program) {
    if (!program) console.log('WebGL not supported. Falling back to CPU')
    console.log('Matrix multiplication using CPU')

    // Initialize result matrix
    let mtx = []
    for (let r = 0; r < h1; r++) {
      let row = []
      for (let c = 0; c < w2; c++) row.push(0)
      mtx.push(row)
    }

    // Compute each element in result matrix
    for (let i = 0; i < h1; i++)
      for (let j = 0; j < w2; j++)
        for (let k = 0; k < w1; k++)
          mtx[i][j] += mtx1[i][k] * mtx2[k][j]
    return mtx
  }

  return program([mtx1, mtx2], [{
    name: 'mtx1', width: w1, height: h1
  }, {
    name: 'mtx2', width: w2, height: h2
  }], {
    width1: { type: 'int', value: w1 }
  }, w2, h1)
}
