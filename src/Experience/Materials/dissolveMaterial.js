import * as THREE from "three"
import CSM from "three-custom-shader-material/vanilla"
import { patchShaders } from "gl-noise"

const vertexShader = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}`

const fragmentShader = patchShaders(/* glsl */ `
  varying vec3 vWorldPosition;
  uniform float uThickness;
  uniform vec3 uColor;
  uniform float uProgress;
 
  void main() {
    gln_tFBMOpts opts = gln_tFBMOpts(1.0, 0.3, 2.0, 5.0, 1.0, 5, false, false);
    float noise = gln_sfbm(vWorldPosition.xz * 25.0 , opts);
    noise = gln_normalize(noise);

    float progress = uProgress;

    float alpha = step(1.0 - progress, noise);
    float border = step((1.0 - progress) - uThickness, noise) - alpha;
    
    csm_DiffuseColor.a = alpha + border;
    csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, uColor, border);
  }`)

export function createDissolveMaterial({ baseMaterial, thickness = 0.05, color = "#eb5a13", intensity = 50 }) {
  const uniforms = {
    uThickness: { value: thickness },
    uColor: { value: new THREE.Color(color).multiplyScalar(intensity) },
    uProgress: { value: 1 },
  }

  const material = new CSM({
    baseMaterial: baseMaterial,
    vertexShader,
    fragmentShader,
    uniforms,
    toneMapped: false,
    transparent: true,
  })

  return { material, uniforms }
}
