import { McUtils } from "./McUtils"

export const C04PacketPlayerPosition = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C04PacketPlayerPosition")
export const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")
export const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
export const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction")
export const C05PacketPlayerLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C05PacketPlayerLook")
export const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")
export const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
export const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")
export const S1BPacketEntityAttach = Java.type("net.minecraft.network.play.server.S1BPacketEntityAttach")
export const S0DPacketCollectItem = Java.type("net.minecraft.network.play.server.S0DPacketCollectItem")
export const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")
export const S29PacketSoundEffect = Java.type("net.minecraft.network.play.server.S29PacketSoundEffect")
export const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")
export const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
export const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
export const S2APacketParticles = Java.type("net.minecraft.network.play.server.S2APacketParticles")
export const C02PacketUseEntity = Java.type("net.minecraft.network.play.client.C02PacketUseEntity")
export const S0FPacketSpawnMob = Java.type("net.minecraft.network.play.server.S0FPacketSpawnMob")
export const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot")
export const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
export const mc = Client.getMinecraft().func_175598_ae()
export const KeyInputEvent = Java.type("net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent")
export const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent")
export const EntityPlayer = Java.type("net.minecraft.entity.player.EntityPlayer")
export const Armor = Java.type("net.minecraft.entity.item.EntityArmorStand")
export const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")
export const Wither = Java.type("net.minecraft.entity.boss.EntityWither")
export const Bat = Java.type("net.minecraft.entity.passive.EntityBat")
export const MCBlock = Java.type("net.minecraft.block.Block")
export let Keyboard = Java.type("org.lwjgl.input.Keyboard")
export const Vec3 = Java.type("net.minecraft.util.Vec3")

const keybinds = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()
];




const defaultColor = "§b"
export function chat(message) {
    if (message !== undefined){
        ChatLib.chat("§0[§cAutism§0] " + defaultColor + message.toString().replaceAll("§r", defaultColor))
    } else {
        ChatLib.chat("message is undefined")
        return;
    }
}

export function jump() {
    Client.scheduleTask(() => { KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true) })
    Client.scheduleTask(2, () => { KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false) })
}

export function setVelocity(x, y, z) {

    Player.getPlayer().func_70016_h(x, y, z);
}

export function unpressAllMovementKeys() {

    keybinds.forEach(keybind => KeyBinding.func_74510_a(keybind, false));
}

export function pressAllPressedMovementKeys() {

    keybinds.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind))); // Press down all keys that are physically pressed
}

export function distanceToPlayer(x, y, z) {
    return Math.sqrt(
        (mc.field_78730_l - x) ** 2 +
        (mc.field_78731_m - y) ** 2 +
        (mc.field_78728_n - z) ** 2
    )
}

let toggled = false
let currDepth = 20

export function lavaclip(distance) {
    if (toggled) {
        toggled = false
        vclip.unregister()
        vclipOverlay.unregister()
        return
    }
    if (isNaN(distance)) {
        chat("please use a number")
        return
    }
    if (distance < 80.1 && distance > 3) {
        currDepth = distance
        toggled = true
        vclip.register()
        vclipOverlay.register()

    } else {
        chat("Distance has to be between 40 and 3")
    }
}

const vclipOverlay = register("renderoverlay", () => {
    if (!toggled) return
    let text = "Autism go brrrr"
    let scale = 1.5
    Renderer.scale(scale)
    Renderer.drawStringWithShadow(text, (Renderer.screen.getWidth() / scale - Renderer.getStringWidth(text)) / 2, Renderer.screen.getHeight() / scale / 2 + 16)
}).unregister()

const vclip = register("tick", () => {
    if (!Player.getPlayer().func_180799_ab()) return
    veloPacket.register()
    Player.getPlayer().func_70107_b(Player.getX(), Player.getY() - currDepth, Player.getZ())
}).unregister();

const veloPacket = register("packetreceived", (packet, event) => {
    if (!toggled) return
    if (Player.getPlayer().func_145782_y() !== packet.func_149412_c()) return;
    chat(packet.func_149410_e())
    if (packet.func_149410_e() !== 28000) return;
    cancel(event)
    veloPacket.unregister()
    vclip.unregister();
    vclipOverlay.unregister()
    toggled = false
}).setFilteredClass(S12PacketEntityVelocity).unregister()

register("command", () => {
    toggled = false
    vclip.unregister()
    vclipOverlay.unregister()
}).setName("noclip")

export function center() {
    Player.asPlayerMP().setPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5)
}


export function getIdOfBlock(x, y, z) {
    return World.getBlockAt(x, y, z).type.getID()
}

export const swapToItem = (targetItemName) => {
    const itemSlot = Player?.getInventory()?.getItems()?.findIndex(item => { return item?.getName()?.toLowerCase()?.includes(targetItemName.toLowerCase()) })
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        return
    } else {
        chat(`set players item to ${targetItemName}`)
        heldItem = Player.getHeldItemIndex() // Does this do anything????????????????????
        Player.setHeldItemIndex(itemSlot)
    }
}

export function leftClick() {
    const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af", null)
    leftClickMethod.setAccessible(true);
    leftClickMethod.invoke(Client.getMinecraft(), null);
}

export function rightClick() {
    const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag", null)
    rightClickMethod.setAccessible(true);
    rightClickMethod.invoke(Client.getMinecraft(), null);
}

export const sendUseEntity = (entity, hitVec=null) => {
    let e = (entity instanceof Entity) ? entity.getEntity() : entity
    let packet = new C02PacketUseEntity(e, C02PacketUseEntity.Action.INTERACT)
    if (hitVec) packet = new C02PacketUseEntity(e, new Vec3(0, 0, 0))
    Client.sendPacket(packet)
}

export const clipForward = (distance) => {
    const radians = Player.getYaw() * Math.PI / 180
    let [newX, newZ] = [Player.getX(), Player.getZ()]

    if (Math.abs(-Math.sin(radians)) > Math.abs(Math.cos(radians))) newX += distance * Math.sign(-Math.sin(radians))
    else newZ += distance * Math.sign(Math.cos(radians))
    Player.getPlayer().func_70107_b(newX, Player.getY(), newZ)
}

export function pearl (amount) {
    swapToItem("Ender Pearl")
    for (let i = 0; i < amount; i++){
        Client.scheduleTask(1, () => {
            McUtils.sendUseItem();
        })
    }
}

export const releaseMovementKeys = () => keybinds.forEach(keybind => KeyBinding.func_74510_a(keybind, false))
export const repressMovementKeys = () => keybinds.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind)))

export function setSneakKey(state) {
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i(), state)
}
