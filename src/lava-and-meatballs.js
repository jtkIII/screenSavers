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

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        f = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;

        for(int i = 0; i < 4; i++) {
            v += noise(p) * a;
            p *= 2.0;
            a *= 0.5;
        }

        return v;
    }

    float blob(vec2 uv, vec2 pos, float size) {
        return size / length(uv - pos);
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;

        uv = uv * 2.0 - 1.0;
        uv.x *= u_resolution.x / u_resolution.y;

        float baseTime = u_time;
        float pulse = sin(baseTime * 0.07) * 0.5 + 0.5;
        float blobTime = baseTime * mix(0.12, 0.20, pulse);
        float warpTime = baseTime * 0.045;
        float noiseTime = baseTime * 0.11;
        float colorTime = baseTime * 0.035;

        vec2 warp;
        warp.x = fbm(uv * 1.33 + warpTime);
        warp.y = fbm(uv * 1.33 - warpTime);

        uv += (warp - 0.33) * 0.33;
        uv += sin(uv.yx * 8.0 + baseTime * 0.33) * 0.013;

        vec2 p1 = vec2(sin(blobTime * 0.70), cos(blobTime * 0.90)) * 0.42;
        vec2 p2 = vec2(cos(blobTime * 0.45), sin(blobTime * 0.65)) * 0.50;
        vec2 p3 = vec2(sin(blobTime * 1.10), sin(blobTime * 0.55)) * 0.36;
        vec2 p4 = vec2(cos(blobTime * 0.30), cos(blobTime * 0.80)) * 0.28;

        float field = 0.0;
        field += blob(uv, p1, 0.14);
        field += blob(uv, p2, 0.12);
        field += blob(uv, p3, 0.15);
        field += blob(uv, p4, 0.10);
        field += fbm(uv * 3.3 + noiseTime) * 0.33;

        float mask = smoothstep(0.95, 1.45, field);

        vec3 c1 = vec3(0.08, 0.45, 1.0);
        vec3 c2 = vec3(1.0, 0.12, 0.45);
        vec3 c3 = vec3(0.15, 1.0, 0.72);

        float mixA = sin(colorTime + uv.x * 3.5) * 0.5 + 0.5;
        float mixB = cos(colorTime * 0.8 + uv.y * 4.5) * 0.5 + 0.5;
        vec3 col = mix(c1, c2, mixA);
        col = mix(col, c3, mixB);
        col *= mask;

        float glow = smoothstep(1.0, 1.8, field);
        col += glow * 0.18;

        float vignette = smoothstep(1.8, 0.33, length(uv));
        col *= vignette;
        col.r += sin(baseTime + uv.x * 8.0) * 0.015;
        col.b += cos(baseTime + uv.y * 8.0) * 0.015;
        float grain = hash(gl_FragCoord.xy + baseTime) * 0.012;
        col += grain;
        col = pow(col, vec3(0.92));

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
