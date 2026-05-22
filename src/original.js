import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
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

    vec3 gradientLayer(vec2 uv, float t, float offset, vec3 color) {
      float w = wave(uv, t, offset);
      float n = noise(uv * 3.0 + t * 0.2);
      float alpha = smoothstep(0.3, 0.0, abs(uv.y + w + n * 0.2));
      return color * alpha;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      uv = uv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.5;
      vec3 col = vec3(0.0);

      col += gradientLayer(uv, t, 0.0, vec3(0.2, 0.6, 1.0));
      col += gradientLayer(uv, t, 2.0, vec3(1.0, 0.3, 0.6));
      col += gradientLayer(uv, t, 4.0, vec3(0.3, 1.0, 0.7));
      col = pow(col, vec3(0.8));

      gl_FragColor = vec4(col, 1.0);
    }
  `
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

function animate(time) {
  material.uniforms.u_time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
