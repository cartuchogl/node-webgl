var GLFW = require('node-glfw');
var WebGL = require('./webgl');

module.exports = function () {

    // Window handler for glfw3
    var glfw_window;

    if (process.platform !== 'win32')
        process.on('SIGINT', function () { process.exit(0); });
    //process.on('exit', function () { console.log('exiting app'); });

    var events;
    var platform;
    Object.defineProperty(GLFW, 'events', {
        get: function () {
            if (events) return events;
            events = new (require('events').EventEmitter);

            var _emit = events.emit;
            events.emit = function () {
              var args = Array.prototype.slice.call(arguments);
              var evt = args[1]; // args[1] is the event, args[0] is the type of event

              if(evt) evt.preventDefault = function () { };
              if(evt) evt.stopPropagation = function () { };
              if (evt && evt.type === 'resize' && platform) {
                platform.width = evt.width;
                platform.height = evt.height;
              }
              // _emit.apply(this, args);
              events.listeners(args[0]).forEach(function(listener) {
                listener(args[1]);        
              })
            };
            return events;
        }
    });

    GLFW.Init();
    //  GLFW.events.on('event', console.dir);
    GLFW.events.on('quit', function () { process.exit(0); });
    GLFW.events.on("keydown", function (evt) {
      if (evt.keyCode === 'C'.charCodeAt(0) && evt.ctrlKey) { process.exit(0); }// Control+C
      if (evt.keyCode === 27) process.exit(0);  // ESC
    });

    platform = {
        type: "nodeGLFW",
        setTitle: GLFW.SetWindowTitle,
        setIcon: function () { },
        flip: GLFW.SwapBuffers,
        getElementById: function (name) {
            return null; //this;
        },
        createElement: function (name, width, height) {
            if (name.indexOf('canvas') >= 0) {
                this.createWindow(width || 800, height || 800);
                this.canvas = this;
                WebGL.canvas = this;
                return this;
            }
            return null;
        },
        createWindow: function (width, height) {
            var attribs = GLFW.WINDOW;

            if (width == 0 || height == 0) {
                attribs = GLFW.FULLSCREEN;
                width = height = 0;
            }

            var resizeListeners = [], rl = GLFW.events.listeners('resize');
            for (var l = 0, ln = rl.length; l < ln; ++l)
                resizeListeners[l] = rl[l];
            GLFW.events.removeAllListeners('resize');

            GLFW.WindowHint(GLFW.WINDOW_NO_RESIZE, 0);

            // we use OpenGL 2.1, GLSL 1.20. Comment this for now as this is for GLSL 1.50
            //GLFW.OpenWindowHint(GLFW.OPENGL_FORWARD_COMPAT, 1);
            //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MAJOR, 3);
            //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MINOR, 2);
            //GLFW.OpenWindowHint(GLFW.OPENGL_PROFILE, GLFW.OPENGL_CORE_PROFILE);

            glfw_window = GLFW.CreateWindow(width, height,'test');
            if(!glfw_window) {
                GLFW.Terminate();
                throw "Can't initialize GL surface";
            }

            // make sure GLEW is initialized
            WebGL.Init();

            //GLFW.SwapBuffers();
            GLFW.SwapInterval(0); // Disable VSync (we want to get as high FPS as possible!)

            for (var l = 0, ln = resizeListeners.length; l < ln; ++l)
                GLFW.events.addListener('resize', resizeListeners[l]);

            // var size = GLFW.GetWindowSize(glfw_window);
            // Support for retina displays ?
            var size = GLFW.GetFramebufferSize(glfw_window);
            this.width = this.drawingBufferWidth = size.width;
            this.height = this.drawingBufferHeight = size.height;
        },
        getContext: function (name) {
            return WebGL;
        },
        on: function (name, callback) {
            GLFW.events.on(name, callback);
        },
        addEventListener: function (name, callback) {
            GLFW.events.on(name, callback);
        },
        removeEventListener: function (name, callback) {
            GLFW.events.removeListener(name, callback);
        },
        requestAnimationFrame: function (callback, delay) {
            GLFW.SwapBuffers(glfw_window);
            GLFW.PollEvents();
            var timer = setImmediate;//process.nextTick;
            var d = 16;
            if (delay == undefined || delay > 0) {
                timer = setTimeout;
                d = delay;
            }
            timer(function () {
                callback(GLFW.GetTime()*1000.0);
            }, d);
        }
    };

    Object.defineProperty(platform, 'AntTweakBar', {
        get: function (cb) {
            return new GLFW.AntTweakBar();
        }
    });

    Object.defineProperty(platform, 'onkeydown', {
        set: function (cb) {
            this.on('keydown', cb);
        }
    });

    Object.defineProperty(platform, 'onkeyup', {
        set: function (cb) {
            this.on('keyup', cb);
        }
    });

    return platform;
};

