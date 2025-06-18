import Experience from "../Experience.js"
import Environment from "./Environment.js"
import Floor from "./Floor.js"
import Castle from "./Castle.js"
import Ocean from "./Ocean.js"

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    // Wait for resources
    this.resources.on("ready", () => {
      // Setup
      this.floor = new Floor()
      this.castle = new Castle()
      this.environment = new Environment()
      this.ocean = new Ocean({ resolution: 512, environmentMap: this.environment.environmentMap })
    })
  }

  update() {
    if (this.castle) this.castle.update()
    if (this.environment) this.environment.update()
    if (this.ocean) this.ocean.update()
  }
}
