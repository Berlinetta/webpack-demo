const gulp = require("gulp");
const babelify = require('babelify');
const cleanCSS = require('gulp-clean-css');
const nodemon = require('gulp-nodemon');
const gulpSequence = require("gulp-sequence");
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
//const cssmodulesify = require("mdc-css-modulesify");
const cssmodulesify = {};
const mkdirp = require('mkdirp');
const rimraf = require("gulp-rimraf");
const buffer = require('vinyl-buffer');
const rename = require("gulp-rename");
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const colors = require('colors/safe');
const path = require('path');
const watchify = require('watchify');
const eslint = require("gulp-eslint");
const checkLessStructure = require("./style-lint");
const gulpStylelint = require("gulp-stylelint");
const React = require("react");
const webpackStream = require("webpack-stream");
const {getServerConfig, getClientConfig} = require("./webpack.config.js");

const DOCS_OUT_DIR = "public";
const LIB_OUT_DIR = "lib";

gulp.task("clean-lib", () => {
    return gulp.src([LIB_OUT_DIR], { read: false }).pipe(rimraf({ force: true }));
});

gulp.task("clean-docs", () => {
    return gulp.src([DOCS_OUT_DIR + "/js", DOCS_OUT_DIR + "/css", DOCS_OUT_DIR + "/fonts", 
        DOCS_OUT_DIR + "/images", DOCS_OUT_DIR + "/specs", DOCS_OUT_DIR + "/index.html", DOCS_OUT_DIR + "/sample.png"], 
        { read: false }).pipe(rimraf({ force: true }));
});

gulp.task("lint", () => {
    return gulp.src(["**/*.js", "!node_modules/**/*", "!public/**/*", "!lib/**/*", "!eslint-files/**/*"])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("prepare-docs", () => {
    mkdirp(`${DOCS_OUT_DIR}/css/`, (err) => {
        if (err) {
            console.error(`failed to create css output dir: ${`${DOCS_OUT_DIR}/css/`}: ${err}`);
        } 
    });
});

const copyFiles = (src, dest) => {
    return gulp.src(src)
        .pipe(gulp.dest(dest));
};

const copyImagesForDocs = () => {
    copyFiles("./src/images/**", `${DOCS_OUT_DIR}/images`);
};

const copySpecsForDocs = () => {
    copyFiles("./demo/specs/**", `${DOCS_OUT_DIR}/specs`);
};

const copyImagesForLib = () => {
    copyFiles("./src/images/**", `${LIB_OUT_DIR}/images`);
};

const copyFontsForDocs = () => {
    copyFiles("./src/fonts/**", `${DOCS_OUT_DIR}/fonts`);
};

const copyFontsForLib = () => {
    copyFiles("./src/fonts/**", `${LIB_OUT_DIR}/fonts`);
};

gulp.task("copy-specs-for-docs", copySpecsForDocs);
gulp.task("copy-images-for-docs", copyImagesForDocs);
gulp.task("copy-images-for-lib", copyImagesForLib);
gulp.task("copy-fonts-for-docs", copyFontsForDocs);
gulp.task("copy-fonts-for-lib", copyFontsForLib);

gulp.task("copy-site-static", () => {
    gulp.src('./demo/site/**')
        .pipe(gulp.dest(DOCS_OUT_DIR));

    gulp.src('./demo/api/**')
        .pipe(gulp.dest(`${DOCS_OUT_DIR}/api`));
});

gulp.task("copy-baseStyles-for-lib", () => {
    gulp.src('./src/baseStyles/**')
        .pipe(gulp.dest(`${LIB_OUT_DIR}/baseStyles`));
});

const vendors = [
    "lodash",
    // "lodash.keys",
    // "lodash._getnative",
    // "lodash.isarray",
    // "lodash.isarguments",
    "codemirror",
    "babel-standalone",
    "babel-polyfill",
    "codemirror/mode/jsx/jsx",
    "react",
    "react-clonewithprops",
    "react-dom",
    "react-router",
    "redux",
    "react-redux",
    "moment",
    "moment-range",
    "eventlistener",
    "cellblock",     
    "autolinker",
    "eventlistener",
    "object-assign",
    "recursive-readdir-sync",
    "remarkable",
    "superagent",
    "classnames"
];

const getDocsBrowserifyConfig = () => {
    return { 
        entries: ["./demo/index.js"],
        extensions: ['.js'],
        basedir: '.',
        debug: true,
        cache: {},
        packageCache: {}
    };
};

const getDocsBundlerInstance = (opts) => {
    const b = 
    browserify(opts)
    .on('file', (file) => {
        if (file.match(/node_modules/) &&
            !file.match(/shallowequal/) &&
            !file.match(/lodash.keys/) &&
            !file.match(/lodash._getnative/) &&
            !file.match(/lodash.isarguments/) &&
            !file.match(/lodash.isarray/)) {
            console.log(colors.yellow(`Warning! 'node_modules${file.split("node_modules")[1]}' should be external`));
        }
    })
    .external(vendors)
    .plugin(cssmodulesify, {
        rootDir: __dirname,
        output: `${DOCS_OUT_DIR}/css/app.css`,
        generateScopedName: cssmodulesify.generateShortName,
        verbose: false
    })
    .transform(babelify.configure({
        babelrc: false,
        presets: ['react', 'es2015', "stage-0"],
        extensions: ['.js']
    }))
    .transform('brfs');

    return b;
};

const getStylelintFunc = () => {
    return () => {
        const styleLintConfig = {
            failAfterError: true,
            reporters: [
                {formatter: "string", console: true}
            ]
        };
        return gulp.src("./src/**/*.less").pipe(gulpStylelint(styleLintConfig));
    };
};

gulp.task("docs-bundler-watchify", () => {
    const opts = getDocsBrowserifyConfig();
    opts.plugin = [watchify];

    const b = getDocsBundlerInstance(opts);

    const bundle = () => {
        return b
        .bundle()
        .on('error', (e) => { 
            console.log(e); 
        })
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest(DOCS_OUT_DIR + "/js"));
    };

    b.on('update', bundle);
    
    return bundle();
});

gulp.task("docs-bundler", () => {
    return getDocsBundlerInstance(getDocsBrowserifyConfig())
        .bundle()
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest(DOCS_OUT_DIR + "/js"));
});

