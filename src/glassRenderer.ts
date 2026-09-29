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
const float TAU = 6.28318530718;
vec3 loopCenter(float u) {
  float a = 1.0 + cos(u)*cos(u);
  return vec3(1.7*sin(u)/a, 1.9*sin(u)*cos(u)/a, .32*cos(u));
}
vec3 formPoint(vec2 st) {
  float u = st.x * TAU, v = st.y * TAU;
  float t = flowTime;
  vec3 p = vec3(0.0);
  if (formWeights.x > .0001) {
    float tube = .37 + .045*sin(u*3.0-t*.65);
    float angle = v + .35*sin(u*2.0+t*.3);
    p += formWeights.x * vec3((1.0+tube*cos(angle))*cos(u), (1.0+tube*cos(angle))*sin(u), tube*sin(angle));
  }
  if (formWeights.y > .0001) {
    float r = .11 + pow(max(st.x, .001), .8)*.99;
    p += formWeights.y * vec3((st.x-.5)*2.8, r*sin(v), r*cos(v)*.8);
  }
  if (formWeights.z > .0001) {
    float y = (st.x-.5)*2.7;
    float r = .13 + .73*pow(abs(y)/1.35, 1.18);
    p += formWeights.z * vec3(r*cos(v+y*.4), y, r*sin(v+y*.4));
  }
  if (formWeights.w > .0001) {
    vec3 tangent = normalize(loopCenter(u+.005)-loopCenter(u-.005));
    vec3 normal = normalize(cross(tangent,vec3(0.0,0.0,1.0)));
    vec3 binormal = normalize(cross(tangent,normal));
    p += formWeights.w * (loopCenter(u) + .235*(normal*cos(v)+binormal*sin(v)));
  }
  float wave = .027*sin(p.y*2.6+t*.8) + .019*cos(p.x*3.0-t*.65);
  p.x += wave;
  p.z += .04*sin(p.y*2.0+p.x-t*.7);
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

  const geometry = new THREE.PlaneGeometry(1, 1, 120, 64)
  geometry.setAttribute('surfaceUv', geometry.attributes.uv)
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
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x29343d })
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
    mesh.rotation.x = .2 + Math.sin(time * .17) * .12 + tiltY * .12
    mesh.rotation.y = -.2 + Math.sin(time * .19) * .36 + tiltX * .2
    mesh.rotation.z = -.28 * (1 - weights.z) + Math.sin(time * .12) * .06
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
    camera.position.z = width / height < 1.05 ? 7.2 : 6.1
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
