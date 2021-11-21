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
    <script src='https://unpkg.com/hyperscript.org@0.0.2/dist/_hyperscript.js'></script>
  </head>
  <body>
    <h1>File Upload Example2</h1>
    <h2>Plain Javascript</h2>
    <form id='form1' hx-encoding='multipart/form-data' hx-post='/'>
        <input id='file' type='file' name='file'>
        <button >
            Upload
        </button>
        <progress id='progress1' value='0' max='100'></progress>
    </form>
    <script>
        htmx.on('#form1', 'htmx:xhr:progress', function(evt) {
          htmx.find('#progress1').setAttribute('value', evt.detail.loaded/evt.detail.total * 100)
        });
    </script>
    <h2>Hyperscript</h2>
    <form hx-encoding='multipart/form-data' hx-post='/'
          _='on htmx:xhr:progress(loaded, total) set #progress2.value to (loaded/total)*100'>
        <input id='file2' type='file' name='file'>
        <button >
            Upload
        </button>
        <progress id='progress2' value='0' max='100'></progress>
    </form>

  </body>
  </html>"
end

post '/' do
  tempfile = params['file'][:tempfile]
  return "File Uploaded to #{tempfile.path}..."
end