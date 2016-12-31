'use strict';

/**
 * Imports
 */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleancss = require('gulp-clean-css');

/**
 * Build task for minified JS
 */
gulp.task('build:js', function() {
  gulp.src('src/js/tabletrim.js')
    .pipe(uglify())
    .pipe(rename('tabletrim.min.js'))
    .pipe(gulp.dest('src/js'));
});

/**
 * Build task for minified CSS
 */
gulp.task('build:css', function() {
  gulp.src('src/css/tabletrim.css')
    .pipe(cleancss())
    .pipe(rename('tabletrim.min.css'))
    .pipe(gulp.dest('src/css'));
}),

/**
 * Build task
 */
gulp.task('build', ['build:js', 'build:css']);

/**
 * Default task (watch for changes and rebuild dev assets)
 */
gulp.task('watch', ['build'], function() {
	gulp.watch('src/js/tabletrim.js', ['build']);
  gulp.watch('src/css/tabletrim.css', ['build']);
});
