import * as THREE from "three"
import Experience from "../Experience.js"
import vertexShader from "../../shaders/ocean/vertex.glsl"
import fragmentShader from "../../shaders/ocean/fragment.glsl"

export default class Ocean {
  constructor(options) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.camera = this.experience.camera.instance

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("ocean")
      this.debugFolder.close()
    }

    this.options = options
    this.createOcean()
  }

  createOcean() {
    // Colors
    this.debugObject = {}
    this.debugObject.depthColor = "#040c1a"
    this.debugObject.surfaceColor = "#11293f"
    // this.debugObject.depthColor = "#186691"
    // this.debugObject.surfaceColor = "#9bd8ff"

    if (this.debug.active) {
      this.debugFolder.addColor(this.debugObject, "depthColor").onChange(() => {
        this.material.uniforms.uDepthColor.value.set(this.debugObject.depthColor)
      })
      this.debugFolder.addColor(this.debugObject, "surfaceColor").onChange(() => {
        this.material.uniforms.uSurfaceColor.value.set(this.debugObject.surfaceColor)
      })
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },

        uBigWavesElevation: { value: 0.05 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uBigWavesSpeed: { value: 0.75 },

        uSmallWavesElevation: { value: 0.15 },
        uSmallWavesFrequency: { value: 3 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallIterations: { value: 4 },

        uDepthColor: { value: new THREE.Color(this.debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(this.debugObject.surfaceColor) },
        uColorOffset: { value: 0.08 },
        uColorMultiplier: { value: 5 },
        uColorOpacity: { value: 0.95 },

        uLightIntensity: { value: 2.8 },
        uLightPosition: { value: new THREE.Vector3(0, 0.25, 0) }, // Adjust as needed
        uLightSpecularPower: { value: 30.0 }, // Adjust specular power
        uLightDecay: { value: 0.95 }, // Adjust decay factor
      },
      wireframe: false,
      transparent: true,
    })

    this.geometry = new THREE.PlaneGeometry(2, 2, 512, 512)
    this.geometry.deleteAttribute("normal") // Remove normals for better performance
    this.geometry.deleteAttribute("uv2") // Remove secondary UVs for better performance

    this.ocean = new THREE.Mesh(this.geometry, this.material)
    this.ocean.rotation.x = -Math.PI / 2 // Rotate to horizontal
    this.ocean.position.y = 0.15
    this.scene.add(this.ocean)

    // Debug
    if (this.debug.active) {
      this.debugFolder.add(this.material.uniforms.uBigWavesElevation, "value").min(0).max(1).step(0.001).name("uBigWavesElevation").name("Big Waves Elevation")
      this.debugFolder.add(this.material.uniforms.uBigWavesFrequency.value, "x").min(0).max(10).step(0.001).name("uBigWavesFrequencyX").name("Big Waves Frequency X")
      this.debugFolder.add(this.material.uniforms.uBigWavesFrequency.value, "y").min(0).max(10).step(0.001).name("uBigWavesFrequencyY").name("Big Waves Frequency Y")
      this.debugFolder.add(this.material.uniforms.uBigWavesSpeed, "value").min(0).max(4).step(0.001).name("uBigWavesSpeed").name("Big Waves Speed")

      this.debugFolder.add(this.material.uniforms.uSmallWavesElevation, "value").min(0).max(1).step(0.001).name("uSmallWavesElevation").name("Small Waves Elevation")
      this.debugFolder.add(this.material.uniforms.uSmallWavesFrequency, "value").min(0).max(30).step(0.001).name("uSmallWavesFrequency").name("Small Waves Frequency")
      this.debugFolder.add(this.material.uniforms.uSmallWavesSpeed, "value").min(0).max(4).step(0.001).name("uSmallWavesSpeed").name("Small Waves Speed")
      this.debugFolder.add(this.material.uniforms.uSmallIterations, "value").min(0).max(5).step(1).name("uSmallIterations").name("Small Waves Iterations")

      this.debugFolder.add(this.material.uniforms.uColorOffset, "value").min(0).max(1).step(0.001).name("uColorOffset").name("Color Offset")
      this.debugFolder.add(this.material.uniforms.uColorMultiplier, "value").min(0).max(10).step(0.001).name("uColorMultiplier").name("Color Multiplier")

      this.debugFolder.add(this.material.uniforms.uLightIntensity, "value").min(0).max(10).step(0.001).name("uLightIntensity").name("Light Intensity")
      this.debugFolder.add(this.material.uniforms.uLightPosition.value, "x").min(-50).max(50).step(0.001).name("uLightPositionX").name("Light Position X")
      this.debugFolder.add(this.material.uniforms.uLightPosition.value, "y").min(-50).max(50).step(0.001).name("uLightPositionY").name("Light Position Y")
      this.debugFolder.add(this.material.uniforms.uLightPosition.value, "z").min(-50).max(50).step(0.001).name("uLightPositionZ").name("Light Position Z")
      this.debugFolder.add(this.material.uniforms.uLightSpecularPower, "value").min(1).max(20).step(1).name("uLightSpecularPower").name("Light Specular Power")
      this.debugFolder.add(this.material.uniforms.uLightDecay, "value").min(0).max(10).step(0.01).name("uLightDecay").name("Light Decay")
    }
  }

  update() {
    this.material.uniforms.uTime.value = this.experience.time.elapsed * 0.001
  }
}
