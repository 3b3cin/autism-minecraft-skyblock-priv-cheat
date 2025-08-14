import { getEtherwarpBlock, getLastSentLook, getSkyblockItemID } from "../../BloomCore/utils/Utils"
import Settings from "../config";
import { chat } from "../utils/utils";

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

const recentFails = [] // Timestamps of the most recent failed teleports
const recentlySentC06s = [] // [{pitch, yaw, x, y, z, sentAt}, ...] in the order the packets were sent
let isSneaking = false

register("packetsent", (packet) => {
    const action = packet.func_180764_b()

    if (action == C0BPacketEntityAction.Action.START_SNEAKING) {
        isSneaking = true
    }
    else if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) {
        isSneaking = false
    }
}).setFilteredClass(C0BPacketEntityAction)

register("worldunload", () => {
    isSneaking = false
})

register("worldload", () => {
    isSneaking = false
})


const validEtherwarpItems = new Set([
    "ASPECT_OF_THE_END",
    "ASPECT_OF_THE_VOID",
    "ETHERWARP_CONDUIT",
])

const isHoldingEtherwarpItem = () => {
    const held = Player.getHeldItem()
    const sbId = getSkyblockItemID(held)

    if (!validEtherwarpItems.has(sbId)) return false

    // Etherwarp conduit doesn't have the ethermerge NBT tag, the ability is there by default
    return held.getNBT()?.toObject()?.tag?.ExtraAttributes?.ethermerge == 1 || sbId == "ETHERWARP_CONDUIT"
}

const getTunerBonusDistance = () => {
    return Player.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0
}

let enoughMana = true;
let enoughSoulflow = true;

let manaNumber = 0;
let maxManaNumber = 0;

register("actionbar", (mana, maxMana) => {
    let manaNumber = parseFloat(mana.replace(/,/g, '').trim());
    let maxManaNumber = parseFloat(maxMana.replace(/,/g, '').trim());
    if (manaNumber < maxManaNumber * 0.1) {
        enoughMana = false;
    } else {
        enoughMana = true;
    }
}).setCriteria("${*} ${mana}/${maxMana}✎${*}")



register("chat", () => enoughSoulflow = false).setCriteria("Not enough soulflow!")
register("chat", () => enoughSoulflow = false).setCriteria("nOt EnOuGh SoUlFlOw!")
register("worldload", () => enoughSoulflow = true)

const doZeroPingEtherwarp = () => {

    if (!enoughMana ||!enoughSoulflow) return;
    const rt = getEtherwarpBlock(true, 57 + getTunerBonusDistance() - 1)
    if (!rt) return

    let [pitch, yaw] = getLastSentLook()
    yaw %= 360
    if (yaw < 0) yaw += 360

    let [x, y, z] = rt

    x += 0.5
    y += 1.05
    z += 0.5

    recentlySentC06s.push({ pitch, yaw, x, y, z, sentAt: Date.now() })

    Client.scheduleTask(0, () => {

        Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, Player.asPlayerMP().isOnGround()))
        Player.getPlayer().func_70107_b(x, y, z)
        Player.getPlayer().func_70016_h(0, 0, 0)

    })
}

// Don't teleport when looking at these blocks
const blacklistedIds = [
    54,  // Chest
    146, // Trapped Chest
]

// Detect when the player is trying to etherwarp
register("packetsent", (packet) => {
    if (!Settings().zeropingetherwarp) return

    // Dir = 255 means no block was clicked
    const dir = packet.func_149568_f()
    if (dir !== 255) return

    const held = Player.getHeldItem()
    const item = getSkyblockItemID(held)
    const blockID = Player.lookingAt()?.getType()?.getID()
    if (!isHoldingEtherwarpItem() || !getLastSentLook() || !isSneaking && item !== "ETHERWARP_CONDUIT" || blacklistedIds.includes(blockID)) return

    doZeroPingEtherwarp()
}).setFilteredClass(C08PacketPlayerBlockPlacement)

// For whatever rounding errors etc occur
const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4

// Listening for server teleport packets
register("packetreceived", (packet, event) => {
    if (!Settings().zeropingetherwarp || !recentlySentC06s.length) return

    const { pitch, yaw, x, y, z, sentAt } = recentlySentC06s.shift()

    const newPitch = packet.func_148930_g()
    const newYaw = packet.func_148931_f()
    const newX = packet.func_148932_c()
    const newY = packet.func_148928_d()
    const newZ = packet.func_148933_e()

    // All of the values of this S08 packet must match up to the last C06 packet which was sent when you teleported.
    const lastPresetPacketComparison = {
        pitch: isWithinTolerence(pitch, newPitch) || newPitch == 0,
        yaw: isWithinTolerence(yaw, newYaw) || newYaw == 0,
        x: x == newX,
        y: y == newY,
        z: z == newZ
    }

    const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a == true)

    // The etherwarp was predicted correctly, cancel the packet since we've already sent the response back when we tried to teleport
    if (wasPredictionCorrect) return cancel(event)

    // The etherwarp was not predicted correctly
    recentFails.push(Date.now())

    // Discard the rest of the queued teleports to check since one earlier in the chain failed
    while (recentlySentC06s.length) recentlySentC06s.shift()

}).setFilteredClass(S08PacketPlayerPosLook)
