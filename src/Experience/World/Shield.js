import * as THREE from "three"
import Experience from "../Experience.js"

import vertexShader from "../../shaders/shield/vertex.glsl"
import fragmentShader from "../../shaders/shield/fragment.glsl"

export default class Shield {
  constructor() {
    this.experience = new Experience()
    this.debug = this.experience.debug
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.shieldMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("red") }, // example shield color
        uHitPosition: { value: new THREE.Vector3(0, 0, 0) },
        uCutoffHeight: { value: 0.78 }, // example cutoff height for shield effect
      },
      transparent: true, // so alpha works
      side: THREE.DoubleSide, // or THREE.FrontSide depending on shield effect
      // depthWrite: true, // true to write depth, false to avoid depth writing
    })

    const tempMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Temporary material for loading
      side: THREE.DoubleSide,
      wireframe: true, // For debugging, remove in production
      // blending: THREE.AdditiveBlending, // Optional, for glowing effect
    })

    const geometry = new THREE.SphereGeometry(0.5, 32, 32)
    this.shield = new THREE.Mesh(geometry, this.shieldMaterial)
    console.log(this.experience.world.castle.TreePosition)
    this.shield.position.copy(this.experience.world.castle.TreePosition).add(new THREE.Vector3(0, -0.4, 0))

    const hitPosition = this.shield.position.clone().add(new THREE.Vector3(0, 1.1, 0))

    this.shieldMaterial.uniforms.uHitPosition.value = hitPosition

    this.scene.add(this.shield)

    this.clock = new THREE.Clock()

    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("shield")
      this.debugFolder
        .addColor(this.shieldMaterial.uniforms.uColor, "value")
        .name("Shield Color")
        .onChange(() => {
          this.shieldMaterial.uniforms.uColor.value.set(this.shieldMaterial.uniforms.uColor.value)
        })

      const hitPositionHelper = new THREE.OctahedronGeometry(0.1, 0)
      const hitPositionMaterial = new THREE.MeshBasicMaterial({ color: "blue", wireframe: true })
      const hitPositionMesh = new THREE.Mesh(hitPositionHelper, hitPositionMaterial)
      hitPositionMesh.position.copy(hitPosition)
      this.scene.add(hitPositionMesh)
      this.debugFolder
        .add(hitPosition, "x")
        .min(-1)
        .max(1)
        .step(0.01)
        .name("Hit Position X")
        .onChange(() => hitPositionMesh.position.copy(hitPosition))
      this.debugFolder
        .add(hitPosition, "y")
        .min(-1)
        .max(2)
        .step(0.01)
        .name("Hit Position Y")
        .onChange(() => hitPositionMesh.position.copy(hitPosition))
      this.debugFolder
        .add(hitPosition, "z")
        .min(-1)
        .max(1)
        .name("Hit Position Z")
        .onChange(() => hitPositionMesh.position.copy(hitPosition))
      this.debugFolder.add(this.shieldMaterial.uniforms.uCutoffHeight, "value").min(0).max(1).step(0.01)
    }
  }

  update() {
    const elapsedTime = this.clock.getElapsedTime()

    if (this.shield) {
      this.shieldMaterial.uniforms.uTime.value = elapsedTime
    }
  }
}
