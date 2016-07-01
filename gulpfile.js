const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const through2 = require('through2');
const browsersync = require('browser-sync');
const reload = browsersync.reload;
const browserify = require('browserify');
const babelify = require('babelify');

gulp.task('serve', ['html'], () => {
  sync({
    notify: false,
    port: port,
    server: {
      baseDir: ['./dist'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })

  gulp.watch(['./app/**/*.js', './app/*.html', './app/**/*.scss'], ['html']).on('change', reload);
});

gulp.task('javascript', () => {
  return gulp.src('app/js/**/*.js')
    .pipe(through2.obj((file, enc, next) => { // workaround for https://github.com/babel/babelify/issues/46
      browserify({
        entries: file.path,
        extensions: ['.js', '.jsx'],
        debug: true,
        transform: [
          babelify
        ]
      }).bundle((err, res) => {
        if (err) return next(err);
        file.contents = res;
        next(null, file);
      });
    }))
    .on('error', gutil.log)
    .pipe(gulp.dest('dist/js/'))
});

gulp.task('stylesheets', () => {
  return gulp.src('app/stylesheets/**/*.scss')
    .pipe($.sass())
    .pipe($.postcss([
      require('autoprefixer')({browsers: ['last 2 versions', 'Firefox ESR', 'Explorer >= 9', 'Android >= 4.0', '> 2%']})
    ]))
    .pipe(gulp.dest('dist/css/'))
});

gulp.task('html', ['javascript', 'stylesheets', 'stl'], () => {
    return gulp.src('app/*.html')
      .pipe($.useref({}))
      .pipe(gulp.dest('dist'))
});

