import * as THREE from "three"
import Experience from "../Experience.js"
import Ammo from "../Utils/ammo.js"

export default class BridgeCollapsePhysics {
  constructor() {
    this.experience = new Experience()
    this.debug = this.experience.debug
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.castle = this.experience.world.castle

    this.physicsEnabled = false
    this.margin = 0.0

    this.rigidBodies = []
    this.bridgeChunks = this.experience.world.castle.bridgeChunks

    Ammo().then((AmmoLib) => {
      this.ammo = AmmoLib
      this.initPhysics()
      this.initPassive()
      this.initBridgeChunks()
    })
  }

  initPhysics() {
    const gravityConstant = 7.8
    const Ammo = this.ammo
    const config = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(config)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, config)
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0))

    this.transformAux1 = new Ammo.btTransform()
    this.tempBtVec3_1 = new Ammo.btVector3(0, 0, 0)
  }

  initBridgeChunks() {
    this.bridgeChunks.forEach((chunk) => {
      chunk.userData.physicsShape = this.createConvexHullPhysicsShape(chunk.geometry.attributes.position.array)
    })
  }

  breakBridge(lightningPos, lightningDir = new THREE.Vector3(0, -1, 0)) {
    this.bridgeChunks.forEach((chunk) => {
      chunk.visible = true

      const mass = 2000000
      const shape = chunk.userData.physicsShape
      shape.setMargin(this.margin)

      const chunkWorldPos = new THREE.Vector3()
      chunk.getWorldPosition(chunkWorldPos)

      const direction = new THREE.Vector3().subVectors(chunkWorldPos, lightningPos).normalize()
      direction.add(lightningDir.clone().multiplyScalar(0.5)).normalize()

      chunk.userData.velocity = direction.multiplyScalar(1)
      chunk.userData.angularVelocity = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3)

      this.createDebrisFromBreakableObject(chunk, shape, mass)
    })
  }

  initPassive() {
    this.castle.cliffPhysicsMeshes.forEach((cliff) => {
      const box = new THREE.Box3().setFromObject(cliff)
      const size = new THREE.Vector3()
      box.getSize(size)
      const center = new THREE.Vector3()
      box.getCenter(center)

      const shape = new this.ammo.btBoxShape(new this.ammo.btVector3(size.x / 2, size.y / 2, size.z / 2))
      this.createRigidBody(cliff, shape, 0, center, new THREE.Quaternion())
    })
  }

  createDebrisFromBreakableObject(object, shape, mass) {
    const body = this.createRigidBody(object, shape, mass, object.position, object.quaternion, object.userData.velocity, object.userData.angularVelocity)

    const btVecUserData = new this.ammo.btVector3(0, 0, 0)
    btVecUserData.threeObject = object
    body.setUserPointer(btVecUserData)
  }

  createConvexHullPhysicsShape(coords) {
    const shape = new this.ammo.btConvexHullShape()
    for (let i = 0; i < coords.length; i += 3) {
      this.tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2])
      shape.addPoint(this.tempBtVec3_1, i >= coords.length - 3)
    }
    return shape
  }

  createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
    const Ammo = this.ammo
    object.position.copy(pos || object.position)
    object.quaternion.copy(quat || object.quaternion)

    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(object.position.x, object.position.y, object.position.z))
    transform.setRotation(new Ammo.btQuaternion(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w))

    const motionState = new Ammo.btDefaultMotionState(transform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    physicsShape.calculateLocalInertia(mass, localInertia)

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    const body = new Ammo.btRigidBody(rbInfo)
    body.setFriction(0.5)

    if (vel) body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z))
    if (angVel) body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z))

    object.userData.physicsBody = body
    object.userData.collided = false

    this.scene.add(object)
    if (mass > 0) {
      this.rigidBodies.push(object)
      body.setActivationState(4) // Disable deactivation
    } else {
      body.setFriction(0.1)
    }

    this.physicsWorld.addRigidBody(body)
    return body
  }

  update() {
    if (!this.physicsWorld || !this.physicsEnabled) return
    const delta = this.experience.time.delta * 0.0001

    this.physicsWorld.stepSimulation(delta, 10)

    for (let obj of this.rigidBodies) {
      const ms = obj.userData.physicsBody.getMotionState()
      if (ms) {
        ms.getWorldTransform(this.transformAux1)
        const p = this.transformAux1.getOrigin()
        const q = this.transformAux1.getRotation()
        obj.position.set(p.x(), p.y(), p.z())
        obj.quaternion.set(q.x(), q.y(), q.z(), q.w())
      }
    }
  }
}
