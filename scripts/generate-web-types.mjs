import fs from 'fs'

const classes = []
const attributes = []
const events = []

const rootPath = fs.existsSync('./www') ? './' : '../'

for (const file of fs.readdirSync(rootPath + 'www/content/attributes').sort()) {
  if (file.startsWith('hx-') && file.endsWith('.md')) {
    const name = file.slice(0, -3)
    const info = readAttributeInfo(name, rootPath + 'www/content/attributes/' + file)
    attributes.push({
      name,
      ...info,
      'doc-url': 'https://htmx.org/attributes/' + name + '/'
    })
  }
}

readClassInfo()
readEventInfo()

const pkg = JSON.parse(fs.readFileSync(rootPath + 'package.json', { encoding: 'utf8' }))

const webTypes = {
  $schema: 'https://json.schemastore.org/web-types',
  name: 'htmx',
  version: pkg.version,
  'default-icon': './htmx.svg',
  'js-types-syntax': 'typescript',
  'description-markup': 'markdown',
  contributions: {
    html: {
      attributes
    },
    css: {
      classes
    },
    js: {
      events: [
        {
          name: 'HTMX event',
          pattern: {
            items: ['/js/htmx-events'],
            template: ['htmx:', '$...', '#item:HTMX event']
          }
        }
      ],
      'htmx-events': events
    }
  }
}

fs.writeFileSync(rootPath + 'editors/jetbrains/htmx.web-types.json', JSON.stringify(webTypes, null, 2))

function readAttributeInfo(name, file) {
  const content = fs.readFileSync(file, { encoding: 'utf8' })

  const isInherited = content.indexOf('`' + name + '` is inherited') !== -1
  const isNotInherited = content.indexOf('`' + name + '` is not inherited') !== -1

  const deprecated = content.indexOf('`' + name + '` has been deprecated') !== -1

  const sections = {}

  if (isInherited) {
    sections.Inherited = ''
  } else if (isNotInherited) {
    sections['Not Inherited'] = ''
  }

  const descSections = /\+\+\+\n(?:[^\n]*\n)+\+\+\+\n\n((?:[^\n]+\n)+)(?:\n((?:[^\n]+\n)+))?(?:\n((?:[^\n]+\n)+))?/mg.exec(content)
  const para1 = descSections[1].trim()
  const para2 = descSections[2]?.trim()
  const para3 = descSections[3]?.trim()

  let description = para1
  if (para2) {
    description += '\n\n' + para2
  }
  if (para2 && para2.endsWith(':') && para3) {
    description += '\n\n' + para3
  }

  let pattern
  if (name === 'hx-on') {
    pattern = {
      or: [
        {
          items: ['/js/events'],
          template: ['hx-on:', '#...', '#item:JS event']
        },
        {
          items: ['/js/htmx-events'],
          template: ['hx-on::', '#...', '#item:HTMX event']
        }
      ]
    }
  }

  return {
    pattern,
    description,
    'description-sections': sections,
    deprecated: deprecated ? true : undefined
  }
}

function readClassInfo() {
  const content = fs.readFileSync(rootPath + 'www/content/reference.md', { encoding: 'utf8' })
  const start = content.indexOf('| Class | Description |')
  const cssTable = content.slice(start, content.indexOf('</div>', start))
  const expr = /\| `([^`]+)` \| ([^\n]+)/mg
  let match = expr.exec(cssTable)
  while (match) {
    const name = match[1]
    if (name && name.startsWith('htmx-')) {
      classes.push({
        name,
        description: match[2].trim(),
        'doc-url': 'https://htmx.org/reference/#classes'
      })
    }
    match = expr.exec(cssTable)
  }
}

function readEventInfo() {
  const content = fs.readFileSync(rootPath + 'www/content/events.md', { encoding: 'utf8' })
  const expr = /### Event - `([^`]+)`[^\n]*\n+((?:(?:[^#\n]|#####)[^\n]*\n+)+)/mg
  let match = expr.exec(content)
  while (match) {
    let name = match[1]
    if (name && name.startsWith('htmx:')) {
      name = name.slice(5)
      events.push({
        name,
        description: match[2],
        'doc-url': 'https://htmx.org/events/#htmx:' + name
      })
    }
    match = expr.exec(content)
  }
}
