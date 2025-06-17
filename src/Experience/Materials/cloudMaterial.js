import * as THREE from "three"
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js"
import vertexShader from "../../shaders/clouds/vertex.glsl"
import fragmentShader from "../../shaders/clouds/fragment.glsl"

export function createCloudMateiral({ threshold = 0.55, opacity = 0.08, range = 0.2, color = "#d6d8e1", steps = 64 } = {}) {
  // Texture

  const size = 128
  const data = new Uint8Array(size * size * size)

  let i = 0
  const scale = 0.05
  const perlin = new ImprovedNoise()
  const vector = new THREE.Vector3()

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d =
          1.0 -
          vector
            .set(x, y, z)
            .subScalar(size / 2)
            .divideScalar(size)
            .length()
        data[i] = (128 + 128 * perlin.noise((x * scale) / 1.5, y * scale, (z * scale) / 1.5)) * d * d
        i++
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size)
  texture.format = THREE.RedFormat
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.unpackAlignment = 1
  texture.needsUpdate = true

  // Material

  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      base: { value: new THREE.Color(color) },
      map: { value: texture },
      cameraPos: { value: new THREE.Vector3() },
      threshold: { value: threshold },
      opacity: { value: opacity },
      range: { value: range },
      steps: { value: steps },
      frame: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    transparent: true,
  })

  return material
}
