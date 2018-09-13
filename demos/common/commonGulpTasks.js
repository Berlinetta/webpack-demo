const rimraf = require("gulp-rimraf");

const register = (gulp) => {
    gulp.task("clean-lib", () => {
        return gulp.src("./lib/*", {read: false}).pipe(rimraf({force: true}));
    });
};

module.exports = register;