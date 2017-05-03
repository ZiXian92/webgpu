import React from 'react'
import { render } from 'react-dom'
import { initGL } from './gl/utils.js'

import MatrixScaler from './components/MatrixScaler.jsx'

const App = (props, context) => (
  <div>
    <div className="jumbotron">
      <h1>Web GPU Examples</h1>
      <p>Simple examples of GPU parallelizable stuff on web page.</p>
    </div>
    <MatrixScaler rows={5} cols={5}></MatrixScaler>
  </div>
);

let gl = initGL()

render(<App></App>, document.getElementById('app'))
