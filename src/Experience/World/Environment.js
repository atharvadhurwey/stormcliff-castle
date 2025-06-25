import * as THREE from "three"
import Experience from "../Experience.js"
import { createCloudMateiral } from "../Materials/cloudMaterial.js"

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.camera = this.experience.camera.instance

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("environment")
      this.debugFolder.close()
    }

    this.setSunLight()
    this.setEnvironmentMap()
    // this.setAmbientLight()
    this.setFog()

    this.setDarkClouds()
  }

  setSunLight() {
    this.sunLightObject = {
      intensity: 2,
      color: "#acacc1",
      far: 10,
      normalBias: 0.04,
      radius: 1,
    }

    this.sunLight = new THREE.DirectionalLight(this.sunLightObject.color, this.sunLightObject.intensity)
    this.sunLight.castShadow = true
    this.sunLight.shadow.camera.far = this.sunLightObject.far
    this.sunLight.shadow.normalBias = this.sunLightObject.normalBias
    this.sunLight.shadow.radius = this.sunLightObject.radius
    this.sunLight.shadow.mapSize.set(2048, 2048)
    this.scene.add(this.sunLight)

    if (this.debug.active) {
      this.helper = new THREE.DirectionalLightHelper(this.sunLight, 5)
      this.scene.add(this.helper)
    }

    // Default spherical coordinates
    this.sunConfig = {
      radius: 10,
      theta: Math.PI / 4, // around Y (horizontal)
      phi: Math.PI / 3, // from top (vertical)
    }

    const updateSunPosition = () => {
      const { radius, theta, phi } = this.sunConfig
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.cos(phi)
      const z = radius * Math.sin(phi) * Math.sin(theta)
      this.sunLight.position.set(x, y, z)

      if (this.debug.active) {
        this.helper.update()
      }
    }

    updateSunPosition()

    // Debug
    if (this.debug.active) {
      this.sunDebugFolder = this.debugFolder.addFolder("sun")
      this.sunDebugFolder.add(this.sunLight, "intensity").name("sunLightIntensity").min(0).max(10).step(0.001)
      this.sunDebugFolder.addColor(this.sunLight, "color").name("sunLightColor")
      // this.sunDebugFolder.add(this.sunConfig, "radius").min(0).max(50).step(0.1).onChange(updateSunPosition)
      this.sunDebugFolder
        .add(this.sunConfig, "theta")
        .name("theta (π rad)")
        .min(0)
        .max(Math.PI * 2)
        .step(0.01)
        .onChange(updateSunPosition)
      this.sunDebugFolder.add(this.sunConfig, "phi").name("phi (π rad)").min(0).max(Math.PI).step(0.01).onChange(updateSunPosition)
      this.sunDebugFolder
        .add(this.sunLightObject, "normalBias")
        .min(0)
        .max(0.1)
        .onChange(() => (this.sunLight.shadow.normalBias = this.sunLightObject.normalBias))
      this.sunDebugFolder
        .add(this.sunLightObject, "radius")
        .min(0)
        .max(5)
        .onChange(() => (this.sunLight.shadow.radius = this.sunLightObject.radius))
    }
  }

  setEnvironmentMap() {
    this.environmentMap = {}
    this.environmentMap.intensity = 0.4
    this.environmentMap.texture = this.resources.items.environmentMapTexture
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace

    this.scene.environment = this.environmentMap.texture

    this.environmentMap.updateMaterials = () => {
      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMap = this.environmentMap.texture
          child.material.envMapIntensity = this.environmentMap.intensity
          child.material.needsUpdate = true
        }
      })
    }
    this.environmentMap.updateMaterials()

    // Debug
    if (this.debug.active) {
      this.debugFolder.add(this.environmentMap, "intensity").name("envMapIntensity").min(0).max(4).step(0.001).onChange(this.environmentMap.updateMaterials)
    }
  }

  setAmbientLight() {
    this.ambientLight = new THREE.AmbientLight("#acacc1", 0.1)
    this.scene.add(this.ambientLight)

    // Debug
    if (this.debug.active) {
      this.debugFolder.add(this.ambientLight, "intensity").name("ambientLightIntensity").min(0).max(10).step(0.001)
      this.debugFolder.addColor(this.ambientLight, "color").name("ambientLightColor")
    }
  }

  setFog() {
    this.scene.fog = new THREE.FogExp2("#87889c", 0.01)

    // Debug
    if (this.debug.active) {
      this.debugFolder.addColor(this.scene.fog, "color").name("fogColor")
      this.debugFolder.add(this.scene.fog, "density").name("fogDensity").min(0).max(0.1).step(0.001)
    }
  }

  setDarkClouds() {
    const darkCloudsProps = {
      threshold: 0.2,
      opacity: 0.1,
      range: 0.08,
      steps: 9,
      position: new THREE.Vector3(0, 50, 0),
      color: "#87889c",
      scale: new THREE.Vector3(500, 100, 500),
      depthTest: true,
    }

    const cloudGeometry = new THREE.SphereGeometry(1, 1, 1)
    const cloudMaterial = createCloudMateiral({
      threshold: darkCloudsProps.threshold,
      opacity: darkCloudsProps.opacity,
      range: darkCloudsProps.range,
      steps: darkCloudsProps.steps,
      color: darkCloudsProps.color,
    })

    this.cloudsMesh = new THREE.Mesh(cloudGeometry, cloudMaterial)

    this.cloudsMesh.position.copy(darkCloudsProps.position)
    this.cloudsMesh.scale.copy(darkCloudsProps.scale)

    this.scene.add(this.cloudsMesh)

    // Debug
    if (this.debug.active) {
      this.cloudDebugFolder = this.debugFolder.addFolder("clouds")
      this.cloudDebugFolder.add(this.cloudsMesh.material.uniforms.threshold, "value").name("cloudsMeshThreshold").min(0).max(1).step(0.001)
      this.cloudDebugFolder.add(this.cloudsMesh.material.uniforms.opacity, "value").name("cloudsMeshOpacity").min(0).max(1).step(0.001)
      this.cloudDebugFolder.add(this.cloudsMesh.material.uniforms.range, "value").name("cloudsMeshRange").min(0).max(0.2).step(0.001)
      this.cloudDebugFolder.add(this.cloudsMesh.material.uniforms.steps, "value").name("cloudsMeshSteps").min(1).max(128).step(1)

      this.cloudDebugFolder.add(this.cloudsMesh.position, "y").name("cloudsMeshY").min(-100).max(100).step(1)
      this.cloudDebugFolder.add(this.cloudsMesh.scale, "x").name("cloudsMeshScaleX").min(0).max(500).step(1)
      this.cloudDebugFolder.add(this.cloudsMesh.scale, "y").name("cloudsMeshScaleY").min(0).max(500).step(1)
      this.cloudDebugFolder.add(this.cloudsMesh.scale, "z").name("cloudsMeshScaleZ").min(0).max(500).step(1)
    }
  }

  update() {
    if (this.cloudsMesh) {
      this.cloudsMesh.material.uniforms.cameraPos.value.copy(this.camera.position)
      this.cloudsMesh.rotation.y = -performance.now() / 7500

      this.cloudsMesh.material.uniforms.frame.value++
    }
  }
}
