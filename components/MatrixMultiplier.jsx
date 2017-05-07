/**
 * components/MatrixMultiplier.jsx
 * @author zixian92
 */

import React from 'react'

import matrixMultiply from '../gl/matrixmultiplication.js'

import Matrix from './Matrix.jsx'

export default class MatrixMultiplier extends React.Component {
  constructor () {
    super()
    this.multiplyMatrices = this.multiplyMatrices.bind(this)
    this.N1 = 4
    this.M1 = this.N2 = 5
    this.M2 = 6
    let mtx1 = this.initMatrix(this.N1, this.M1)
    let mtx2 = this.initMatrix(this.N2, this.M2)
    let outMtx = this.initMatrix(this.N1, this.M2, 0)
    this.state = {
      mtx1, mtx2, outMtx
    }
  }

  initMatrix (nRows, nCols, fillValue = null) {
    let mtx = []
    for (let r = 0; r < nRows; r++) {
      let row = []
      for (let c = 0; c < nCols; c++) row.push(fillValue === null ? Math.round(Math.random() * 100000) / 100.0 : fillValue)
      mtx.push(row)
    }
    return nRows < 2 ? mtx[0] : mtx
  }

  multiplyMatrices (evt) {
    let outMtx = matrixMultiply(this.state.mtx1, this.state.mtx2, this.M1, this.N1, this.M2, this.N2, 1)
    this.setState({
      outMtx
    })
  }

  render () {
    return (
      <div className="container-fluid">
        <h2>Matrix Multiplication</h2>
        <h3>Inputs</h3>
        <div className="row">
          <Matrix className="col-sm-4 col-sm-offset-1" data={this.state.mtx1} rows={this.N1} cols={this.M1} />
          <Matrix className="col-sm-4 col-sm-offset-1" data={this.state.mtx2} rows={this.N2} cols={this.M2} />
        </div>
        <h3>Output</h3>
        <div className="row">
          <Matrix className="col-sm-10 col-sm-offset-1" data={this.state.outMtx} rows={this.N1} cols={this.M2} />
        </div>
        <div className="text-center">
          <button className="btn btn-primary" onClick={this.multiplyMatrices}>Compute</button>
        </div>
      </div>
    )
  }
}