gulp.task("vendor-bundler", () => {
    const b = browserify({
        debug: true,
        cache: {},
        packageCache: {}
    });

    vendors.forEach((lib) => {
        b.require(lib);
    });
 
    b.bundle()
    .pipe(source("vendor.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./', {sourceRoot: '/js/vendor'})) // writes .map file
    .pipe(gulp.dest(DOCS_OUT_DIR + "/js"));
});

gulp.task("lib-node-bundler", () => {
    mkdirp(LIB_OUT_DIR, (err) => {
        if (err) {
            console.error(`failed to create css output dir: ${LIB_OUT_DIR}: ${err}`);
        } 
    });

    const b = browserify({ 
        entries: ["./src/index.js"],
        extensions: ['.js'],
        basedir: '.',
        debug: true,
        cache: {},
        packageCache: {},
        standalone: "mdc-neptune"
    })
    .on('file', (file) => {
        if (file.match(/node_modules/) &&
            !file.match(/shallowequal/) &&
            !file.match(/lodash.keys/) &&
            !file.match(/lodash._getnative/) &&
            !file.match(/lodash.isarguments/) &&
            !file.match(/lodash.isarray/)) {
            console.log(colors.yellow(`Warning! 'node_modules${file.split("node_modules")[1]}' should be external`));
        }
    })
    .external(vendors)
    .plugin(cssmodulesify, {
        rootDir: __dirname,
        output: `${LIB_OUT_DIR}/mdc-neptune.css`,
        generateScopedName: cssmodulesify.generateShortName,
        verbose: false
    })
    .transform(babelify.configure({
        babelrc: false,
        presets: ['react', ["es2015", { "loose": true }], 'stage-0'],
        extensions: ['.js']
    }));

    return b
        .bundle()
        .pipe(source("mdc-neptune.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest(LIB_OUT_DIR));
});

gulp.task("lib-browser-bundler", () => {
    const b = browserify({ 
        entries: ["./src/client.js"],
        extensions: ['.js'],
        basedir: '.',
        debug: true,
        cache: {},
        packageCache: {},
        standalone: "mdcNeptuneLib"
    })
    //"cellblock": "global:cellblock", -- refactor this to use new UMD MA.Content.Libs.MdcCellblock (remove filter)
    .external(vendors.filter((vendor) => { return vendor !== 'cellblock'; }))
    .plugin(cssmodulesify, {
        rootDir: __dirname,
        //output: `${LIB_OUT_DIR}/mdc-neptune.css`, // CSS does not change for browser version
        generateScopedName: cssmodulesify.generateShortName,
        verbose: false
    })
    .transform(babelify.configure({
        babelrc: false,
        presets: ['react', 'es2015', "stage-0"],
        extensions: ['.js']
    }))
    .transform("browserify-shim");

    return b
        .bundle()
        .pipe(source("mdc-neptune-client.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest(LIB_OUT_DIR));
});

gulp.task("uglify-node-lib", () => {
    return gulp.src(`${LIB_OUT_DIR}/mdc-neptune.js`)
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename({extname: ".min.js"}))
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest("lib"));
});

gulp.task("uglify-browser-lib", () => {
    return gulp.src(`${LIB_OUT_DIR}/mdc-neptune-client.js`)
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename({extname: ".min.js"}))
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest("lib"));
});

gulp.task("minify-lib-css", () => {
    return gulp.src(`${LIB_OUT_DIR}/mdc-neptune.css`)
        .pipe(cleanCSS())
        .pipe(rename({extname: ".min.css"}))
        .pipe(gulp.dest(LIB_OUT_DIR));
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

gulp.task("docs", ["vendor-bundler", "docs-bundler"]);
//gulp.task("lib", gulpSequence("lib-node-bundler", "lib-browser-bundler", "uglify-node-lib", "uglify-browser-lib"));
gulp.task("lib", ["bundle-server", "bundle-client"]);

gulp.task("copy-static-files", [
    "copy-specs-for-docs",
    "copy-images-for-docs", 
    "copy-fonts-for-docs", 
    "copy-site-static",
    "copy-images-for-lib", 
    "copy-fonts-for-lib", 
    "copy-baseStyles-for-lib"
]);

gulp.task("lint-less-structure", (callback) => {
    checkLessStructure(__dirname)
    .then(() => {
        return callback();
    })
    .catch(() => {
        return callback();
        //return callback("JS and Less files are not modularized well.");
    });
});
gulp.task("stylelint", getStylelintFunc());
gulp.task("lint-less", gulpSequence(["lint-less-structure", "stylelint"]));

gulp.task("test-lib-node-compatibility", () => {
    const lib = require("./lib/mdc-neptune"); // eslint-disable-line global-require
    for (var property in lib) {
        if (lib.hasOwnProperty(property)) {
            if (property !== "__esModule") {
                React.createElement(property, {}, null);
            }
        }
    }
});

//"lint", "lint-less",
gulp.task("default", gulpSequence(
    ["clean-lib", "clean-docs"],
    //"prepare-docs",
    //"docs",
    "lib",
    //"test-lib-node-compatibility",
    //"minify-lib-css",
    "copy-static-files"));

gulp.task('watch-tasks', gulpSequence(
        ["lint", "lint-less", "clean-docs"], 
        ["copy-specs-for-docs", "copy-images-for-docs", "copy-fonts-for-docs", "copy-site-static", "prepare-docs"], 
        ["vendor-bundler", "docs-bundler-watchify"]));

gulp.task('watch', ['watch-tasks'], () => {
    const stream = nodemon({ 
        script: 'server.js',
        ext: 'less css js',
        watch: ['src', 'demo'],
        tasks: (changedFiles) => {
            const tasks = [];
            if (changedFiles && changedFiles instanceof Array) {
                changedFiles.forEach((file) => {
                    const ext = path.extname(file);
                    if ((ext === '.js')) {
                        gulp.src([file])
                        .pipe(eslint())
                        .pipe(eslint.format());
                    }
                    if ((ext === '.less')) {
                        gulp.src([file])
                        .pipe(gulpStylelint({
                            failAfterError: false,
                            reporters: [
                                {formatter: "string", console: true}
                            ]
                        }));
                    }
                });
            }

            return tasks;
        }  
    });

    stream
        .on('restart', () => {
            //console.log(colors.yellow('Changes detected. server.js restarted.'));
        })
        .on('crash', () => {
            console.error(colors.red('Application has crashed!\n'));
            stream.emit('restart', 10);  // restart the server in 10 seconds
        });

    return stream;
});
