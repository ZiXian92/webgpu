var gulp = require('gulp')
var webpack = require('webpack')

gulp.task('default', ['compile-js'], function () {

})

gulp.task('compile-js', function () {
  return webpack({
    entry: './main.jsx',
    output: { path: __dirname+'/js', filename: 'main.js'},
    module: {
      loaders: [
        {
          test: /.jsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
    }
  }, function (err, stats) {
    if (err) console.log(err)
  })
})

gulp.task('dev-build', ['compile-js'], function () {
  gulp.watch(['./main.jsx', './components/**/*', './pages/**/*', './gl/**/*'], ['compile-js'])
})
