import * as THREE from "three"
import Experience from "../Experience.js"
import gsap from "gsap"

export default class Crystal {
  constructor() {
    this.experience = new Experience()
    this.debug = this.experience.debug
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    // Enviornment
    this.enviornmentLight = this.experience.world.environment.sunLight
    this.clouds = this.experience.world.environment.cloudsMesh

    // Lightning
    this.lightningStrikeMesh = this.experience.world.lightning.lightningStrikeMesh
    this.lightningLight = this.experience.world.lightning.light
    this.randomLightningStrikes = this.experience.world.lightning.randomLightningStrikes

    // Ocean
    this.ocean = this.experience.world.ocean

    // Crystal
    this.crystal = null
    if (this.experience.world.castle.Crystal) {
      this.crystal = this.experience.world.castle.Crystal
    }
    this.newCrystalPosition = this.experience.world.castle.CrystalPosition.clone().add(new THREE.Vector3(0, 0.1, 0)) // Adjust position slightly above the original

    // Animation properties
    this.isAnimating = false
    this.fadeInDuration = 4
    this.duration = 10
    this.fadeOutDuration = 4
  }

  animateCrystal() {
    if (!this.crystal) return

    const originalY = this.crystal.position.y
    const targetY = this.newCrystalPosition.y
    const mat = new THREE.MeshStandardMaterial({
      color: this.crystal.material.color,
      emissive: this.crystal.material.color,
      emissiveIntensity: 0.0, // Start low
    })
    this.crystal.material = mat

    // Store data
    this.crystal.userData.rotationSpeed = 0.04
    this.crystal.userData.shouldRotate = true

    // Step 1: Animate rise, rotation, and emissive intensity increase
    gsap.to(this.crystal.position, {
      duration: this.fadeInDuration,
      ease: "sine.inOut",
      y: targetY,
    })

    gsap.to(this.crystal.rotation, {
      duration: this.fadeInDuration,
      ease: "sine.in",
      y: Math.PI * 4,
    })

    gsap.to(mat, {
      duration: this.fadeInDuration,
      ease: "sine.in",
      emissiveIntensity: 0.5, // Glow more while rising
    })

    // Step 2: Continuous rotation after reaching peak
    gsap.delayedCall(this.fadeInDuration, () => {
      const rotateLoop = () => {
        if (!this.crystal || !this.crystal.userData.shouldRotate) return
        this.crystal.rotation.y += this.crystal.userData.rotationSpeed
        this.crystal.userData.rafId = requestAnimationFrame(rotateLoop)
      }
      rotateLoop()

      // Step 3: After 10 seconds at peak, descend and fade out
      gsap.delayedCall(this.duration, () => {
        // Descend
        gsap.to(this.crystal.position, {
          duration: this.fadeOutDuration,
          ease: "sine.inOut",
          y: originalY,
        })

        // Fade emissive glow
        gsap.to(mat, {
          duration: this.fadeOutDuration,
          ease: "sine.out",
          emissiveIntensity: 0.0,
        })

        // Reduce rotation speed gradually
        gsap.to(this.crystal.userData, {
          duration: this.fadeOutDuration + 1,
          ease: "sine.out",
          rotationSpeed: 0,
          onComplete: () => {
            this.crystal.userData.shouldRotate = false
            cancelAnimationFrame(this.crystal.userData.rafId)
          },
        })
      })
    })
  }

  animateChangeColors() {
    if (!this.crystal || !this.lightningStrikeMesh) return

    const targetColor = new THREE.Color("red")

    this._targetColors = {
      lightningStrike: new THREE.Color("#ff0000"),
      lightningLight: new THREE.Color("#750000"),
      environmentLight: new THREE.Color("#844343"),
      cloudBase: new THREE.Color("#9d3939"),
      oceanDepth: new THREE.Color("#1f0505"),
      oceanSurface: new THREE.Color("#401111"),
    }

    // Store original colors (only once)
    this._originalColors = this._originalColors || {
      lightningStrike: this.lightningStrikeMesh.material.color.clone(),
      lightningLight: this.lightningLight.color.clone(),
      environmentLight: this.enviornmentLight.color.clone(),
      cloudBase: this.clouds.material.uniforms.base.value.clone(),
      oceanDepth: this.ocean.material.uniforms.uDepthColor.value.clone(),
      oceanSurface: this.ocean.material.uniforms.uSurfaceColor.value.clone(),
      randomStrikes: this.randomLightningStrikes.map((strike) => strike.mesh.material.color.clone()),
    }

    // Short references
    const currentLightningColor = this.lightningStrikeMesh.material.color
    const lightningLight = this.lightningLight
    const envLight = this.enviornmentLight
    const clouds = this.clouds.material.uniforms.base.value
    const oceanDepth = this.ocean.material.uniforms.uDepthColor.value
    const oceanSurface = this.ocean.material.uniforms.uSurfaceColor.value

    const timeline = gsap.timeline()

    // --- Phase 1: Animate to red
    timeline.to(
      currentLightningColor,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.lightningStrike.r,
        g: this._targetColors.lightningStrike.g,
        b: this._targetColors.lightningStrike.b,
        onUpdate: () => {
          this.lightningStrikeMesh.material.color.setRGB(currentLightningColor.r, currentLightningColor.g, currentLightningColor.b)
        },
      },
      0
    )

