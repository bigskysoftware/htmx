## Running The Website Locally

The htmx.org website is built with [Zola](https://www.getzola.org/).
To run the site, [install Zola](https://www.getzola.org/documentation/getting-started/installation/); then, from the root of the repository:

```
cd www
zola serve
```

The site should then be available at <http://localhost:1111>

## Folder Structure

- `content/` - markdown content for the site (docs, examples, essays, attributes, etc.)
- `templates/` - zola HTML templates (base, page, section layouts)
  - `shortcodes/` - template components that can be used in markdown
- `static/` - static assets: images (`img/`), JavaScript (`js/`), etc
- `themes/htmx-theme/` - the htmx zola theme
  - `static/css/` - stylesheets (`site.css`, `os9.css`)
  - `static/js/` - js files (htmx.js, _hyperscript.js, etc.)
  - `templates/` - theme-specific templates
- `config.toml` - zola config file
- `public/` - generated output (created by `zola build`)
