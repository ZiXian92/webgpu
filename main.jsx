import React from 'react'
import { render } from 'react-dom'

const App = (props, context) => (
  <div>
    <div className="jumbotron">
      <h1>Web GPU Examples</h1>
      <p>Simple examples of GPU parallelizable stuff on web page.</p>
    </div>
  </div>
);

render(<App></App>, document.getElementById('app'))
