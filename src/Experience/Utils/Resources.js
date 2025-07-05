import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import EventEmitter from "./EventEmitter.js"
import Experience from "../Experience.js"
import { DRACOLoader } from "three/examples/jsm/Addons.js"

export default class Resources extends EventEmitter {
  constructor(sources) {
    super()

    this.experience = new Experience()
    this.renderer = this.experience.renderer.instance
    this.sources = sources

    this.items = {}
    this.toLoad = this.sources.length
    this.loaded = 0

    this.setLoaders()
    this.startLoading()
  }

  setLoaders() {
    this.loaders = {}
    this.loaders.dracoLoader = new DRACOLoader()
    this.loaders.dracoLoader.setDecoderPath("/draco/")
    this.loaders.gltfLoader = new GLTFLoader()
    this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)
    this.loaders.textureLoader = new THREE.TextureLoader()
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file)
        })
      } else if (source.type === "texture") {
        this.loaders.textureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file)
        })
      } else if (source.type === "cubeTexture") {
        this.loaders.cubeTextureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file)
        })
      }
    }
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file

    this.renderer.initTexture(this.items[source.name])

    this.loaded++

    if (this.loaded === this.toLoad) {
      this.trigger("ready")
    }
  }

  finishLoading() {
    const loadingScreen = document.getElementById("loadingScreen")
    const loader = document.getElementById("loader")
    const credits = document.getElementById("credits")

    // Create message element
    const messageText = document.createElement("div")
    messageText.innerText = "Double-click to unleash the storm"
    messageText.style.position = "absolute"
    messageText.style.top = "50%"
    messageText.style.left = "50%"
    messageText.style.transform = "translate(-50%, -50%)"
    messageText.style.color = "white"
    messageText.style.fontSize = "24px"
    messageText.style.fontFamily = "Arial, sans-serif"
    messageText.style.zIndex = "1001"
    messageText.style.textAlign = "center"
    messageText.style.pointerEvents = "none" // Allows click-through
    messageText.style.transition = "opacity 0.5s"
    messageText.style.userSelect = "none" // Prevents text selection
    loadingScreen.appendChild(messageText)

    loader.style.display = "none"
    loadingScreen.style.transition = "opacity 0.5s"
    loadingScreen.style.opacity = "0.7"

    const finalMessages = ["That crystal hums with energy—maybe don’t mess with it.", "Careful with the bridge—it’s not built for storms.", "Just... maybe leave the tree alone."]

    function onDoubleClick() {
      // Fade out first message
      messageText.style.opacity = "0"

      setTimeout(() => {
        // Change to a random message
        messageText.innerText = finalMessages[Math.floor(Math.random() * finalMessages.length)]
        messageText.style.opacity = "1"

        // Automatically fade out after 3 seconds
        setTimeout(() => {
          messageText.style.opacity = "0"

          // Hide loading screen after message fades
          setTimeout(() => {
            loadingScreen.style.display = "none"
            credits.style.display = "block"
          }, 500) // wait for fade-out transition
        }, 2000) // show message for 2s
      }, 600) // wait for first message fade-out

      document.removeEventListener("dblclick", onDoubleClick)
    }

    document.addEventListener("dblclick", onDoubleClick)
  }
}
