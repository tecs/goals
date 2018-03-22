const gulp = require('gulp');
const sass = require('gulp-sass');
const fs = require('fs');
const webserver = require('gulp-webserver');

gulp.task('default', ['sass']);

gulp.task('sass', function () {
    if (fs.existsSync('css/style.css')) {
        fs.unlinkSync('css/style.css');
    }
    return gulp.src('scss/*.scss')
        .pipe(sass({outputStyle: 'compact'})
        .on('error', sass.logError))
        .pipe(gulp.dest('css'));
});

gulp.task('watch', function () {
    gulp.watch('scss/*.scss', ['sass']);
    gulp.src('.').pipe(webserver({
        directoryListing: true,
        host: '0.0.0.0'
    }));
});
