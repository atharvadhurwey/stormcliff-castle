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
    this.animationMeshes = []

    this.setModel()
    // this.setAnimation()
  }

  setModel() {
    this.castleModel = this.castle.scene
    this.scene.add(this.castleModel)

    // For burning the tree later
    this.TreePosition = null
    this.Tree = null

    // For destroying the bridge later
    this.BridgePosition = null
    this.Bridge = null
    this.BridgeBrick = null

    this.castleModel.traverse((child) => {
      if (child.name.includes("_raycast") && !child.name.includes("_raycast_")) {
        this.raycaster.registerObjectForRaycast(child)
      }

      if (child.name.includes("Bridge_raycast") && !child.name.includes("Bridge_raycast_")) {
        this.Bridge = child
        this.BridgePosition = child.position.clone()
      }

      if (child.name.includes("BridgeBrick_raycast") && !child.name.includes("BridgeBrick_raycast_")) {
        this.BridgeBrick = child
      }

      if (child.name.includes("_anim_")) {
        this.animationMeshes.push(child)
        child.visible = false // Hide animation meshes by default
      }

      // Special case to Burn the tree later
      if (child.name.includes("Tree_raycast") && !child.name.includes("Tree_raycast_")) {
        this.Tree = child
        this.TreePosition = child.position.clone()
      }

      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  setAnimation() {
    this.animation = {}
    // Mixer
    this.animation.mixer = new THREE.AnimationMixer(this.castleModel)

    this.animationMeshes.forEach((mesh) => {
      mesh.visible = true // Show animation meshes
    })

    this.castle.animations.forEach((clip) => {
      const action = this.animation.mixer.clipAction(clip)
      action.setLoop(THREE.LoopOnce)
      action.clampWhenFinished = true

      action.play()
    })

    // this.animation.actions.idle = this.animation.mixer.clipAction(this.resource.animations[0])
    // this.animation.actions.walking = this.animation.mixer.clipAction(this.resource.animations[1])
    // this.animation.actions.running = this.animation.mixer.clipAction(this.resource.animations[2])
    // this.animation.actions.current = this.animation.actions.idle
    // this.animation.actions.current.play()
    // // Play the action
    // this.animation.play = (name) => {
    //   const newAction = this.animation.actions[name]
    //   const oldAction = this.animation.actions.current
    //   newAction.reset()
    //   newAction.play()
    //   newAction.crossFadeFrom(oldAction, 1)
    //   this.animation.actions.current = newAction
    // }
    // // Debug
    // if (this.debug.active) {
    //   const debugObject = {
    //     playIdle: () => {
    //       this.animation.play("idle")
    //     },
    //     playWalking: () => {
    //       this.animation.play("walking")
    //     },
    //     playRunning: () => {
    //       this.animation.play("running")
    //     },
    //   }
    //   this.debugFolder.add(debugObject, "playIdle")
    //   this.debugFolder.add(debugObject, "playWalking")
    //   this.debugFolder.add(debugObject, "playRunning")
    // }
  }

  update() {
    if (this.animation && this.animation.mixer) {
      this.animation.mixer.update(this.time.delta * 0.0003)
    }
  }
}
