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
    this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 500)
    // this.instance.position.set(6, 10, 8)

    this.instance.position.set(1.01, 1.54, -0.84)
    this.scene.add(this.instance)
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas)
    this.controls.target.set(0, 0.4, 0)
    this.controls.enableDamping = true
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
