import Experience from "../Experience.js"
import Environment from "./Environment.js"
import Castle from "./Castle.js"
import Ocean from "./Ocean.js"
import Lightning from "./Lightning.js"
import Crystal from "./Crystal.js"
import BridgeCollapsePhysics from "./BridgeCollapsePhysics.js"

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    // Wait for resources
    this.resources.on("ready", () => {
      // Setup
      this.castle = new Castle()
      this.environment = new Environment()
      this.ocean = new Ocean({ resolution: 512, environmentMap: this.environment.environmentMap })
      this.lightning = new Lightning()
      this.bridgeCollapsePhysics = new BridgeCollapsePhysics()
      this.crystalAnimation = new Crystal()
    })
  }

  update() {
    if (this.castle) this.castle.update()
    if (this.environment) this.environment.update()
    if (this.ocean) this.ocean.update()
    if (this.lightning) this.lightning.update()
    if (this.bridgeCollapsePhysics) this.bridgeCollapsePhysics.update()
  }
}
