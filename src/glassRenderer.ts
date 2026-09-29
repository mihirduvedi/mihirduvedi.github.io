import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { ThemeKey } from './data'

export type GlassController = { select: (theme: ThemeKey) => void; pause: (paused: boolean) => void; dispose: () => void }
const keys: ThemeKey[] = ['trust', 'prediction', 'time', 'recovery']

// The surface and its normals are evaluated on the GPU. The CPU only updates
// a few uniforms; no point arrays, depth sorting, or per-frame camera fitting.
const surface = `
uniform float flowTime;
uniform vec4 formWeights;
attribute vec2 surfaceUv;
attribute float orbitIndex;
const float TAU = 6.28318530718;
vec3 loopCenter(float u) {
  float a = 1.0 + cos(u)*cos(u);
  float t = flowTime;
  return vec3((1.65+.16*sin(t*1.05))*sin(u)/a, (1.9+.22*cos(t*.85))*sin(u)*cos(u)/a, .4*cos(u)+.17*sin(u*3.0-t*1.1));
}
vec3 knotCenter(float u) {
  float t = flowTime;
  float r = .49*(2.0 + .72*cos(3.0*u-t*.24));
  return vec3(r*cos(2.0*u), r*sin(2.0*u), .48*sin(3.0*u-t*.24));
}
vec3 turnX(vec3 p, float a) { return vec3(p.x, cos(a)*p.y-sin(a)*p.z, sin(a)*p.y+cos(a)*p.z); }
vec3 turnY(vec3 p, float a) { return vec3(cos(a)*p.x+sin(a)*p.z, p.y, -sin(a)*p.x+cos(a)*p.z); }
vec3 formPoint(vec2 st) {
  float u = st.x * TAU, v = st.y * TAU;
  float t = flowTime;
  vec3 p = vec3(0.0);
  if (formWeights.x > .0001) {
    float tube = .31 + .075*sin(u*3.0-t*1.5);
    float ring = .98 + .15*sin(u*2.0-t*1.05) + .06*cos(u*3.0+t*.7);
    float angle = v + .6*sin(u*2.0+t*.7);
    p += formWeights.x * vec3((ring+tube*cos(angle))*cos(u), (ring+tube*cos(angle))*sin(u), tube*sin(angle)+.22*sin(u*2.0-t*.95));
  }
  if (formWeights.y > .0001) {
    vec3 tangent = normalize(knotCenter(u+.003)-knotCenter(u-.003));
    vec3 normal = normalize(cross(tangent,vec3(0.0,0.0,1.0)));
    vec3 binormal = normalize(cross(normal,tangent));
    float tube = .19 + .025*sin(3.0*u-t*1.25);
    p += formWeights.y * (knotCenter(u)+tube*(normal*cos(v)+binormal*sin(v)));
  }
  if (formWeights.z > .0001) {
    // Three closed orbits turn at independent rates. Their radii leave enough
    // clearance to avoid intersections as the planes sweep through one another.
    float rv = (st.y*3.0-orbitIndex)*TAU;
    float r = 1.28-orbitIndex*.32;
    float tube = .115+.016*sin(3.0*u-t*1.1+orbitIndex);
    vec3 orbit = vec3((r+tube*cos(rv))*cos(u), (r+tube*cos(rv))*sin(u), tube*sin(rv));
    float tilt = orbitIndex < .5 ? .28+.48*sin(t*.48) : .28+orbitIndex*.72+t*(.18+orbitIndex*.055);
    orbit = turnX(orbit, tilt);
    orbit = turnY(orbit, -.2+orbitIndex*.65 + sin(t*.32+orbitIndex)*.38);
    p += formWeights.z * orbit;
  }
  if (formWeights.w > .0001) {
    vec3 tangent = normalize(loopCenter(u+.005)-loopCenter(u-.005));
    vec3 normal = normalize(cross(tangent,vec3(0.0,0.0,1.0)));
    vec3 binormal = normalize(cross(normal,tangent));
    float tube = .22 + .045*sin(u*3.0-t*1.4);
    p += formWeights.w * (loopCenter(u) + tube*(normal*cos(v)+binormal*sin(v)));
  }
  float wave = .07*sin(p.y*2.6+t*1.1) + .04*cos(p.x*3.0-t*.9);
  p.x += wave;
  p.z += .085*sin(p.y*2.0+p.x-t*1.0);
  return p;
}
`

