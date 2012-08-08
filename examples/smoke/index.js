PhiloGL.unpack();
window.addEventListener('DOMContentLoaded', webGLStart, false);
function webGLStart() {
  var width = 1024 * window.devicePixelRatio,
      height = 550 * window.devicePixelRatio,
      i, ln, gl,
      cameraControl;

  function resize() {
    var canvas = document.getElementById('smoke'),
        style = window.getComputedStyle(canvas);
    height = parseFloat(style.getPropertyValue('height')) * window.devicePixelRatio;
    canvas.height = height;
    width = parseFloat(style.getPropertyValue('width')) * window.devicePixelRatio;
    canvas.width = width;
    this.app && this.app.update();
  }

  resize();

  window.addEventListener('resize', resize);

  PhiloGL('smoke', {
    events: {
      onDragStart: function(e) {
        cameraControl.onDragStart(e);
      },
      onDragMove: function(e) {
        cameraControl.onDragMove(e);
      }
    },

    program: [
      {
        id: 'rand_source',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/rand_source.fs.glsl',
        noCache: true
      },
      {
        id: 'curl',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/curl.fs.glsl',
        noCache: true
      },
      {
        id: 'div',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/div.fs.glsl',
        noCache: true
      },
      {
        id: 'init',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/init.fs.glsl',
        noCache: true
      },
      {
        id: 'back',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/back.fs.glsl',
        noCache: true
      },
      {
        id: 'move',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/move.fs.glsl',
        noCache: true
      },
      {
        id: 'copy',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/copy.fs.glsl',
        noCache: true
      },
      {
        id: 'emit',
        from: 'uris',
        vs: 'shaders/plain.vs.glsl',
        fs: 'shaders/emit.fs.glsl',
        noCache: true
      },
      {
        id: 'plane',
        from: 'uris',
        vs: 'shaders/obj.vs.glsl',
        fs: 'shaders/obj.fs.glsl',
        noCache: true
      },
      {
        id: 'sphere',
        from: 'uris',
        vs: 'shaders/obj.vs.glsl',
        fs: 'shaders/sphere.fs.glsl',
        noCache: true
      },
      {
        id: 'shadow',
        from: 'uris',
        vs: 'shaders/shadow.vs.glsl',
        fs: 'shaders/shadow.fs.glsl',
        noCache: true
      },
      {
        id: 'particles',
        from: 'uris',
        vs: 'shaders/particles.vs.glsl',
        fs: 'shaders/particles.fs.glsl',
        noCache: true
      }
    ],

    camera: {
      position: {
        x: 1,
        y: 4,
        z: 2.3
      },
      target: {
        x: 0,
        y: 0,
        z: -0.5
      },
      up: {
        x: 0,
        y: 0,
        z: 1
      }
    },

    scene: {
      lights: {
        enable: false
      }
    },

    textures: {
      src: ['smoke.png'],
      id: ['smoke']
    },

    onError: function(e) {
      alert(e);
    },

    onLoad: function(app) {

      var RESOLUTION = 32, SHADOW_RESO = 128, mult = 2, N = 1;
      var light = new PhiloGL.Vec3(.5, .75, 1.5);
      PhiloGL.unpack();
      gl = app.gl;
      var velocityField = new SwapTexture(app, {width: RESOLUTION, height: RESOLUTION * RESOLUTION});
      var particleBuffers = [];
      for (i = 0; i < mult; i++) {
        particleBuffers.push(new SwapTexture(app, {width: 256, height: 256}));
      }

      var camera = app.camera;
      camera.fov = 37;
      camera.update();
      cameraControl = new CameraControl(app.camera);

      // This initializes a incompressible field
      velocityField.process({
        program: 'rand_source',
        uniforms: {
          FIELD_RESO: RESOLUTION,
          time: +new Date() % 3600000 / 1000,
          mult: 1
        }
      });

      velocityField.process({
        program: 'curl',
        uniforms: {
          FIELD_RESO: RESOLUTION
        }
      });

      for (i = 0; i < mult; i++) {
        particleBuffers[i].process({
          program: 'init',
          uniforms: {
            FIELD_RESO: RESOLUTION,
            multiple: mult,
            curr: i,
            time: +new Date() % 1000 / 1000 + i / 10
          }
        });
      }
      var number = 256 * 256,
          idx = new Float32Array(number);
      for (i = 0; i < number; i++) {
        idx[i] = i;
      }

      app.setFrameBuffer('shadow-on-plane', {
        width: SHADOW_RESO,
        height: SHADOW_RESO,
        bindToTexture: {
          pixelStore: [],
          parameters: [
            {
              name: gl.TEXTURE_MAG_FILTER,
              value: gl.NEAREST_MIPMAP_NEAREST
            },
            {
              name: gl.TEXTURE_MIN_FILTER,
              value: gl.NEAREST_MIPMAP_NEAREST,
              generateMipmap: true
            },
            {
              name: gl.TEXTURE_WRAP_S,
              value: gl.CLAMP_TO_EDGE
            },
            {
              name: gl.TEXTURE_WRAP_T,
              value: gl.CLAMP_TO_EDGE
            }
          ],
          attachment: gl.COLOR_ATTACHMENT0,
          data: {
            type: gl.FLOAT,
            width: SHADOW_RESO,
            height: SHADOW_RESO
          }
        },
        bindToRenderBuffer: {
          attachment: gl.DEPTH_ATTACHMENT
        }
      });

      var plane = new PhiloGL.O3D.Plane({
        type: 'x,y',
        xlen: 3,
        ylen: 3,
        nx: 2,
        ny: 2,
        offset: -1,
        program: 'plane',
        textures: ['shadow-on-plane-texture'],
        uniforms: {
          lightPosition: light
        },
        flipCull: true
      });
      app.scene.add(plane);

      var sphere = new PhiloGL.O3D.Sphere({
        nlat: 30,
        nlong: 30,
        radius: 0.02,
        program: 'sphere'
      });
      app.scene.add(sphere);
      sphere.position.x = light.x;
      sphere.position.y = light.y;
      sphere.position.z = light.z;
      sphere.update();

      var particleModel = new PhiloGL.O3D.Model({
        program: 'particles',
        textures: [velocityField.getResult(), particleBuffers[0].getResult(), 'smoke'],
        uniforms: {
          FIELD_RESO: RESOLUTION,
          devicePixelRatio: window.devicePixelRatio,
          multiple: mult
        },

        onBeforeRender: function(program, camera) {
          this.textures = [velocityField.getResult(), particleBuffers[0].getResult(), 'smoke'];
          program.setBuffer('indices', { value: idx });
        },

        render: function(gl, program, camera) {
          gl.depthMask(0);
          var K = 32;
          for (var i = K - 1; i >= 0; i--) {
            program.setUniforms({near: i / K, far: (i + 1) / K});
            for (var j = 0; j < mult; j++) {
              program.setTexture(particleBuffers[j].getResult(), gl.TEXTURE1);
              gl.drawArrays(gl.POINTS, 0, number);
            }
          }
          gl.depthMask(1);
        }
      });
      app.scene.add(particleModel);


      var lastDate = +new Date(),
          startTime = lastDate;

      function updateParticles() {
        var now = +new Date(),
            dt = now - lastDate,
            phase = (now - startTime) / 3000 * Math.PI,
            center = [0.5 + Math.sin(phase) * 0.4, 0.5 + Math.sin(phase * 2.32) * 0.4, 0.5 + Math.sin(phase * 1.2523) * 0.4];
        lastDate = now;

        gl.disable(gl.BLEND);

        for (i = 0; i < mult; i++) {
          particleBuffers[i].process({
            program: 'emit',
            textures: [velocityField.getResult()],
            uniforms: {
              FIELD_RESO: RESOLUTION,
              time: phase,
              dt: dt / 1000,
              curr: i,
              center: center
            }
          });

          for (var j = 0; j < N; j++) {
            particleBuffers[i].process({
              program: 'move',
              textures: [velocityField.getResult()],
              uniforms: {
                FIELD_RESO: RESOLUTION,
                time: phase,
                dt: dt / 1000 / N
              }
            });
          }
        }

      }

      function updateShadow() {
        var program = app.program.shadow,
            framebuffer = 'shadow-on-plane';

        program.use();
        app.setFrameBuffer(framebuffer, true);
        program.setBuffer('indices', { value: idx });
        program.setUniform('platform', -1);
        program.setUniform('lightPosition', [light.x, light.y, light.z]);
        gl.viewport(0, 0, SHADOW_RESO, SHADOW_RESO);
        gl.clearColor(1, 1, 1, 0);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(0);
        for (var j = 0; j < mult; j++) {
          program.setTexture(particleBuffers[j].getResult(), gl.TEXTURE0);
          gl.drawArrays(gl.POINTS, 0, number);
        }
        gl.depthMask(1);
        program.setBuffer('indices', false);
        app.setFrameBuffer(framebuffer, false);
      }

      function draw() {
        updateParticles();
        updateShadow();

        gl.clearColor(.2, .2, .24, 0);
        gl.clearDepth(2);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.depthMask(1);
        app.scene.render();
        setTimeout(function() {
          draw();
        }, 15);
      }

      draw();
    }
  });
}
