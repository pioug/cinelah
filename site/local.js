var budo = require('budo');
var babelify = require('babelify');

budo('./index.js', {
  css: 'style.css',
  live: true,
  port: 8080,
  browserify: {
    transform: babelify
  }
}).on('connect', function (ev) {
  console.log('Server running on %s', ev.uri)
  console.log('LiveReload running on port %s', ev.livePort)
}).on('update', function (buffer) {
  console.log('bundle - %d bytes', buffer.length)
});
