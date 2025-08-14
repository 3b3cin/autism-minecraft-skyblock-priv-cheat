import { chat, releaseMovementKeys, repressMovementKeys, clipForward } from "../utils/utils"
import keybinds from "../utils/keybinds"

let lastUse = Date.now()

keybinds.onKeyPress("blockClipKeybind", () => {
    if (!Player.getPlayer().field_70124_G) return
    lastUse = Date.now()

    releaseMovementKeys()
    clipForward(0.062)
    Client.scheduleTask(0, () => {
        clipForward(1.4756)
        repressMovementKeys()
        chat("Clipped.")
    })
})
