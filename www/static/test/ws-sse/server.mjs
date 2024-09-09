import * as http from 'node:http'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

import { WebSocketServer } from 'ws'

// Define some string and number constants
const HOSTNAME = '127.0.0.1';
const PORT = 8080;
const DATA = JSON.parse(await fs.readFile('./static/data.json'))
const SITE_BASE = (await fs.readFile('./static/site-base.html')).toString()

// Define the websockets
const ECHO_WS = createWebSocket((ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message.toString())
    ws.send(`<div id=idMessage>${data.message}</div>`)
  })
})
const HEARTBEAT_WS = createWebSocket((ws) => {
  ws.interval = setInterval(() => {
    const num = Math.trunc(Math.random() * 10**10)
    ws.send(`<div id=idMessage>${num}</div>`)
  }, 1000)
}, (ws) => clearInterval(ws.interval))


// Define the server
const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res)
  } catch (error) {
    console.error(`Error serving ${req.url}`)
    console.error(req.body)
    console.error(error)
  }
})

// This handles all the non-websocket requests
async function handleRequest (req, res) {
  // If the URL starts with htmx, serve the src/ root version of htmx
  if (req.url.startsWith('/htmx')) {
    const resource = req.url.substring(6)
    res.setHeader('Content-Type', 'text/javascript')
    const fp = path.join('../../src', resource)
    return serveFile(res, fp)
  }

  // If the URL matches one of these, it's an event stream
  if (req.url.startsWith("/posts.html")) return servePosts(req, res)
  if (req.url === "/comments.html") return makeStream(req, res, DATA.comments, formatComment)
  if (req.url === "/albums.html") return makeStream(req, res, DATA.albums, formatAlbum)
  if (req.url === "/todos.html") return makeStream(req, res, DATA.todos, formatTodo)
  if (req.url === "/users.html") return makeStream(req, res, DATA.users, formatUser)

  // Randomly-generated HTML
  if (req.url === "/page/random") return serveRandomHtml(req, res)

  // Otherwise, attempt to serve the file from ./static and return a 404 on failure
  try {
    await serveFileFromStatic(req, res)
  } catch (error) {
    sendNotFound(res)
  }
}

// Attach the websockets
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/echo') ECHO_WS.handle(request, socket, head)
  if (request.url === '/heartbeat') HEARTBEAT_WS.handle(request, socket, head)
})

// Start listening
server.listen(PORT, HOSTNAME, () => {
  console.log('Loading the WebSocket / Server-Side Event Tests...');
  console.log(`You can run them at http://${HOSTNAME}:${PORT}/`);
})

function createWebSocket (connectionFunc, closeFunc) {
  const server = new WebSocketServer({ noServer: true })
  server.on('connection', connectionFunc)
  if (closeFunc) server.on('close', closeFunc)

  const handle = (request, socket, head) => {
    server.handleUpgrade(request, socket, head, (ws) => {
      server.emit('connection', ws, request)
    })
  }
  return { handle }
}

async function serveFileFromStatic (req, res) {
  // For the root, serve the static index.html file
  const resource = req.url === '/' ? '/index.html' : req.url

  let fp = path.join('./static/', resource)
  let lstat = await fs.lstat(fp)

  // If it's a directory, re-set the fp to be the index.html of that directory
  if (lstat.isDirectory()) {
    fp = path.join(fp, 'index.html')
    lstat = await fs.lstat(fp)
  }

  if (!lstat.isFile) return sendNotFound(res)

  const withBase = fp.endsWith('.html')
  return serveFile(res, fp, withBase)
}

async function serveFile (res, fp, withBase) {
  try {
    const file = await fs.readFile(fp)
    let text = file.toString()
    if (withBase) text = SITE_BASE + text
    res.end(text)
  } catch (error) {
    console.error(error)
    sendNotFound(res)
  }
}

function servePosts (req, res) {
  // Why do we have to specify a fake protocol here? Because WHATWG doesn't support relative URLs
  // Maddening discussion here: https://github.com/whatwg/url/issues/531
  const url = new URL(req.url, "thismessage:/")
  const types = url.searchParams?.get('types')

  const numEvents = types ? types.split(',').length : 0
  makeStream(req, res, DATA.posts, formatPost, numEvents)
}

function sendNotFound(res) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain')
  res.end('404 NOT FOUND')
}

function makeStream(req, res, arr, formatFunc, numEvents = 0) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  })

  // Make the intervals somewhat random, between 200 and 400ms
  // We have some tests that create multiple streams at once, so this ensures they're all visibile
  const intervalLength = Math.floor(Math.random() * 200) + 200

  let i = 0
  const interval = setInterval(() => {
    if (i == arr.length) i = 0

    const item = arr[i]
    try {
      const evenNum = Math.floor(Math.random() * numEvents) + 1
      const eventName = numEvents > 0 ? `Event${evenNum}` : '(none)'
      item.event = eventName

      const formattedData = formatFunc(item).replace(/\n/g, ' ')
      const event = `${numEvents > 0 ? `event: ${eventName}\n` : ''}data: ${formattedData}\n\n`
      res.write(event)
      i++
    } catch (error) {
      // Stop the interval if it errors for any reason
      clearInterval(interval)
    }
  }, intervalLength)

  req.on('close', () => {
    res.end('OK')
    clearInterval(interval)
  })
}

function serveRandomHtml(_req, res) {
  const page_num = Math.trunc(Math.random() * 10**10)
  const html_num = Math.trunc(Math.random() * 10**10)
  const html = `
    <div>
      This is page ${page_num}
      <br><br>
      Randomly generated <b>HTML</b> ${html_num}
      <br><br>
      I wish I were a haiku.
    </div>
  `
  res.end(html)
}

function formatPost (post) {
  return `
  <div>
    <div class="bold">Post: ${post.title}</div>
    <div>${post.body}</div>
    <div>id: ${post.id}</div>
    <div>user: ${post.userId}</div>
    <div>event: ${post.event}</div>
  </div>
  `
}

function formatComment (comment) {
  return `
  <div>
    <div class="bold">Comment: ${comment.name}</div>
    <div>${comment.email}</div>
    <div>id: ${comment.body}</div>
    <div>event: ${comment.event}</div>
  </div>
  `
}

function formatAlbum (album) {
  return `
  <div>
    <div class="bold">Album: ${album.title}</div>
    <div>id: ${album.id}</div>
    <div>event: ${album.event}</div>
  </div>
  `
}

function formatTodo (todo) {
  return `
  <div>
    <div class="bold">To-Do: ${todo.title}</div>
    <div>complete? ${todo.completed}</div>
    <div>event: ${todo.event}</div>
  </div>
  `
}

function formatUser (user) {
  return `
  <div>
    <div class="bold">User: ${user.name}</div>
    <div>${user.email}</div>
    <div>${user.address.street} ${user.address.suite}<br>${user.address.city}, ${user.address.zipcode}</div>
    <div>event: ${user.event}</div>
  </div>
  `
}

