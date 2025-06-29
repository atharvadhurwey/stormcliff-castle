import * as THREE from "three"
import Experience from "../Experience.js"
import { easing } from "maath"

export default class Crystal {
  constructor() {
    this.experience = new Experience()
    this.debug = this.experience.debug
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.crystal = null
    if (this.experience.world.castle.Crystal) {
      this.crystal = this.experience.world.castle.Crystal
      // this.crystalPosition = this.experience.world.castle.CrystalPosition.clone()
    }

    this.animateCrystal = false // Flag to control animation
    this.newCrystalPosition = this.experience.world.castle.CrystalPosition.clone().add(new THREE.Vector3(0, 0.4, 0)) // Adjust position slightly above the original
    // console.log(this.crystal.position.add(new THREE.Vector3(0, 0.1, 0)).y)
    // this.crystal.position.add(new THREE.Vector3(0, 0.1, 0)) // Adjust position slightly above the original
    console.log(easing)
  }

  update() {
    const delta = this.experience.time.delta * 0.001 // Convert to seconds
    if (this.crystal && this.animateCrystal) {
      easing.damp(this.crystal.position, "y", this.newCrystalPosition.y, 2, delta)
      easing.damp(this.crystal.rotation, "y", 20, 4, delta)
    }
  }
}
