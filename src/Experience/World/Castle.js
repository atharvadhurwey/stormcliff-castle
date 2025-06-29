import * as THREE from "three"
import Experience from "../Experience.js"

export default class Castle {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time
    this.debug = this.experience.debug
    this.raycaster = this.experience.raycaster

    // Debug
    // if (this.debug.active) {
    //   this.debugFolder = this.debug.ui.addFolder("castle")
    // }

    // Resource
    this.resource = this.resources.items.foxModel
    this.castle = this.resources.items.castleModel
    this.bridgeChunks = []
    this.cliffPhysicsMeshes = []

    this.setModel()
  }

  setModel() {
    this.castleModel = this.castle.scene
    this.scene.add(this.castleModel)

    // For burning the tree later
    this.Tree = null
    this.TreePosition = null

    // For crystal later
    this.Crystal = null
    this.CrystalPosition = null

    // For destroying the bridge later
    this.Bridge = null
    this.BridgePosition = null
    this.BridgeBrick = null

    this.castleModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // child.castShadow = true
        child.receiveShadow = true
      }

      if (child.name.includes("_raycast") && !child.name.includes("_raycast_")) {
        this.raycaster.registerObjectForRaycast(child)
      }

      // Special case to destroy the bridge later
      if (child.name.includes("Bridge_raycast") && !child.name.includes("Bridge_raycast_")) {
        this.Bridge = child
        this.BridgePosition = child.position.clone()
      }
      if (child.name.includes("BridgeBrick_raycast") && !child.name.includes("BridgeBrick_raycast_")) {
        this.BridgeBrick = child
      }

      // Special case for crystal
      if (child.name.includes("Crystal_raycast") && !child.name.includes("Crystal_raycast_")) {
        this.Crystal = child
        this.CrystalPosition = child.position.clone()
      }

      // Special case to Burn the tree later
      if (child.name.includes("Tree_raycast") && !child.name.includes("Tree_raycast_")) {
        this.Tree = child
        this.TreePosition = child.position.clone()
      }

      // Animation meshes
      if (child.name.includes("_anim_")) {
        this.bridgeChunks.push(child) // Add to bridge chunks for physics later
        child.visible = false // Hide animation meshes by default
        child.castShadow = false
        child.receiveShadow = true
      }

      if (child.name.includes("Cliff_rigidbody")) {
        this.cliffPhysicsMeshes.push(child)
        child.visible = false // Hide cliff physics meshes by default
      }
    })
  }

  update() {}
}
