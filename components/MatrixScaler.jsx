import React from 'react'
import PropTypes from 'prop-types'

import Matrix from './Matrix.jsx'
import { scaleMatrix } from '../gl/matrixscaling.js'

const MAX_ROWS = 10
const MAX_COLS = 10

class MatrixScaler extends React.Component {
  constructor () {
    super()
    this.scaleMatrix = this.scaleMatrix.bind(this)
    this.benchmark = this.benchmark.bind(this)
    this.state = {
      scaleFactor: 1
    }
  }

  initMatrix (nRows, nCols) {
    let mtx = []
    for (let r = 0; r < nRows; r++) {
      let row = []
      for (let c = 0; c < nCols; c++) row.push(Math.round(Math.random() * 100000) / 100)
      mtx.push(row)
    }
    return mtx
  }

  componentWillMount () {
    // Get and validate matrix size
    let R = this.props.rows
    let C = this.props.cols
    R = R <= 0 ? this.defaultprops.rows : (R > MAX_ROWS ? MAX_ROWS : R)
    C = C <= 0 ? this.defaultprops.cols : (C > MAX_COLS ? MAX_COLS : C)

    // Initialize matrix with random numbers in [0, 1000)
    let mtx = this.initMatrix(R, C)

    this.setState({ mtx, R, C })
  }

  scaleMatrix (evt) {
    evt.preventDefault()
    let mtx = scaleMatrix(this.state.mtx, this.state.R, this.state.C, Number(this.scaleFactorInput.value))
    mtx = mtx.map(row => row.map(elem => Math.round(elem * 100.0) / 100.0))
    this.setState({
      mtx,
      scaleFactor: Number(this.scaleFactorInput.value)
    })
  }

  benchmark (evt) {
    let sizes = [2, 4, 8, 16, 32, 64, 1024]
    let sf = 27
    sizes.forEach(s => {
      let m = this.initMatrix(s, s)
      let st = performance.now()
      scaleMatrix(m, s, s, sf, 0)
      let et = performance.now()
      console.log(`CPU took ${et - st} ms to scale order ${s} matrix`)
      st = performance.now()
      scaleMatrix(m, s, s, sf, 1)
      et = performance.now()
      console.log(`GPU took ${et - st} ms to scale order ${s} matrix`)
    })
  }

  render () {
    return (
      <div className="container-fluid">
        <div className="row">
          <form className="form-inline" onSubmit={this.scaleMatrix}>
            <div className="form-group">
              <label htmlFor="scaleFactorInput">Scale Factor: </label>
              <input type="nunber" name="scaleFactorInput" className="form-control" defaultValue={this.state.scaleFactor} ref={ref => this.scaleFactorInput = ref} pattern="-?[0-9]+(\.[0-9]+)?" required />
            </div>
            <button type="submit" className="btn btn-primary">Scale</button>
            <button type="button" className="btn btn-success" onClick={this.benchmark}>Benchmark</button>
          </form>
        </div>
        <div className="row">
          <Matrix className="col-sm-10 col-sm-offset-1" data={this.state.mtx} rows={this.state.R} cols={this.state.C} />
        </div>
      </div>
    )
  }
}

MatrixScaler.propTypes = {
  rows: PropTypes.number,
  cols: PropTypes.number
}

MatrixScaler.defaultprops = {
  rows: 3,
  cols: 3
}

export default MatrixScaler
