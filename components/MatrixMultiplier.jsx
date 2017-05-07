/**
 * components/MatrixMultiplier.jsx
 * @author zixian92
 */

import React from 'react'

import Matrix from './Matrix.jsx'

export default class MatrixMultiplier extends React.Component {
  constructor () {
    super()
    this.N1 = 4
    this.M1 = this.N2 = 5
    this.M2 = 6
    let mtx1 = this.initMatrix(this.N1, this.M1)
    let mtx2 = this.initMatrix(this.N2, this.M2)
    this.state = {
      mtx1, mtx2
    }
  }

  initMatrix (nRows, nCols) {
    let mtx = []
    for (let r = 0; r < nRows; r++) {
      let row = []
      for (let c = 0; c < nCols; c++) row.push(Math.round(Math.random() * 100000) / 100)
      mtx.push(row)
    }
    return nRows < 2 ? mtx[0] : mtx
  }

  render () {
    return (
      <div className="container-fluid">
        <div className="row">
          <Matrix className="col-4 col-offset-1" data={this.state.mtx1} rows={this.N1} cols={this.M1} />
          <Matrix className="col-4 col-offset-7" data={this.state.mtx2} rows={this.N2} cols={this.M2} />
        </div>
      </div>
    )
  }
}
