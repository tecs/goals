const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const fs = require('fs');
const webserver = require('gulp-webserver');

exports.sass = () => {
    if (fs.existsSync('css/style.css')) {
        fs.unlinkSync('css/style.css');
    }
    return gulp.src('scss/*.scss')
        .pipe(sass({outputStyle: 'expanded'})
        .on('error', sass.logError))
        .pipe(gulp.dest('css'));
};

exports.webserver = () => gulp.src('.').pipe(webserver({
    directoryListing: true,
    host: '0.0.0.0'
}));

exports.watch = gulp.parallel(() => gulp.watch('scss/*.scss', exports.sass), exports.webserver);

exports.default = exports.sass;
