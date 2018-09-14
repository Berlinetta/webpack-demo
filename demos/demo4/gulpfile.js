const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const getClientConfig = require("./webpack-client.js");
const initGulp = require("../common/commonGulpTasks");

initGulp(gulp);

gulp.task("default", ["clean-lib", "bundle"], (callback) => {

});

gulp.task("bundle", () => {
    return gulp.src("./src/index.js")
        .pipe(webpackStream(getClientConfig()))
        .pipe(gulp.dest("./lib/"));
});