/**
 * components/Matrix.jsx
 * Defines view component to display matrix in table form
 * @author zixian92
 */

import React from 'react'
import PropTypes from 'prop-types'

const Matrix = (props, context) => (
  <div className={props.className}>
    <table className="table table-bordered">
      <tbody>
      {
        props.data.map((row, r) => (
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

Matrix.propTypes = {
  data: PropTypes.array.isRequired,
  rows: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired
}

export default Matrix
