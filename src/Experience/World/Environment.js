import * as THREE from "three"
import Experience from "../Experience.js"

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("environment")
    }

    this.setSunLight()
    // this.setPostLamp()
    this.setEnvironmentMap()
    // this.setAmbientLight()
    this.setFog()
  }

  setSunLight() {
    this.sunLight = new THREE.DirectionalLight("#acacc1", 2)
    this.sunLight.castShadow = true
    this.sunLight.shadow.camera.far = 100
    this.sunLight.shadow.mapSize.set(2048, 2048)
    this.sunLight.shadow.normalBias = 0.04
    this.sunLight.position.set(3.5, 2, -1.25)
    this.scene.add(this.sunLight)

    this.helper = new THREE.DirectionalLightHelper(this.sunLight, 5)
    this.scene.add(this.helper)

    // Debug
    if (this.debug.active) {
      this.debugFolder.add(this.sunLight, "intensity").name("sunLightIntensity").min(0).max(10).step(0.001)

      this.debugFolder.add(this.sunLight.position, "x").name("sunLightX").min(-50).max(50).step(0.001)

      this.debugFolder.add(this.sunLight.position, "y").name("sunLightY").min(-50).max(50).step(0.001)

      this.debugFolder.add(this.sunLight.position, "z").name("sunLightZ").min(-50).max(50).step(0.001)

      this.debugFolder.add(this.sunLight.rotation, "x").name("sunLightRotationX").min(-Math.PI).max(Math.PI).step(0.001)
      this.debugFolder.add(this.sunLight.rotation, "y").name("sunLightRotationY").min(-Math.PI).max(Math.PI).step(0.001)
      this.debugFolder.add(this.sunLight.rotation, "z").name("sunLightRotationZ").min(-Math.PI).max(Math.PI).step(0.001)
    }
  }

  setPostLamp() {
    this.postLamp = new THREE.PointLight("#acacc1", 0.5, 10)
    this.postLamp.castShadow = true
    this.postLamp.shadow.mapSize.set(1024, 1024)
    this.postLamp.shadow.camera.far = 10
    this.postLamp.position.set(0, 1.5, -2)
    this.scene.add(this.postLamp)

    // Debug
    if (this.debug.active) {
      this.debugFolder.add(this.postLamp, "intensity").name("postLampIntensity").min(0).max(10).step(0.001)
      this.debugFolder.add(this.postLamp.position, "x").name("postLampX").min(-50).max(50).step(0.001)
      this.debugFolder.add(this.postLamp.position, "y").name("postLampY").min(-50).max(50).step(0.001)
      this.debugFolder.add(this.postLamp.position, "z").name("postLampZ").min(-50).max(50).step(0.001)
    }
  }

  setEnvironmentMap() {
    this.environmentMap = {}
    this.environmentMap.intensity = 1
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
    this.scene.fog = new THREE.FogExp2("#acacc1", 0.01)

    // Debug
    if (this.debug.active) {
      this.debugFolder.addColor(this.scene.fog, "color").name("fogColor")
      this.debugFolder.add(this.scene.fog, "density").name("fogDensity").min(0).max(0.1).step(0.001)
    }
  }
}
