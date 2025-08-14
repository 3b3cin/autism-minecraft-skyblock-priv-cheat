import RenderLibV2 from "../../RenderLibV2";
import { chat, rightClick, swapToItem, setSneakKey, C0BPacketEntityAction, KeyBinding, C08PacketPlayerBlockPlacement, setVelocity } from "./utils";
import { RoomUtils } from "./RoomUtils";
const ringColors = new Map([
    ["walk", "#32CD32"],     // Green
    ["jump", "#FF1493"],     // Deep Pink
    ["stop", "#FF0000"],     // Red
    ["boom", "#000FFF"],     // Cyan
    ["cmd", "#FFFF00"],      // Yellow
    ["rotate", "#FF00FF"], // Magenta
    ["etherwarp", "#FF1493"], // Deep Pink
    ["pearl", "#FF1493"], // Deep Pink
    ["pearlclip", "#FF1493"], // Deep Pink
    ["use", "#FF1493"], // Deep Pink
    ["start", "#FF1493"], // Deep pink
    ["none", "#FFFFFF"]
]);

export function hexToRgb(hex) {
    // Remove the "#" if it exists
    if (hex.charAt(0) === '#') {
        hex = hex.substring(1);
    }

    // Handle shorthand hex (like #fff -> #ffffff)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Ensure we have a valid hex format (6 characters)
    if (hex.length !== 6) {
        console.log(`Invalid hex color: ${hex}`);
        return [255, 255, 255]; // Return white if the hex is invalid
    }

    // Parse the hex values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return [r/255, g/255, b/255];
}

export function renderRings(relativeX, relativeY, relativeZ, w, type) {
    const hexColor = ringColors.get(type);
    const color = hexToRgb(hexColor);  // Convert hex to RGB
    const color2 = hexToRgb("#FF00FF");
    const [x, y, z] = RoomUtils.getRealCoords(relativeX, relativeY, relativeZ);
    const size = 0.71; // Cube size
    if (type == "start"){
        RenderLibV2.drawInnerEspBoxV2(x, y-1, z, 1, 1, 1, color2[0], color2[1], color2[2], 1, true)
        RenderLibV2.drawEspBoxV2(x, y-1, z, 1, 1, 1, color[0], color[1], color[2], 1, true, 2)
        return;
    }
    RenderLibV2.drawCyl(x, y, z, 0.71, 0.71, 0, 4, 1, -90,45,0, color[0], color[1], color[2], 1, false, true);

}

export function stop() {
    movePlayer.unregister();
    Player.getPlayer().field_70159_w = 0
    Player.getPlayer().field_70179_y = 0
}

let walkYaw;

export function walk(relativeYaw, pitch) {
    let direction = RoomUtils.getRealYaw(relativeYaw);
    walkYaw = direction;
    listenToGround.register();
}

const listenToGround = register("tick", () => {
    if (!Player.asPlayerMP().isOnGround()){
        return;
    }
    listenToGround.unregister();
    movePlayer.register();
}).unregister()

const movePlayer = register("tick", () => {
    const wKeyBind = Client.getKeyBindFromKey(Keyboard.KEY_W, "My W Key");
    if (wKeyBind.isPressed()){
        movePlayer.unregister()
        return;
    }



    let speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806;

    if (isStandingOnSlime()){
        speed = speed * 0.3;
    }

    const drag = 0.925

    if (Player.asPlayerMP().isOnGround()){
        setVelocity(-Math.sin((walkYaw) * Math.PI / 180) * speed, Player.getPlayer().field_70181_x, Math.cos((walkYaw) * Math.PI / 180) * speed)
    } else {
        Player.getPlayer().field_70159_w *= drag;
        Player.getPlayer().field_70179_y *= drag;

        Player.getPlayer().field_70159_w *= 1.13
        Player.getPlayer().field_70179_y *= 1.13;
    }


}).unregister();

function isStandingOnSlime() {
    let x = Math.floor(Player.getX());
    let y = Math.floor(Player.getY()) - 1; // Get block below the player
    let z = Math.floor(Player.getZ());

    let block = World.getBlockAt(x, y, z);


    return block.type.name === "Slime Block";
}

let ticks = 0;

register("tick", () => {
    ticks++;
})

export function etherwarp(yaw, pitch, awaitSecretAction) {
    stop();
    rotateCharacter(yaw, pitch);
    setSneakKey(false)
    if (awaitSecretAction){
        Client.scheduleTask(1, () => {
            swapToItem("aspect of the void")
            ether();
        })
    } else {
        swapToItem("aspect of the void")
        ether();
    }


}

let etherwarp = false
register("packetsent", packet => {
    const action = packet.func_180764_b()
    if (action == C0BPacketEntityAction.Action.START_SNEAKING) etherwarp = true
    if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) etherwarp = false
}).setFilteredClass(C0BPacketEntityAction)

const sneak = register("renderWorld", () => {
    if (!Player.isSneaking()) setSneakKey(true)
    if (!etherwarp) return
    rightClick();
    setSneakKey(false)
    sneak.unregister()
}).unregister()

function ether() {
    sneak.register()
    setSneakKey(true)
}

export const sendBlockPlacement = () => Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem().getItemStack()))

export function setSneakKey(state) {
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i(), state)
}

export function rotateCharacter(relativeYaw, pitch){
    let yaw = RoomUtils.getRealYaw(relativeYaw);
    const player = Player.getPlayer();

    player.field_70177_z = yaw;
    player.field_70125_A = pitch;
}

const mc = Client.getMinecraft().func_175598_ae()

export function distanceToPlayerRelative(relativeX, relativeY, relativeZ) {
    let [x, y, z] = RoomUtils.getRealCoords(relativeX, relativeY, relativeZ)
    return Math.sqrt(
        (mc.field_78730_l - x) ** 2 +
        (mc.field_78731_m - y) ** 2 +
        (mc.field_78728_n - z) ** 2
    )
}
