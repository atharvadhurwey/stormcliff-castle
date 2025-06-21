import * as THREE from "three"
import Experience from "../Experience.js"
import { EffectComposer, LightningStrike, OutlinePass, RenderPass } from "three-stdlib"
import ParticleSystem from "../Utils/ParticleSystem.js"
import { createDissolveMaterial } from "../Utils/DissolveMaterial.js"
import { easing } from "maath"

export default class Lightning {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.renderer = this.experience.renderer.instance
    this.camera = this.experience.camera.instance

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("lightning")
      this.debugFolder.close()
    }

    // Tree properties
    this.Tree = null
    this.TreePosition = null
    this.isTreeBurned = false
    this.isBurning = false // Flag to track if the tree is burning
    this.isTreeDissolving = false // Flag to track if the tree is dissolved
    this.burningDuration = 10000 // Duration for the fire effect in milliseconds
    if (this.experience.world.castle && this.experience.world.castle.TreePosition) {
      this.Tree = this.experience.world.castle.Tree
      this.TreePosition = this.experience.world.castle.TreePosition.clone()
    }

    this.defaultOceanLightIntensity = null
    if (this.experience.world.ocean && this.experience.world.ocean.material) {
      this.defaultOceanLightIntensity = this.experience.world.ocean.material.uniforms.uLightIntensity.value
    }

    this.createLightning()

    setTimeout(() => {
      // Pre-warm lightning rendering
      this.lightningStrike.update(0)
      this.lightningStrikeMesh.visible = true
      this.light.visible = true
      this.composer.render()
      this.lightningStrikeMesh.visible = false
      this.light.visible = false
    }, 100) // Slight delay to let resources settle

    // this.burnTree()
    this.dissolveTree()
  }

  dissolveTree() {
    const baseMaterial = new THREE.MeshStandardMaterial({ color: this.Tree.children[0].material.color })
    this.dissolveMaterial = new createDissolveMaterial({ baseMaterial: baseMaterial })
    this.Tree.children[0].material = this.dissolveMaterial.material // Replace the tree's material with the dissolve material
  }

  burnTree() {
    if (this.isTreeBurned) return // Prevent multiple burns
    this.isTreeBurned = true // Flag to prevent multiple burns

    this.fireParticles = new ParticleSystem({
      parent: this.scene,
      camera: this.camera,
      position: this.TreePosition,
    })

    this.isBurning = true
    this.isTreeDissolving = true // Start dissolving the tree

    this.fireLightDecaySpeed = 0.00001 // Speed at which the light decays
    this.isFireLightDecaying = false

    this.fireLight = new THREE.PointLight(0xffa500, 0.01)
    this.fireLight.position.copy(this.TreePosition).add(new THREE.Vector3(0, 0.03, 0)) // Position the light slightly above the tree

    // this.fireLight.castShadow = true
    this.scene.add(this.fireLight)

    if (this.debug.active) {
      this.fireLightHelper = new THREE.PointLightHelper(this.fireLight, 0.05)
      this.scene.add(this.fireLightHelper)
    }

    this.burnTimeout = setTimeout(() => {
      this.fireParticles._emit = false
      this.isFireLightDecaying = true
      this.experience.raycaster.objects = this.experience.raycaster.objects.filter((obj) => obj !== this.Tree) // Remove the tree from raycastable objects
    }, this.burningDuration)
  }

  castLightningStrike(endPosition) {
    // Prevent casting if still on cooldown
    if (this.lightningCooldown) return

    // Special case for burning the tree
    if (endPosition.x == this.TreePosition.x && endPosition.y == this.TreePosition.y && endPosition.z == this.TreePosition.z) {
      this.burnTree()
    }

    const timeLimit = 500 // 1 second cooldown

    // Set cooldown
    this.lightningCooldown = true
    setTimeout(() => {
      this.lightningCooldown = false
    }, timeLimit)

    this.lightningEndPosition.copy(endPosition)
    this.lightningStrike.rayParameters.destOffset.copy(this.lightningEndPosition)

    this.light.position.copy(this.lightningEndPosition)
    this.light.position.y += this.light.extraHeight // Adjust light position slightly above the end point

    this.lightningStrikeMesh.visible = true // Show the mesh when casting lightning
    this.light.visible = true // Make the light visible
    if (this.outlinePass) {
      this.outlinePass.selectedObjects = [this.lightningStrikeMesh] // Update the outline pass to include the lightning mesh
    }

    if (this.hideTimeout) clearTimeout(this.hideTimeout) // Clear any existing timeout

    // Hide lightning after 1 second
    this.hideTimeout = setTimeout(() => {
      this.lightningStrikeMesh.visible = false
      this.light.visible = false
      this.experience.world.ocean.material.uniforms.uLightIntensity.value = this.defaultOceanLightIntensity // Reset ocean light intensity
      if (this.outlinePass) {
        this.outlinePass.selectedObjects = []
      }
    }, timeLimit)
  }

  createOutline(composer, lightningArray, edgeStrength = 2, edgeGlow = 2.5, edgeThickness = 1, visibleEdgeColor = new THREE.Color(0x00aaff)) {
    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera, lightningArray)
    outlinePass.edgeStrength = edgeStrength
    outlinePass.edgeGlow = edgeGlow
    outlinePass.edgeThickness = edgeThickness
    outlinePass.visibleEdgeColor.set(visibleEdgeColor)
    composer.addPass(outlinePass)
    return outlinePass
  }

  createLightning() {
    this.lightningStartPosition = new THREE.Vector3(0, 50, 0)
    this.lightningEndPosition = new THREE.Vector3(0, 0, 0)

    this.lightObject = {
      color: "#00ffff",
      extraHeight: 0.2,
      intensity: 0.5, // Default intensity
    }
    this.light = new THREE.PointLight(0x00ffff)
    this.light.extraHeight = this.lightObject.extraHeight
    this.light.castShadow = true
    this.light.shadow.mapSize.width = 512
    this.light.shadow.mapSize.height = 512
    // this.light.shadow.camera.near = 0.5
    // this.light.shadow.camera.far = 500
    this.light.shadow.normalBias = 0.04
    this.light.visible = false // Start with the light invisible

    this.scene.add(this.light)

    if (this.debug.active) {
      const lightHelper = new THREE.PointLightHelper(this.light, 0.1)
      this.scene.add(lightHelper)

      this.lightDebugFolder = this.debugFolder.addFolder("Lightning Flash")
      this.lightDebugFolder.addColor(this.lightObject, "color").onChange(() => this.light.color.set(this.lightObject.color))
      this.lightDebugFolder
        .add(this.lightObject, "extraHeight")
        .min(0)
        .max(1)
        .onChange(() => (this.light.extraHeight = this.lightObject.extraHeight))
      this.lightDebugFolder
        .add(this.lightObject, "intensity")
        .min(0)
        .max(5)
        .onChange(() => (this.light.intensity = this.lightObject.intensity))
    }

    const outlineMeshArray = []

    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    const rayParams = {
      sourceOffset: new THREE.Vector3(),
      destOffset: new THREE.Vector3(),
      radius0: 0.3,
      radius1: 0.002,
      minRadius: 2,
      maxIterations: 7,
      isEternal: true,

      timeScale: 0.7,

      propagationTimeFactor: 0.05,
      vanishingTimeFactor: 0.95,
      subrayPeriod: 2.5,
      subrayDutyCycle: 0.3,
      maxSubrayRecursion: 3,
      ramification: 7,
      recursionProbability: 0.6,

      roughness: 0.85,
      straightness: 0.68,
    }

    rayParams.sourceOffset.copy(this.lightningStartPosition)
    rayParams.destOffset.copy(this.lightningEndPosition)

    // Create the lightning strike
    this.lightningObject = {}
    this.lightningObject.lightningColor = new THREE.Color(0xffffff)
    this.lightningStrike = new LightningStrike(rayParams)
    this.lightningStrikeMesh = new THREE.Mesh(this.lightningStrike, new THREE.MeshBasicMaterial({ color: this.lightningObject.lightningColor }))

    this.lightningStrikeMesh.visible = false // Hide the mesh by default

    outlineMeshArray.push(this.lightningStrikeMesh)

    this.scene.add(this.lightningStrikeMesh)

    if (this.debug.active) {
      this.strikeDebugFolder = this.debugFolder.addFolder("Lightning Strike")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "radius0").min(0).max(0.5).step(0.001).name("Radius 0")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "radius1").min(0).max(0.01).step(0.001).name("Radius 1")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "minRadius").min(0).max(10).step(0.01).name("Min Radius")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "maxIterations").min(1).max(20).step(1).name("Max Iterations")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "timeScale").min(0).max(1).step(0.01).name("Time Scale")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "subrayPeriod").min(0).max(10).step(0.01).name("Subray Period")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "subrayDutyCycle").min(0).max(1).step(0.01).name("Subray Duty Cycle")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "maxSubrayRecursion").min(0).max(10).step(1).name("Max Subray Recursion")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters, "straightness").min(0).max(1).step(0.01).name("Straightness")
      this.strikeDebugFolder.addColor(this.lightningObject, "lightningColor").onChange(() => this.lightningStrikeMesh.material.color.set(this.lightningObject.lightningColor))
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.sourceOffset, "x").min(-100).max(100).step(0.1).name("Source X")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.sourceOffset, "y").min(-100).max(100).step(0.1).name("Source Y")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.sourceOffset, "z").min(-100).max(100).step(0.1).name("Source Z")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.destOffset, "x").min(-1).max(1).step(0.001).name("Dest X")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.destOffset, "y").min(-1).max(1).step(0.001).name("Dest Y")
      this.strikeDebugFolder.add(this.lightningStrike.rayParameters.destOffset, "z").min(-1).max(1).step(0.001).name("Dest Z")
    }

    const outlinePassParams = {
      edgeStrength: 2,
      edgeGlow: 2.5,
      edgeThickness: 1,
      visibleEdgeColor: new THREE.Color(0x00aaff),
    }
    this.outlinePass = this.createOutline(
      this.composer,
      outlineMeshArray,
      outlinePassParams.edgeStrength,
      outlinePassParams.edgeGlow,
      outlinePassParams.edgeThickness,
      outlinePassParams.visibleEdgeColor
    )

    // this.outlinePass.materialCopy.depthTest = true
    // this.outlinePass.materialCopy.depthWrite = true

    // Debug
    if (this.debug.active) {
      this.outlineDebugFolder = this.debugFolder.addFolder("Lightning Outline")
      this.outlineDebugFolder.add(this.outlinePass, "edgeStrength").min(0).max(10).step(0.01).name("Edge Strength")
      this.outlineDebugFolder.add(this.outlinePass, "edgeGlow").min(0).max(10).step(0.01).name("Edge Glow")
      this.outlineDebugFolder.add(this.outlinePass, "edgeThickness").min(0).max(10).step(0.01).name("Edge Thickness")
      this.outlineDebugFolder.addColor(outlinePassParams, "visibleEdgeColor").onChange(() => this.outlinePass.visibleEdgeColor.set(outlinePassParams.visibleEdgeColor))
    }
  }

  update() {
    const t = this.experience.time.elapsed * 0.0005
    const delta = this.experience.time.delta

    this.renderer.autoClear = false
    this.renderer.clear()
    // this.renderer.setPixelRatio(window.devicePixelRatio)

    if (this.lightningStrike && this.lightningStrikeMesh.visible) {
      this.lightningStrike.update(t)
      this.light.intensity = Math.random() * this.lightObject.intensity
      if (this.defaultOceanLightIntensity) {
        this.experience.world.ocean.material.uniforms.uLightIntensity.value = this.light.intensity * (this.defaultOceanLightIntensity * 10.0)
      } // Update ocean light intensity
    }

    if (this.isBurning) {
      this.fireParticles.Step(0.016)
      if (!this.fireParticles._emit && this.fireParticles._particles.length === 0) {
        this.isBurning = false // Stop burning if no particles left
      }
      if (this.isFireLightDecaying) {
        this.fireLight.intensity -= this.fireLightDecaySpeed * t
        if (this.fireLight.intensity <= 0) {
          this.fireLight.intensity = 0 // Ensure it doesn't go below 0
          this.isFireLightDecaying = false // Stop decaying once it reaches 0
        }
      }
    }

    if (this.dissolveMaterial && (this.isBurning || this.isTreeDissolving)) {
      easing.damp(this.dissolveMaterial.uniforms.uProgress, "value", 0, this.burningDuration * 0.7, delta) // Smoothly transition the dissolve effect
      if (this.dissolveMaterial.uniforms.uProgress.value <= 0 && this.isTreeDissolving) {
        this.isTreeDissolving = false // Mark the tree as burned
      }
    }

    this.composer.render()
  }
}
