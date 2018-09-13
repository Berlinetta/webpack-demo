const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const getClientConfig = require("./webpack-client.js");
const initGulp = require("../common/commonGulpTasks");
const fs = require('fs');

initGulp(gulp);

gulp.task("default", ["clean-lib", "bundle"], (callback) => {

});

gulp.task("bundle", () => {
    return gulp.src("./src/index.js")
        .pipe(webpackStream(getClientConfig(), null, function (err, stats) {
            /* Use stats to do more things if needed */
            //fs.writeFile('./lib/stats.json', JSON.stringify(stats), 'utf8');
        }))
        .pipe(gulp.dest("./lib/"));
});