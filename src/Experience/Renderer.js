import * as THREE from "three"
import Experience from "./Experience.js"

export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.canvas = this.experience.canvas
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.debug = this.experience.debug
    this.camera = this.experience.camera

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("renderer")
    }

    this.setInstance()
  }

  setInstance() {
    const debugObject = {
      clearColor: "#000000",
    }

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    // this.instance.toneMapping = THREE.CineonToneMapping
    this.instance.toneMapping = THREE.NeutralToneMapping
    this.instance.toneMappingExposure = 1
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.VSMShadowMap
    this.instance.setClearColor(debugObject.clearColor)
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    // this.instance.outputEncoding = THREE.sRGBEncoding

    // Debug
    if (this.experience.debug.active) {
      this.debugFolder
        .add(this.instance, "toneMapping", {
          No: THREE.NoToneMapping,
          Linear: THREE.LinearToneMapping,
          Reinhard: THREE.ReinhardToneMapping,
          Cineon: THREE.CineonToneMapping,
          ACESFilmic: THREE.ACESFilmicToneMapping,
          Neutral: THREE.NeutralToneMapping,
        })
        .onChange(() => {
          this.instance.toneMapping = Number(this.instance.toneMapping)
        })

      this.debugFolder.add(this.instance, "toneMappingExposure").min(0).max(10).step(0.001)

      this.debugFolder.addColor(debugObject, "clearColor").onChange(() => {
        this.instance.setClearColor(debugObject.clearColor)
      })
    }
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
  }

  update() {
    this.instance.render(this.scene, this.camera.instance)
  }
}
