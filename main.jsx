import React from 'react'
import { render } from 'react-dom'

import MatrixScaler from './components/MatrixScaler.jsx'
import MatrixMultiplier from './components/MatrixMultiplier.jsx'

const App = (props, context) => (
  <div>
    <div className="jumbotron">
      <h1>Web GPU Examples</h1>
      <p>Simple examples of GPU parallelizable stuff on web page.</p>
    </div>
    <MatrixScaler rows={5} cols={5} />
    <MatrixMultiplier />
  </div>
)

render(<App />, document.getElementById('app'))
