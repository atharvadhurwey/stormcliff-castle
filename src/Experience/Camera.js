import * as THREE from "three"
import Experience from "./Experience.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas

    this.setInstance()
    this.setControls()
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.01, 500)
    // this.instance.position.set(6, 10, 8)

    this.instance.position.set(0.42, 0.87, -0.35)

    this.scene.add(this.instance)
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas)
    this.controls.target.set(0, 0.4, 0)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI * 0.54
    this.controls.minDistance = 0.3
    this.controls.maxDistance = 1.4
    this.controls.enablePan = false
    // this.controls.enableZoom = false
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height
    this.instance.updateProjectionMatrix()
  }

  update() {
    this.controls.update()
    // console.log(this.instance.position)
  }
}
