import React from 'react'
import PropTypes from 'prop-types'

export default class Matrix extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    return (
      <div className={this.props.className}>
        <table className="table table-bordered">
          <tbody>
          {
            this.props.data.map((row, r) => (
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

Matrix.propTypes = {
  data: PropTypes.array.isRequired,
  rows: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired
}
