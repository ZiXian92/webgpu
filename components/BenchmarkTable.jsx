/**
 * components/BenchmarkTable.jsx
 * Defines the view component for displaying benchmark results.
 * @author zixian92
 */

import React from 'react'
import PropTypes from 'prop-types'

const BenchmarkTable = (props, context) => (
  <table className="table table-bordered">
  <thead>
    <tr>
      <th>Matrix Size</th>
      <th>CPU Time(ms)</th>
      <th>GPU Time(ms)</th>
    </tr>
  </thead>
  <tbody>
  {
    props.scores.map((r, i) => (
      <tr key={i}>
        {
          r.map((e, j) => (
            <td key={i + '.' + j}>{e}</td>
          ))
        }
      </tr>
    ))
  }
  </tbody>
  </table>
)

BenchmarkTable.propTypes = {
  scores: PropTypes.array.isRequired
}

export default BenchmarkTable
