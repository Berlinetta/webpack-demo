const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const {getServerConfig, getClientConfig} = require("./webpack-client.js");
const initGulp = require("../common/commonGulpTasks");

initGulp(gulp);

gulp.task("default", ["clean-lib", "bundle-server", "bundle-client"], (callback) => {

});

gulp.task("bundle-server", () => {
    return gulp.src("./src/index.js")
        .pipe(webpackStream(getServerConfig()))
        .pipe(gulp.dest("./lib/"));
});

gulp.task("bundle-client", () => {
    return gulp.src("./src/index.js")
        .pipe(webpackStream(getClientConfig()))
        .pipe(gulp.dest("./lib/"));
});