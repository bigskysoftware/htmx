import terser from "@rollup/plugin-terser"
import copy from 'rollup-plugin-copy'
import gzipPlugin from 'rollup-plugin-gzip'

// TODO: gz

export default [
  // Unminified
  {
    input: "src/htmx.js",
    output: [
      // ES module build for modern browsers
      {
        file: 'dist/htmx.esm.js',
        format: 'es'
      },
      // UMD build for browsers
      {
        name: 'htmx',
        file: 'dist/htmx.js',
        format: 'umd'
      }
    ]
  },

  // Minified, using terser
  {
    input: "src/htmx.js",
    output: [
      // ES module build for modern browsers
      {
        file: "dist/htmx.esm.min.js",
        format: "es",
        sourcemap: true
      },
      // UMD build for browsers
      {
        name: 'htmx',
        file: "dist/htmx.min.js",
        format: "umd",
        sourcemap: true
      },
    ],
    plugins: [
      terser(),
      gzipPlugin({
        level: 9,
      }),
      copy({
        targets: [
          { src: 'src/htmx.d.ts', dest: 'dist' },
          { src: 'src/htmx.test.ts', dest: 'dist' },
          { src: 'src/ext/**/*', dest: 'dist/ext' },
        ]
      })
    ]
  }
]
