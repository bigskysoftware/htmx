import gulp from 'gulp';
import { rimrafSync } from 'rimraf'
import terser from 'gulp-plugin-terser';
import umd from 'gulp-umd';
import gzip from 'gulp-gzip';

function clean(cb) {
    rimrafSync('dist/')
    cb();
}

function build() {
    return gulp
        .src('src/*.js')
        // umd
        .pipe(umd({
          template: 'src/.wrapper'
        }))
        .pipe(gulp.dest('dist'))
        // minify
        .pipe(terser({
          suffix: '.min.js'
        }))
        .pipe(gulp.dest('dist'))
        // gzip
        .pipe(gzip({
          extension: 'gz',
          level: 9
        }))
        .pipe(gulp.dest('dist'));
}

function buildExtensions() {
    return gulp
        .src('src/ext/*.js')
        // umd
        .pipe(umd({
          template: 'src/ext/.wrapper'
        }))
        .pipe(gulp.dest('dist/ext'))
        // minify
        .pipe(terser({
          suffix: '.min.js'
        }))
        .pipe(gulp.dest('dist/ext'))
        // gzip
        .pipe(gzip({
          extension: 'gz',
          level: 9
        }))
        .pipe(gulp.dest('dist/ext'));
}

function copyTs() {
    return gulp
        .src('src/*.ts')
        .pipe(gulp.dest('dist'));
}

export default gulp.series(clean, build, buildExtensions, copyTs);
