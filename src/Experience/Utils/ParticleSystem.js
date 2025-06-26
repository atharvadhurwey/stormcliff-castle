import * as THREE from "three"
import Experience from "../Experience"

import vertexShader from "../../shaders/particles/vertex.glsl"
import fragmentShader from "../../shaders/particles/fragment.glsl"

class LinearSpline {
  constructor(lerp) {
    this._points = []
    this._lerp = lerp
  }

  AddPoint(t, d) {
    this._points.push([t, d])
  }

  Get(t) {
    let p1 = 0

    for (let i = 0; i < this._points.length; i++) {
      if (this._points[i][0] >= t) {
        break
      }
      p1 = i
    }

    const p2 = Math.min(this._points.length - 1, p1 + 1)

    if (p1 == p2) {
      return this._points[p1][1]
    }

    return this._lerp((t - this._points[p1][0]) / (this._points[p2][0] - this._points[p1][0]), this._points[p1][1], this._points[p2][1])
  }
}

export default class ParticleSystem {
  constructor(options) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.camera = this.experience.camera.instance

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("BurningTreeParticles")
    }

    const uniforms = {
      diffuseTexture: {
        value: this.resources.items.fireTexture,
      },
      pointMultiplier: {
        value: window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0)),
      },
    }

    this._material = new THREE.ShaderMaterial({
      precision: "lowp",

      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    })

    this._particles = []

    this._geometry = new THREE.BufferGeometry()
    this._geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3))
    this._geometry.setAttribute("size", new THREE.Float32BufferAttribute([], 1))
    this._geometry.setAttribute("colour", new THREE.Float32BufferAttribute([], 4))
    this._geometry.setAttribute("angle", new THREE.Float32BufferAttribute([], 1))
    this._geometry.setAttribute("blend", new THREE.Float32BufferAttribute([], 1))

    this._points = new THREE.Points(this._geometry, this._material)

    this.scene.add(this._points)

    // Declare a few splines for different sets of particles. This isn't structured that well, we should
    // instead separate these out into new particle system instances with customizable parameters. But
    // for the purposes of a demo, more than enough.
    this._alphaSplineF = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._alphaSplineF.AddPoint(0.0, 0.0)
    this._alphaSplineF.AddPoint(0.1, 1.0)
    this._alphaSplineF.AddPoint(0.5, 1.0)
    this._alphaSplineF.AddPoint(1.0, 0.0)

    this._colourSplineF = new LinearSpline((t, a, b) => {
      const c = a.clone()
      return c.lerp(b, t)
    })
    this._colourSplineF.AddPoint(0.0, new THREE.Color(0xffff80))
    this._colourSplineF.AddPoint(1.0, new THREE.Color(0xff8080))

    this._sizeSplineF = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._sizeSplineF.AddPoint(0.0, 1.0)
    this._sizeSplineF.AddPoint(0.25, 3.0)
    this._sizeSplineF.AddPoint(0.5, 2.5)
    this._sizeSplineF.AddPoint(1.0, 0.0)

    this._alphaSplineS = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._alphaSplineS.AddPoint(0.0, 0.0)
    this._alphaSplineS.AddPoint(0.1, 1.0)
    this._alphaSplineS.AddPoint(0.5, 1.0)
    this._alphaSplineS.AddPoint(1.0, 0.0)

    this._colourSplineS = new LinearSpline((t, a, b) => {
      const c = a.clone()
      return c.lerp(b, t)
    })
    this._colourSplineS.AddPoint(0.0, new THREE.Color(0x202020))
    this._colourSplineS.AddPoint(1.0, new THREE.Color(0x222222))

    this._sizeSplineS = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._sizeSplineS.AddPoint(0.0, 0.3)
    this._sizeSplineS.AddPoint(0.5, 1.5)
    this._sizeSplineS.AddPoint(1.0, 2.0)

    this._alphaSplineX = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._alphaSplineX.AddPoint(0.0, 0.0)
    this._alphaSplineX.AddPoint(0.1, 1.0)
    this._alphaSplineX.AddPoint(0.9, 1.0)
    this._alphaSplineX.AddPoint(1.0, 0.0)

    this._colourSplineX = new LinearSpline((t, a, b) => {
      const c = a.clone()
      return c.lerp(b, t)
    })
    this._colourSplineX.AddPoint(0.0, new THREE.Color(0xff8080))
    this._colourSplineX.AddPoint(1.0, new THREE.Color(0xffffff))

    this._sizeSplineX = new LinearSpline((t, a, b) => {
      return a + t * (b - a)
    })
    this._sizeSplineX.AddPoint(0.0, 1.0)
    this._sizeSplineX.AddPoint(1.0, 1.0)

    this._rateLimiter = 0.0

    this.particlesObject = {
      radius: 0.01,
      maxLife: 10,
      maxSize: 0.02,
      distanceDifference: 0.05,
    }

    this.position = options.position

    this.rate = 20

    this._emit = true

    this._UpdateGeometry()

    if (this.debug.active) {
      this.debugFolder
        .add(this.particlesObject, "radius")
        .min(0)
        .max(0.05)
        .step(0.001)
        .name("Particle Spread")
        .onChange(() => {
          this._UpdateGeometry()
        })

      this.debugFolder
        .add(this.particlesObject, "maxLife")
        .min(0.0)
        .max(20.0)
        .step(0.1)
        .name("Max Particle Life")
        .onChange(() => {
          this._UpdateGeometry()
        })

      this.debugFolder
        .add(this.particlesObject, "maxSize")
        .min(0.0)
        .max(0.05)
        .step(0.001)
        .name("Max Particle Size")
        .onChange(() => {
          this._UpdateGeometry()
        })

      this.debugFolder
        .add(this.particlesObject, "distanceDifference")
        .min(0.0)
        .max(0.1)
        .step(0.001)
        .name("Distance Difference")
        .onChange(() => {
          this._UpdateGeometry()
        })
    }
  }

  _CreateParticleF() {
    const life = (Math.random() * 0.75 + 0.25) * this.particlesObject.maxLife
    return {
      position: new THREE.Vector3(
        (Math.random() * 2 - 1) * this.particlesObject.radius,
        (Math.random() * 2 - 1) * this.particlesObject.radius,
        (Math.random() * 2 - 1) * this.particlesObject.radius
      ).add(this.position),
      size: (Math.random() * 0.5 + 0.5) * this.particlesObject.maxSize,
      colour: new THREE.Color(),
      alpha: 1.0,
      life: life,
      maxLife: life,
      rotation: Math.random() * 2.0 * Math.PI,
      velocity: new THREE.Vector3(0, 0.01, 0),
      blend: 0.0,
    }
  }

  _CreateParticleX() {
    const life = (Math.random() * 0.75 + 0.25) * (this.particlesObject.maxLife / 4.0)
    const dirX = (Math.random() * 2.0 - 1.0) * this.particlesObject.radius * 0.8
    const dirY = (Math.random() * 2.0 - 1.0) * this.particlesObject.radius * 0.8
    return {
      position: new THREE.Vector3(
        (Math.random() * 2 - 1) * this.particlesObject.radius,
        this.particlesObject.distanceDifference / 5.0 + (Math.random() * 2 - 1) * this.particlesObject.radius,
        (Math.random() * 2 - 1) * this.particlesObject.radius
      ).add(this.position),
      size: (Math.random() * 0.5 + 0.5) * (this.particlesObject.maxSize / 4.0),
      colour: new THREE.Color(),
      alpha: 1.0,
      life: life,
      maxLife: life,
      rotation: Math.random() * 2.0 * Math.PI,
      velocity: new THREE.Vector3(dirX, 0.01, dirY),
      blend: 0.0,
    }
  }

  _CreateParticleS() {
    const life = (Math.random() * 0.75 + 0.25) * (this.particlesObject.maxLife / 2.0)
    return {
      position: new THREE.Vector3(
        (Math.random() * 2 - 1) * this.particlesObject.radius,
        this.particlesObject.distanceDifference + (Math.random() * 2 - 1) * this.particlesObject.radius,
        (Math.random() * 2 - 1) * this.particlesObject.radius
      ).add(this.position),
      size: (Math.random() * 0.5 + 0.5) * this.particlesObject.maxSize,
      colour: new THREE.Color(),
      alpha: 1.0,
      life: life,
      maxLife: life,
      rotation: Math.random() * 2.0 * Math.PI,
      velocity: new THREE.Vector3(0, 0.01, 0),
      blend: 1.0,
    }
  }

  _AddParticles(timeElapsed) {
    if (!this._emit) return

    this._rateLimiter += timeElapsed
    const n = Math.floor(this._rateLimiter * this.rate)
    this._rateLimiter -= n / this.rate

    for (let i = 0; i < n; i++) {
      const p = this._CreateParticleF()
      this._particles.push(p)
    }
    for (let i = 0; i < n; i++) {
      const p = this._CreateParticleS()
      this._particles.push(p)
    }
    for (let i = 0; i < n * 2; i++) {
      const p = this._CreateParticleX()
      this._particles.push(p)
    }
  }

  _UpdateGeometry() {
    const positions = []
    const sizes = []
    const colours = []
    const angles = []
    const blends = []

    const box = new THREE.Box3()
    for (let p of this._particles) {
      positions.push(p.position.x, p.position.y, p.position.z)
      colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha)
      sizes.push(p.currentSize)
      angles.push(p.rotation)
      blends.push(p.blend)

      box.expandByPoint(p.position)
    }

    this._geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    this._geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1))
    this._geometry.setAttribute("colour", new THREE.Float32BufferAttribute(colours, 4))
    this._geometry.setAttribute("angle", new THREE.Float32BufferAttribute(angles, 1))
    this._geometry.setAttribute("blend", new THREE.Float32BufferAttribute(blends, 1))

    this._geometry.attributes.position.needsUpdate = true
    this._geometry.attributes.size.needsUpdate = true
    this._geometry.attributes.colour.needsUpdate = true
    this._geometry.attributes.angle.needsUpdate = true
    this._geometry.attributes.blend.needsUpdate = true

    this._geometry.boundingBox = box
    this._geometry.boundingSphere = new THREE.Sphere()
    box.getBoundingSphere(this._geometry.boundingSphere)
  }

  _UpdateParticles(timeElapsed) {
    for (let p of this._particles) {
      p.life -= timeElapsed
    }

    this._particles = this._particles.filter((p) => {
      return p.life > 0.0
    })

    for (let p of this._particles) {
      const t = 1.0 - p.life / p.maxLife

      p.rotation += timeElapsed * 0.5

      if (p.blend == 0.0) {
        if (p.velocity.x != 0.0) {
          p.alpha = this._alphaSplineX.Get(t)
          p.currentSize = p.size * this._sizeSplineX.Get(t)
          p.colour.copy(this._colourSplineX.Get(t))
        } else {
          p.alpha = this._alphaSplineF.Get(t)
          p.currentSize = p.size * this._sizeSplineF.Get(t)
          p.colour.copy(this._colourSplineF.Get(t))
        }
      } else {
        p.alpha = this._alphaSplineS.Get(t)
        p.currentSize = p.size * this._sizeSplineS.Get(t)
        p.colour.copy(this._colourSplineS.Get(t))
      }

      p.position.add(p.velocity.clone().multiplyScalar(timeElapsed))

      const drag = p.velocity.clone()
      drag.multiplyScalar(timeElapsed * 0.1)
      drag.x = Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x))
      drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y))
      drag.z = Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z))
      p.velocity.sub(drag)
    }

    this._particles.sort((a, b) => {
      const d1 = this.camera.position.distanceTo(a.position)
      const d2 = this.camera.position.distanceTo(b.position)

      if (d1 > d2) {
        return -1
      }

      if (d1 < d2) {
        return 1
      }

      return 0
    })
  }

  Step(timeElapsed) {
    this._AddParticles(timeElapsed)
    this._UpdateParticles(timeElapsed)
    this._UpdateGeometry()
  }
}
