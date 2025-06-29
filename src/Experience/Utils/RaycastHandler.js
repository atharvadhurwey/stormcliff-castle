import * as THREE from "three"
import Experience from "../Experience.js"

export default class RaycastHandler {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.camera = this.experience.camera.instance
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()

    // Bind methods
    this.updateMouse = this.updateMouse.bind(this)
    this.updateTarget = this.updateTarget.bind(this)

    // objects to raycast against
    this.objects = []

    // Add event listeners
    window.addEventListener("mousemove", this.updateMouse)
    window.addEventListener("dblclick", this.updateTarget)
  }

  registerObjectForRaycast(object) {
    if (object && !this.objects.includes(object)) {
      this.objects.push(object)
      // console.log(object.name + " registered for raycasting.")
    }
  }

  updateMouse(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  updateTarget() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.objects)
    if (intersects.length > 0) {
      let intersectedObject = intersects[0].object

      // This logic to select the group instead of the mesh
      while (intersectedObject && intersectedObject.parent) {
        if (this.objects.includes(intersectedObject)) break
        intersectedObject = intersectedObject.parent
      }
      // console.log("Intersected Group", intersectedObject.name)

      // If the intersected object is a group, we can cast lightning strike
      if (intersectedObject && intersectedObject.name.includes("_raycast") && !intersectedObject.name.includes("_raycast_")) {
        this.experience.world.lightning.castLightningStrike(intersects[0].point, intersectedObject, intersects[0].face.normal)
      } else {
        // console.log("No raycastable object found.")
      }
    } else {
      // console.log("No objects intersected.")
    }
  }
}