    timeline.to(
      lightningLight.color,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.lightningLight.r,
        g: this._targetColors.lightningLight.g,
        b: this._targetColors.lightningLight.b,
      },
      0
    )

    timeline.to(
      envLight.color,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.environmentLight.r,
        g: this._targetColors.environmentLight.g,
        b: this._targetColors.environmentLight.b,
      },
      0
    )

    timeline.to(
      clouds,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.cloudBase.r,
        g: this._targetColors.cloudBase.g,
        b: this._targetColors.cloudBase.b,
      },
      0
    )

    timeline.to(
      oceanSurface,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.oceanSurface.r,
        g: this._targetColors.oceanSurface.g,
        b: this._targetColors.oceanSurface.b,
      },
      0
    )

    timeline.to(
      oceanDepth,
      {
        duration: this.fadeInDuration,
        ease: "sine.in",
        r: this._targetColors.oceanDepth.r,
        g: this._targetColors.oceanDepth.g,
        b: this._targetColors.oceanDepth.b,
      },
      0
    )

    // Random lightning strikes
    this.randomLightningStrikes.forEach((strike, index) => {
      const current = strike.mesh.material.color
      timeline.to(
        current,
        {
          duration: this.fadeInDuration,
          ease: "sine.in",
          r: this._targetColors.lightningStrike.r,
          g: this._targetColors.lightningStrike.g,
          b: this._targetColors.lightningStrike.b,
          onUpdate: () => {
            strike.mesh.material.color.setRGB(current.r, current.g, current.b)
          },
        },
        0
      )
    })

    // --- Phase 2: Hold for 10 seconds
    timeline.to({}, { duration: this.duration })

    // --- Phase 3: Animate back to original
    const orig = this._originalColors

    timeline.to(currentLightningColor, {
      duration: this.fadeOutDuration,
      ease: "sine.out",
      r: orig.lightningStrike.r,
      g: orig.lightningStrike.g,
      b: orig.lightningStrike.b,
      onUpdate: () => {
        this.lightningStrikeMesh.material.color.setRGB(currentLightningColor.r, currentLightningColor.g, currentLightningColor.b)
      },
    })

    timeline.to(
      lightningLight.color,
      {
        duration: this.fadeOutDuration,
        ease: "sine.in",
        r: orig.lightningLight.r,
        g: orig.lightningLight.g,
        b: orig.lightningLight.b,
      },
      "<"
    ) // Start at same time

    timeline.to(
      envLight.color,
      {
        duration: this.fadeOutDuration,
        ease: "sine.out",
        r: orig.environmentLight.r,
        g: orig.environmentLight.g,
        b: orig.environmentLight.b,
      },
      "<"
    )

    timeline.to(
      clouds,
      {
        duration: this.fadeOutDuration,
        ease: "sine.out",
        r: orig.cloudBase.r,
        g: orig.cloudBase.g,
        b: orig.cloudBase.b,
      },
      "<"
    )

    timeline.to(
      [oceanDepth, oceanSurface],
      {
        duration: this.fadeOutDuration,
        ease: "sine.out",
        r: orig.oceanDepth.r,
        g: orig.oceanDepth.g,
        b: orig.oceanDepth.b,
      },
      "<"
    )

    this.randomLightningStrikes.forEach((strike, index) => {
      const current = strike.mesh.material.color
      const original = orig.randomStrikes[index]
      timeline.to(
        current,
        {
          duration: this.fadeOutDuration,
          ease: "sine.out",
          r: original.r,
          g: original.g,
          b: original.b,
          onUpdate: () => {
            strike.mesh.material.color.setRGB(current.r, current.g, current.b)
          },
        },
        "<"
      )
    })

    timeline.call(() => {
      this.isAnimating = false
    })
  }

  update() {}
}
