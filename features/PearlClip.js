import { sendBlockPlacement } from "../utils/autoRoutesUtils"
import ServerRotations from "../utils/ServerRotations"
import { rightClick, chat, swapToItem, pearl } from "../utils/utils"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
const S29PacketSoundEffect = Java.type("net.minecraft.network.play.server.S29PacketSoundEffect")


let distance = 0
const doClip = register("packetreceived", () => {
    Client.scheduleTask(() => Player.getPlayer().func_70107_b(Math.floor(Player.getX()) + 0.5, Math.floor(Player.getY()) - distance, Math.floor(Player.getZ()) + 0.5))
    doClip.unregister()
}).setFilteredClass(S08PacketPlayerPosLook).unregister()

export function PearlClip(y) {
    if (isNaN(y) || y < -70 || y > 70) return ChatLib.chat(`invalid pearl clip distance`)
    distance = Math.abs(y)
    pearlSound.register();
    swapToItem("ender pearl")
    ServerRotations.setRotation(Player.getYaw(), 90)
    runShit.register();
}

let ticks = 0;

let runShit = register("tick", () => {
    ticks++;
    if (ticks < 8) return;
    rightClick()
    ServerRotations.resetRotation()
    runShit.unregister();
    ticks = 0;
}).unregister()




const pearlSound = register("packetreceived", (packet) => {
    if (packet.func_149212_c() !== "random.bow" || packet.func_149208_g() !== 0.5){
        chat("if it didnt pearlclip then left click or run /simulatesecret");
        return;
    }
    doClip.register()
    pearlSound.unregister();
}).setFilteredClass(S29PacketSoundEffect).unregister()

register("worldunload", () => {
    doClip.unregister()
    pearlSound.unregister();
})
