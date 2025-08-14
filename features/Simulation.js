import Settings from "../config"
import { getEtherwarpBlock } from "../../BloomCore/utils/Utils"
import { chat, C08PacketPlayerBlockPlacement } from "../utils/utils"

const inSingleplayer = () => Client.getMinecraft().func_71356_B()
const holdingAOTV = () => {
    const heldItem = Player.getHeldItem()?.getName()
    return heldItem && (heldItem.includes("Diamond Shovel") || heldItem.includes("Aspect of the Void"))
}

let yVelo = 3.5
const ping = 180

register("command", (Velocity) => {
    yVelo = parseFloat(Velocity)
}).setName("velo")

const simulation = register("tick", () => {
    // const denmark = Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111126_e()
    // if (denmark) ChatLib.chat(denmark)
    if (Server.getIP() !== "localhost") return
    if (Settings().simulateSpeed) {
        Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111128_a(0.50000000745)
        Player.getPlayer().field_71075_bZ.func_82877_b(0.50000000745) // Make hclip work correctly
    }

    // Lava bounce
    if (Settings().simulateLavaBounce) {
        if (Player.getPlayer().func_180799_ab() || World.getBlockAt(Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())).type.getRegistryName().includes("rail","carpet") && Player.getY() - Math.floor(Player.getY()) < 0.1) {
            simulation.unregister()

            Client.scheduleTask(ping / 50,() => {
                Player.getPlayer().func_70016_h(Player.getPlayer().field_70159_w, yVelo, Player.getPlayer().field_70179_y)
            })
            Client.scheduleTask((ping + 100) / 50,() => {
                simulation.register()
            })

        }
    }
});

register("packetsent", (packet) => {
    if (!Settings().singleplayerEtherwarp || !inSingleplayer() || !holdingAOTV() || !Player.isSneaking()) return

    const dir = packet.func_149568_f()
    if (dir !== 255) return

    const target = getEtherwarpBlock()
    if (!target) return
    const [x, y, z] = target

    World.playSound("mob.enderdragon.hit", 1, 0.5396825671195984)

    Client.scheduleTask(0, () => {
        Player.getPlayer().func_70107_b(x+0.5, y+1.05, z+0.5)
        Player.getPlayer().func_70016_h(0, 0, 0);
    })
}).setFilteredClass(C08PacketPlayerBlockPlacement)
