import * as THREE from "three"
import Experience from "../Experience.js"
import { LightningStrike } from "three-stdlib"
import ParticleSystem from "../Utils/ParticleSystem.js"
import { createDissolveMaterial } from "../Materials/dissolveMaterial.js"
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

    // Bridge properties
    this.Bridge = null
    this.BridgePosition = null
    if (this.experience.world.castle && this.experience.world.castle.BridgePosition) {
      this.Bridge = this.experience.world.castle.Bridge
      this.BridgePosition = this.experience.world.castle.BridgePosition.clone()
    }

    // Crystal properties
    this.Crystal = null
    if (this.experience.world.castle && this.experience.world.castle.Crystal) {
      this.Crystal = this.experience.world.castle.Crystal
    }

    this.defaultOceanLightIntensity = null
    if (this.experience.world.ocean && this.experience.world.ocean.material) {
      this.defaultOceanLightIntensity = this.experience.world.ocean.material.uniforms.uLightIntensity.value
    }

    this.randomLightningStrikes = []
    this.maxRandomStrikes = 10

    this.createLightning()
    this.createBurnEffect()
    // this.burnTree()
    this.createDissolveEffect()

    setTimeout(() => {
      // Pre-warm lightning rendering
      this.lightningStrike.update(0)
      this.lightningStrikeMesh.visible = true
      this.light.visible = true
      this.lightningStrikeMesh.visible = false
      this.light.visible = false
      this.fireLight.visible = true
      this.renderer.render(this.scene, this.camera)
      this.renderer.render(this.scene, this.camera)
      this.fireLight.visible = false

      console.log("Lightning pre-warmed and ready for action.")
      this.resources.finishLoading() // Call finishLoading to hide the loading screen
    }, 1000) // Slight delay to let resources settle

    this.randomLightningInterval = 3000 // 3 seconds
    this.randomLightningRadius = 100 // radius around the camera/player
    this.randomLightningEnabled = true
    this.randomLightningCount = 6
    this.randomLightningDelayMax = 3000

    this.startRandomLightning()
  }

  startRandomLightning() {
    setInterval(() => {
      if (!this.randomLightningEnabled) return

      const lightningCount = this.randomLightningCount

      for (let i = 0; i < lightningCount; i++) {
        const delay = Math.random() * this.randomLightningDelayMax

        setTimeout(() => {
          const angle = Math.random() * Math.PI * 2
          const radius = this.randomLightningRadius * Math.sqrt(Math.random())
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius

          const center = this.camera.position.clone()
          const startPosition = new THREE.Vector3(center.x + x, 50, center.z + z)
          const endPosition = new THREE.Vector3(center.x + x, 0, center.z + z)

          this.castRandomLightningStrike(startPosition, endPosition)
        }, delay)
      }
    }, this.randomLightningInterval)
  }

  createDissolveEffect() {
    const baseMaterial = new THREE.MeshStandardMaterial({ color: this.Tree.children[0].material.color })
    this.dissolveMaterial = new createDissolveMaterial({ baseMaterial: baseMaterial })
    this.Tree.children[0].material = this.dissolveMaterial.material // Replace the tree's material with the dissolve material
  }

  createBurnEffect() {
    this.fireParticles = new ParticleSystem({
      parent: this.scene,
      camera: this.camera,
      position: this.TreePosition,
    })

    this.fireLightDecaySpeed = 0.00001 // Speed at which the light decays

    this.fireLight = new THREE.PointLight(0xffa500, 0.01, 1, 1.5)
    this.fireLight.position.copy(this.TreePosition).add(new THREE.Vector3(0, 0.03, 0)) // Position the light slightly above the tree
    this.fireLight.castShadow = false
    this.fireLight.visible = false // Start with the light invisible
    this.scene.add(this.fireLight)

    if (this.debug.active) {
      this.fireLightHelper = new THREE.PointLightHelper(this.fireLight, 0.05)
      this.scene.add(this.fireLightHelper)
    }
  }

  burnTree() {
    if (this.isTreeBurned) return // Prevent multiple burns
    this.isTreeBurned = true // Flag to prevent multiple burns

    this.isBurning = true
    this.isTreeDissolving = true // Start dissolving the tree

    this.fireLight.visible = true // Make the fire light visible

    this.isFireLightDecaying = false

    this.burnTimeout = setTimeout(() => {
      this.fireParticles._emit = false
      this.isFireLightDecaying = true
      this.experience.raycaster.objects = this.experience.raycaster.objects.filter((obj) => obj !== this.Tree) // Remove the tree from raycastable objects

      // this.fireLight.remove() //
    }, this.burningDuration)
  }

  collapseBridge(impactPoint, impactNormal) {
    this.experience.world.castle.Bridge.visible = false // Hide the bridge
    this.experience.world.castle.BridgeBrick.visible = false // Hide the bridge bricks

    this.experience.raycaster.objects = this.experience.raycaster.objects.filter((obj) => obj !== this.Bridge)
    this.experience.raycaster.objects = this.experience.raycaster.objects.filter((obj) => obj !== this.BridgeBrick) // Remove the bridge mesh from raycastable objects

    this.experience.world.bridgeCollapsePhysics.physicsEnabled = true // Enable physics for the bridge collapse
    this.experience.world.bridgeCollapsePhysics.breakBridge(impactPoint, impactNormal) // Break the bridge
  }

  castRandomLightningStrike(startPosition, endPosition) {
    const timeLimit = 1000

    // Find an inactive strike
    const available = this.randomLightningStrikes.find((s) => !s.active)
    if (!available) return // All busy

    const { strike, mesh } = available

    strike.rayParameters.sourceOffset.copy(startPosition)
    strike.rayParameters.destOffset.copy(endPosition)

    mesh.visible = true
    available.active = true

    // Auto-hide and mark as inactive
    if (available.hideTimeout) clearTimeout(available.hideTimeout)
    available.hideTimeout = setTimeout(() => {
      mesh.visible = false
      available.active = false
    }, timeLimit)
  }

  castLightningStrike(endPosition, raycastedObject = null, impactNormal = null) {
    // Prevent casting if still on cooldown
    if (this.lightningCooldown) return

    // Special case for burning the tree
    if (raycastedObject && raycastedObject.name.includes("Tree") && !this.isTreeBurned) {
      setTimeout(() => {
        this.burnTree()
      }, 500) // Wait half a second after lightning strike
    }

    // Special case for destroying the bridge
    if (raycastedObject && raycastedObject.name.includes("Bridge")) {
      this.collapseBridge(endPosition, impactNormal)
    }

    // Special case for crystal
    if (raycastedObject && raycastedObject.name.includes("Crystal") && !this.experience.world.crystalAnimation.isAnimating) {
      this.experience.world.crystalAnimation.isAnimating = true // Set the flag to prevent multiple animations
      this.experience.world.crystalAnimation.animateCrystal() // Call the method to animate the crystal
      this.experience.world.crystalAnimation.animateChangeColors() // Change lightning color to red
    }

    // Special case for watchtower
    if (raycastedObject && raycastedObject.name.includes("WatchTower")) {
      endPosition = raycastedObject.position
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

    if (this.hideTimeout) clearTimeout(this.hideTimeout) // Clear any existing timeout

    // Hide lightning after 1 second
    this.hideTimeout = setTimeout(() => {
      this.lightningStrikeMesh.visible = false
      this.light.visible = false
      this.experience.world.ocean.material.uniforms.uLightIntensity.value = this.defaultOceanLightIntensity // Reset ocean light intensity
    }, timeLimit)
  }

  createLightning() {
    this.lightningStartPosition = new THREE.Vector3(0, 50, 0)
    this.lightningEndPosition = new THREE.Vector3(0, 0, 0)

    this.lightObject = {
      color: "#00ffff",
      extraHeight: 0.2,
      intensity: 0.5, // Default intensity
    }

    this.light = new THREE.PointLight(this.lightObject.color, this.lightObject.intensity, 2)
    this.light.extraHeight = this.lightObject.extraHeight
    this.light.castShadow = false
    // this.light.shadow.mapSize.width = 512
    // this.light.shadow.mapSize.height = 512
    // this.light.shadow.camera.near = 0.5
    // this.light.shadow.camera.far = 500
    // this.light.shadow.normalBias = 0.04
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

    this.scene.add(this.lightningStrikeMesh)

    for (let i = 0; i < this.maxRandomStrikes; i++) {
      // Create random lightning strikes
      const randomRayParams = {
        sourceOffset: new THREE.Vector3(),
        destOffset: new THREE.Vector3(),
        radius0: 0.3,
        radius1: 0.1,
        minRadius: 2,
        maxIterations: 7,
        isEternal: true,

        timeScale: 0.2,

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

      const strike = new LightningStrike(randomRayParams)
      const mesh = new THREE.Mesh(strike, new THREE.MeshBasicMaterial({ color: this.lightningObject.lightningColor }))
      mesh.visible = false

      this.scene.add(mesh)

      this.randomLightningStrikes.push({
        strike,
        mesh,
        active: false,
        hideTimeout: null,
      })
    }

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
  }

  update() {
    const t = this.experience.time.elapsed * 0.0005
    const delta = this.experience.time.delta

    if (this.lightningStrike && this.lightningStrikeMesh.visible) {
      this.lightningStrike.update(t)
      this.light.intensity = Math.random() * this.lightObject.intensity
      if (this.defaultOceanLightIntensity) {
        this.experience.world.ocean.material.uniforms.uLightIntensity.value = this.light.intensity * (this.defaultOceanLightIntensity * 10.0)
      } // Update ocean light intensity
    }

    this.randomLightningStrikes.forEach(({ strike, mesh }) => {
      if (mesh.visible) {
        strike.update(t)
      }
    })

    if (this.isBurning) {
      this.fireParticles.Step(delta * 0.003) // Update fire particles
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
  }
}
