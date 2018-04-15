const gulp = require('gulp');
const http = require('http');
const sass = require('gulp-sass');
const fs = require('fs');
const webserver = require('gulp-webserver');

gulp.task('default', ['sass']);

gulp.task('sass', () => {
    if (fs.existsSync('css/style.css')) {
        fs.unlinkSync('css/style.css');
    }
    return gulp.src('scss/*.scss')
        .pipe(sass({outputStyle: 'compact'})
        .on('error', sass.logError))
        .pipe(gulp.dest('css'));
});

gulp.task('webserver', () => {
    const stream = gulp.src('.')
        .pipe(webserver({
            directoryListing: true,
            host: '0.0.0.0',
            middleware: (req, res, next) => {
                if (/_kill_\/?/.test(req.url)) {
                    res.end();
                    stream.emit('kill');
                }
                next();
            }
        }));
});

gulp.task('webserver-kill', callback => {
    http.request('http://localhost:8000/_kill_').on('close', callback).end();
});

gulp.task('watch', () => {
    gulp.watch('scss/*.scss', ['sass']);
    gulp.start('webserver');
});
