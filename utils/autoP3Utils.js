import { S08PacketPlayerPosLook } from "../../BloomCore/utils/Utils";
import RenderLibV2 from "../../RenderLibV2"
import { chat, setVelocity, unpressAllMovementKeys, pressAllPressedMovementKeys } from "../utils/utils"
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");


function jump() {
    Client.scheduleTask(() => { KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true) })
    Client.scheduleTask(2, () => { KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false) })
}

export function stop() {
    movePlayer.unregister(); // stops walk
    move.unregister();
    ticksMidAir = 0;
    Player.getPlayer().field_70159_w = 0
    Player.getPlayer().field_70179_y = 0
    Client.scheduleTask(() => { KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), false) })
}

export function hclip(direction) {
    stop();
    const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806
    if (Player.asPlayerMP().isOnGround()) {
        jump()
    }
    Client.scheduleTask(0, () => {
        unpressAllMovementKeys()
        setVelocity(0, Player.getPlayer().field_70181_x, 0)
    })
    Client.scheduleTask(1, () => {
        Player.getPlayer().field_70159_w = -Math.sin((direction) * Math.PI / 180) * speed
        Player.getPlayer().field_70179_y = Math.cos((direction) * Math.PI / 180) * speed
        pressAllPressedMovementKeys()
    })
}

export function rotateCharacter(yaw, pitch) {
    wPressed = false;
    const player = Player.getPlayer();

    player.field_70177_z = yaw;
    player.field_70125_A = pitch;
}

let walkYaw;

export function walk(direction, pitch) {
    movePlayer.unregister();
    move.unregister();
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

    const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806;
    const drag = 0.91
    if (Player.asPlayerMP().isOnGround()){
        Player.getPlayer().field_70159_w = speed * -Math.sin((walkYaw) * Math.PI / 180); // X velocity
        Player.getPlayer().field_70179_y = speed * Math.cos((walkYaw) * Math.PI / 180); // Z velocity
    } else {
        Player.getPlayer().field_70159_w *= drag;
        Player.getPlayer().field_70179_y *= drag;

        Player.getPlayer().field_70159_w *= 1.13
        Player.getPlayer().field_70179_y *= 1.13;
    }


}).unregister();


let motionYaw;

export function motion(direction, pitch) {
    movePlayer.unregister();
    move.unregister();
    motionYaw = direction;
    Client.scheduleTask(0, () => {
        unpressAllMovementKeys();
        move.register();
    });
}

let ticksMidAir = 0;

const move = register("tick", () => {
    const wKeyBind = Client.getKeyBindFromKey(Keyboard.KEY_W, "My W Key");
    if (wKeyBind.isPressed()){
        ticksMidAir = 0;
        move.unregister();
        return;
    }
    const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806;

    if (!Player.asPlayerMP().isOnGround()) {
        ticksMidAir++
    }

    if (Player.asPlayerMP().isOnGround() || ticksMidAir < 2){
        setVelocity(-Math.sin((motionYaw) * Math.PI / 180) * speed, Player.getPlayer().field_70181_x, Math.cos((motionYaw) * Math.PI / 180) * speed)
        return;
    } else {

        const drag = 0.925

        Player.getPlayer().field_70159_w *= drag;
        Player.getPlayer().field_70179_y *= drag;

        Player.getPlayer().field_70159_w *= 1.1;
        Player.getPlayer().field_70179_y *= 1.1;

    }




}).unregister();








const ringColors = new Map([
    ["walk", "#32CD32"],     // Green
    ["jump", "#FF1493"],     // Deep Pink
    ["stop", "#FF0000"],     // Red
    ["boom", "#000FFF"],     // Cyan
    ["hclip", "#8A2BE2"],    // Blue Violet
    ["bonzo", "#FFFFFF"],    // White
    ["look", "#00FFFF"],     // Cyan
    ["cmd", "#FFFF00"],      // Yellow
    ["vclip", "#FFFF00"],    // Yellow
    ["edge", "#FF00FF"],     // Magenta
    ["awaitterm", "#0000FF"], // Blue
    ["blink", "#D580C0"], // pink ish
    ["motion", "#D580C0"], // pink ish
    ["rotate", "#FF00FF"], // Magenta
    ["blink", "#FFFFFF"], // White
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

export function renderRings(x, y, z, w, type) {
    const hexColor = ringColors.get(type);
    const [r, g, b] = hexToRgb(hexColor);  // Convert hex to RGB

    RenderLibV2.drawCyl(x, y, z, w / 2, w / 2, -0.01, 120, 1, 90, 0, 0, r, g, b, 1, false, true);
}

export function renderBoxes(x, y, z, h, w, type) {
    const hexColor = ringColors.get(type);
    const [r, g, b] = hexToRgb(hexColor);  // Convert hex to RGB

    for (let i = 0; i < h + 0.1; i += 0.5) {
        RenderLibV2.drawEspBoxV2(x, y + i + 0.01, z, w, 0, w, r, g, b, 1, false);
    }
}
