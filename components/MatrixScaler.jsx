import React from 'react'
import PropTypes from 'prop-types'

import { scaleMatrix } from '../gl/matrixscaling.js'

const MAX_ROWS = 10
const MAX_COLS = 10

class MatrixScaler extends React.Component {
  constructor () {
    super()
    this.scaleMatrix = this.scaleMatrix.bind(this)
    this.state = {
      scaleFactor: 1
    }
  }

  componentWillMount () {
    // Get and validate matrix size
    let R = this.props.rows
    let C = this.props.cols
    R = R <= 0 ? this.defaultprops.rows : (R > MAX_ROWS ? MAX_ROWS : R)
    C = C <= 0 ? this.defaultprops.cols : (C > MAX_COLS ? MAX_COLS : C)

    // Initialize matrix with random numbers in [0, 1000)
    let mtx = []
    for (let r = 0; r < R; r++) {
      let row = []
      for (let c = 0; c < C; c++) row.push(Math.round(Math.random() * 100000) / 100)
      mtx.push(row)
    }

    this.setState({ mtx, R, C })
  }

  scaleMatrix (evt) {
    evt.preventDefault()
    this.setState({
      mtx: scaleMatrix(this.state.mtx, this.state.R, this.state.C, Number(this.scaleFactorInput.value)),
      scaleFactor: Number(this.scaleFactorInput.value)})
  }

  render () {
    return (
      <div>
        <form className="form-inline" onSubmit={this.scaleMatrix}>
          <div className="form-group">
            <label htmlFor="scaleFactorInput">Scale Factor: </label>
            <input type="nunber" name="scaleFactorInput" className="form-control" defaultValue={this.state.scaleFactor} ref={ref => this.scaleFactorInput = ref} pattern="-?[0-9]+(\.[0-9]+)?" required />
          </div>
          <button type="submit" className="btn btn-primary">Scale</button>
        </form>
        <table className="table table-bordered">
          <tbody>
          {
            this.state.mtx.map((row, r) => (
              <tr key={r}>
                {
                  row.map((elem, c) => (
                    <td key={r + '.' + c}>{elem}</td>
                  ))
                }
              </tr>
            ))
          }
          </tbody>
        </table>
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
