require 'sinatra'
require "sinatra/reloader"

get '/htmx' do
  content_type 'text/javascript'
  file = File.open("../../src/htmx.js")
  return file.read
end

get '/' do
  "<html>
  <head>
    <script src='htmx'></script>
  </head>
  <body>
    <h1>File Upload Example</h1>
    <form hx-encoding='multipart/form-data' hx-post='/'>
        <input id='fileSelect' type='file' name='file'>
        <button >
            Upload
        </button>
        <progress id='bar' value='0' max='100'></progress>
    </form>
    <script>
        htmx.on('htmx:xhr:progress', function(evt) {
          console.log('Here ' + evt.detail.loaded/evt.detail.total * 100)
          htmx.find('#bar').setAttribute('value', evt.detail.loaded/evt.detail.total * 100)
        });
    </script>
  </body>
  </html>"
end

post '/' do
  tempfile = params['file'][:tempfile]
  return "File Uploaded to #{tempfile.path}..."
end