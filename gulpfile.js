const gulp = require('gulp');
const del = require('del');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./config/webpack.config.js');

const named = require('vinyl-named');
const vueify = require('gulp-vueify2');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');

// Clean assets
function clean() {
  return del(['build/']);
}

// SASS task
function scss() {
  return gulp
    .src('src/scss/index.scss')
    .pipe(sass())
    .pipe(gulp.dest('build/css/'));
}

// JS & VUE task
function js() {
  return gulp
    .src('src/main.js')
    .pipe(named())
    .pipe(vueify())
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(gulp.dest('build/'));
}

// Watch files
function watchFiles() {
  gulp.watch('src/scss/**/*', scss);
  gulp.watch('src/libs/*.js', js);
  gulp.watch('src/main.js', js);
  gulp.watch('src/store/index.js', js);
  gulp.watch('src/**/*.vue', js);
}

const build = gulp.series(clean, gulp.parallel(scss, js));
const watch = gulp.parallel(watchFiles);

exports.build = build;
exports.watch = watch;