export function createGlassRenderer(canvas: HTMLCanvasElement, theme: ThemeKey, initiallyPaused: boolean, onFailure: () => void): GlassController {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' })
  if (!gl) throw new Error('WebGL 2 is unavailable')
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true })
  renderer.setClearColor(0x020304, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.transmissionResolutionScale = .75
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#020304')
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 30)
  camera.position.set(0, 0, 6.8)
  const environment = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environmentMap = pmrem.fromScene(environment, .025)
  scene.environment = environmentMap.texture
  scene.environmentIntensity = 1.35
  environment.dispose(); pmrem.dispose()

  // Three bands form one continuous surface for the ring, knot, and infinity.
  // In Time each band closes into a separate orbit, with no connecting triangles.
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = [], uvs: number[] = [], bands: number[] = [], indices: number[] = []
  const columns = 192, rows = 20
  for (let band = 0; band < 3; band++) {
    const offset = positions.length / 3
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      positions.push(0, 0, 0); uvs.push(col / columns, (band + row / rows) / 3); bands.push(band)
      if (row < rows && col < columns) {
        const a = offset + row * (columns + 1) + col, b = a + 1, d = a + columns + 1, c = d + 1
        indices.push(a, b, d, b, c, d)
      }
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(positions.map(() => 0), 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('surfaceUv', geometry.attributes.uv)
  geometry.setAttribute('orbitIndex', new THREE.Float32BufferAttribute(bands, 1))
  geometry.setIndex(indices)
  const material = new THREE.MeshPhysicalMaterial({
    color: '#f1f5f7', metalness: 0, roughness: .08, transmission: 1,
    thickness: .3, ior: 1.28, clearcoat: .6, clearcoatRoughness: .08,
    attenuationColor: new THREE.Color('#dfe7ed'), attenuationDistance: 3.5,
    envMapIntensity: .55, side: THREE.FrontSide,
  })
  const weights = new THREE.Vector4(0, 0, 0, 0)
  weights.setComponent(keys.indexOf(theme), 1)
  const target = weights.clone()
  const uniforms = { flowTime: { value: 0 }, formWeights: { value: weights } }
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = surface + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      vec3 pu = formPoint(surfaceUv + vec2(.001,0.0)) - formPoint(surfaceUv - vec2(.001,0.0));
      vec3 pv = formPoint(surfaceUv + vec2(0.0,.001)) - formPoint(surfaceUv - vec2(0.0,.001));
      vec3 objectNormal = normalize(cross(pu,pv));
    `).replace('#include <begin_vertex>', 'vec3 transformed = formPoint(surfaceUv);')
  }
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.rotation.z = -.3
  scene.add(mesh)

  // A quiet etched plane gives the transparent volume something to refract.
  const linePoints: number[] = []
  for (let i = -4; i <= 4; i++) {
    const v = i * .48
    linePoints.push(-2.2, v, -1.3, 2.2, v, -1.3, v, -1.8, -1.3, v, 1.8, -1.3)
  }
  const gridGeometry = new THREE.BufferGeometry()
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3))
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x18222b })
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial)
  scene.add(grid)

  let frame = 0, last = 0, time = 0, disposed = false, paused = initiallyPaused, visible = true
  const profiling = new URLSearchParams(location.search).has('motion-debug')
  const timings: number[] = []
  let renderedFrames = 0
  let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0
  const finePointer = window.matchMedia('(pointer: fine)')
  function render(timestamp: number) {
    frame = 0
    if (disposed) return
    if (profiling && last && !paused) {
      timings.push(timestamp - last)
      if (timings.length === 120) {
        const sorted = [...timings].sort((a, b) => a - b)
        canvas.dataset.frameMedian = sorted[60].toFixed(2)
        canvas.dataset.frameP95 = sorted[114].toFixed(2)
        timings.length = 0
      }
      canvas.dataset.frames = String(++renderedFrames)
    }
    const dt = last ? Math.max(0, Math.min((timestamp - last) / 1000, .05)) : 1 / 60
    last = timestamp
    if (!paused) {
      time += dt
      const ease = 1 - Math.exp(-dt * 5)
      weights.lerp(target, ease)
      tiltX += (pointerX - tiltX) * ease
      tiltY += (pointerY - tiltY) * ease
    }
    uniforms.flowTime.value = time
    mesh.rotation.x = .18 + Math.sin(time * .42) * .23 + tiltY * .16
    mesh.rotation.y = -.2 + Math.sin(time * .36) * .5 + Math.sin(time*.73)*.1 + tiltX * .24
    mesh.rotation.z = -.2 * (1 - weights.z) + Math.sin(time * .31) * .15
    mesh.position.y = Math.sin(time*.8)*.06
    renderer.render(scene, camera)
    if (!paused) schedule()
  }
  function schedule() { if (!disposed && !frame && visible && !document.hidden) frame = requestAnimationFrame(render) }
  const resize = () => {
    // CSS scroll transforms must not change the camera's intrinsic aspect.
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (!width || !height || disposed) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.position.z = width / height < 1.05 ? 7.5 : 6.5
    camera.updateProjectionMatrix()
    cancelAnimationFrame(frame); frame = 0
    render(performance.now())
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) { last = 0; schedule() }
    else { cancelAnimationFrame(frame); frame = 0 }
  })
  visibilityObserver.observe(canvas)
  const visibility = () => {
    last = 0
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0 }
    else schedule()
  }
  const pointer = (event: PointerEvent) => {
    if (!finePointer.matches || paused) return
    const rect = canvas.getBoundingClientRect()
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1
    pointerY = (event.clientY - rect.top) / rect.height * 2 - 1
  }
  const leave = () => { pointerX = 0; pointerY = 0 }
  const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; onFailure() }
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('pointermove', pointer, { passive: true })
  canvas.addEventListener('pointerleave', leave)
  document.addEventListener('visibilitychange', visibility)
  resize()
  return {
    select(next) {
      target.set(0, 0, 0, 0).setComponent(keys.indexOf(next), 1)
      if (paused) { weights.copy(target); render(performance.now()) }
      else schedule()
    },
    pause(next) {
      paused = next; last = 0
      cancelAnimationFrame(frame); frame = 0
      if (paused) render(performance.now())
      else schedule()
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame)
      resizeObserver.disconnect(); visibilityObserver.disconnect()
      canvas.removeEventListener('pointermove', pointer); canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visibility)
      geometry.dispose(); material.dispose(); gridGeometry.dispose(); gridMaterial.dispose()
      environmentMap.dispose(); renderer.dispose()
    },
  }
}
