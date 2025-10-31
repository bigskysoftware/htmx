## Running The Website Locally

The htmx.org website is built with [Zola](https://www.getzola.org/).

Use `npm run site` to run the site locally. 

The site will be available at http://localhost:1111

## Folder Structure

- `content/` - markdown content for the site (docs, examples, essays, attributes, etc.)
- `templates/` - zola HTML templates (base, page, section layouts)
  - `shortcodes/` - template components that can be used in markdown
- `static/` - static assets: images (`img/`), JavaScript (`js/`), stylesheets (`css/`)
- `config.toml` - zola config file
- `syntax-theme.tmTheme` - TextMate syntax highlighting theme for code blocks in Markdown
- `public/` - generated output (created by `zola build`)
