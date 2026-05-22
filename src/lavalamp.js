import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.body.appendChild(renderer.domElement);

const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec2 u_resolution;

    float noise(vec2 p) {
      return sin(p.x) * sin(p.y);
    }

    float wave(vec2 uv, float t, float offset) {
      return sin(uv.x * 6.0 + t + offset) * 0.2 +
             sin(uv.y * 4.0 + t * 1.3 + offset) * 0.2;
    }

    vec3 layer(vec2 uv, float t, float offset, vec3 color) {
      float w = wave(uv, t, offset);
      float n = noise(uv * 3.0 + t * 0.3);
      float a = smoothstep(0.35, 0.0, abs(uv.y + w + n * 0.25));
      return color * a;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      uv = uv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.4;

      vec3 col = vec3(0.0);
      col += layer(uv, t, 0.0, vec3(0.2, 0.6, 1.0));
      col += layer(uv, t, 2.5, vec3(1.0, 0.2, 0.5));
      col += layer(uv, t, 5.0, vec3(0.3, 1.0, 0.7));

      col = pow(col, vec3(0.7)) * 1.5;
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(mesh);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  0.6,
  0.2
);
composer.addPass(bloomPass);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

function animate(time) {
  material.uniforms.u_time.value = time * 0.001;
  composer.render();
  requestAnimationFrame(animate);
}

animate();
