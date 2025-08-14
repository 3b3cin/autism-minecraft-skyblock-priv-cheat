import Settings from "../config";
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import { renderRings, etherwarp, distanceToPlayerRelative, stop, rotateCharacter, walk, setSneakKey } from "../utils/autoRoutesUtils";
import { chat, distanceToPlayer, jump, swapToItem, leftClick, rightClick, pearl } from "../utils/utils"
import { RoomUtils } from "../utils/RoomUtils";
import { PearlClip } from "./PearlClip";
import { KeyBindingUtils } from "../utils/KeyBindingUtils";
import { McUtils } from "../utils/McUtils";
import { ItemUtils } from "../utils/ItemUtils";
import { sendBlockPlacement } from "../utils/autoRoutesUtils";

register("command", () => {
    chat(RoomUtils.getCurrentRoomName());
}).setName("room")


let rings = [];

const mc = Client.getMinecraft().func_175598_ae()

let module = "AutismClient"
let path = "data/rings/AutoRouteRings.json"

let inClear = true;

let cooldown = false;


register("chat", () => {
    inClear = false;
    secretListener.unregister();
    batSecretListener.unregister();
    itemSecretListener.unregister();
    triggeredRings.clear();
}).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!")

loadAutoRoutes();

function saveAutoRoutes() {
    try {
        FileLib.write(module, path, JSON.stringify(rings, null, 4))
    } catch (error) {
        chat("AutoRoutes failed to save")
    }
}

function loadAutoRoutes() {
    try {
        const data = FileLib.read(module, path)
        if (!data) return
        rings = JSON.parse(data)
    } catch (error) {
        chat("AutoRoutes failed to load")
    }
}



register ("command", (...args) => {
if (!args) { chat("/ar [add, stop, start, edit, remove, clear, undo, save]!"); return }
    switch(args[0]){
        case "add":
            let [room, type, active, awaitSecret, attack, awaitbat, center, id, delay] = [RoomUtils.getCurrentRoomName(), args[1].toLowerCase(), true, false, false, false ,false, Date.now(), 0]
            if (!["walk","etherwarp","pearl", "pearlclip", "boom","use","rotate", "jump", "stop", "start"].includes(type)){
                chat("not valid type");
                return;
            }

            const [x, y, z] = RoomUtils.getRelativeCoords(Math.floor(mc.field_78730_l) + 0.5, Math.floor(mc.field_78731_m), Math.floor(mc.field_78728_n) + 0.5);

            const yaw = RoomUtils.getRelativeYaw(Player.getPlayer().field_70177_z);
            const pitch = Player.getPlayer().field_70125_A;

            if (args.includes("awaitsecret")){
                awaitSecret = true;
            }
            if (args.includes("center")){
                center = true;
            }

            if (args.includes("awaitbat")){
                awaitbat = true;
            }

            if (args.includes("attack")){
                attack = true;
            }



            chat(`Room: ${room}, Type: ${type}, awaitSecret: ${awaitSecret}, attack: ${attack}, awaitBat: ${awaitbat}, center: ${center}, id: ${id}`)
            let toPush = {room, type, active, x, y, z,yaw, pitch, awaitSecret, attack, awaitbat, center, id, delay}
            if (type == "pearlclip"){
                let distance = args[2];
                toPush.distance = isNaN(distance) ? 1 : distance;
                chat(`${distance}`)
            }
            if (type == "pearl") {
                let amount = args[2];
                toPush.amount = isNaN(amount) ? 1 : amount;
                chat(`amount: ${amount}`)
            }
            if (type == "use") {
                let endIndex = args.length;
                if (args.includes("delay")){
                    endIndex = args.includes("delay") ? args.indexOf("awaitbat") : args.length;
                }
                if (args.includes("awaitbat")){
                    endIndex = args.includes("awaitbat") ? args.indexOf("awaitbat") : args.length;
                }
                let use = args.slice(2, endIndex).join(" ");

                toPush.useItem = use;
                chat(`using: ${use}`)
            }

            if (args.includes("delay")){
                const index = args.indexOf("delay");
                delay = parseInt(args[index + 1]);
                toPush.delay = delay;
                if (!isNaN(delay)) {
                    console.log(`Delay is: ${delay}`);
                } else {
                    console.log("No valid number found after 'delay'");
                }
            }

            if (type == "start"){
                toPush = {room, type, x, y, z, id}
            }
            cooldown = true
            Client.scheduleTask(19, () => { cooldown = false })
            rings.push(toPush)
            saveAutoRoutes();
            chat(`${type} placed!`)
            break
        case "start":
            loadAutoRoutes();
            inClear = true;
            secretListener.unregister();
            batSecretListener.unregister();
            itemSecretListener.unregister();
            chat(`AutoRoutes Started!`)
            triggeredRings.clear();
            executedRings = 0;
            break
        case "stop":
            saveAutoRoutes();
            inClear = false;
            chat(`AutoRoutes Stopped`)
            secretListener.unregister();
            batSecretListener.unregister();
            itemSecretListener.unregister();
            triggeredRings.clear();
            executedRings = 0;
            break
        case "edit":
            if (!Settings().editModeAutoRoutes) { Settings().getConfig().setConfigValue("Dungeons", "editModeAutoRoutes", true); chat("Editmode on!") }
            else { Settings().getConfig().setConfigValue("Dungeons", "editModeAutoRoutes", false); chat("Editmode off!") }
            break
        case "remove":
            if (args.length === 2) {
                const typeToRemove = args[1];

                // Filter out rings with the specified type
                const originalLength = rings.length;
                rings = rings.filter(ring => ring.room.toLowerCase() !== typeToRemove.toLowerCase());

                chat(`Removed ${originalLength - rings.length} rings of type '${typeToRemove}'.`);
            } else {
                rings = rings.filter(ring => {
                    let range = 2
                    let distance = distanceToPlayerRelative(ring.x, ring.y, ring.z)
                    return distance >= range;
                })
            }
            saveAutoRoutes();
            executedRing = [];
            break
        case "clear":
            rings = [];
            saveAutoRoutes();
            chat("Rings cleared!")
            break
        case "undo":
            rings.pop();
            saveAutoRoutes();
            chat("Ring undone!")
            break
        case "save":
            saveAutoRoutes();
            chat("Rings saved!")
            break
    }
}).setName("ar");

let ticks = 0;

register("tick",() => {
    ticks++;
})




let executedRing = [];

let centered = false;

let lastRing =  [];

let triggeredRings = new Set();

let executedRings = 0;

register("command", () => {
    triggeredRings.clear();
}).setName("clearTriggered")








register("tick", () => {
    if (!Settings().autoroutes || !inClear || Settings().editModeAutoRoutes) return;
    const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()]

    rings.forEach(ring => {
        if (ring.room != RoomUtils.getCurrentRoomName()) return;
        if (Client.isInGui()) return;
        if (ring.type == "start") return;
        let [ringX, ringY, ringZ] = RoomUtils.getRealCoords(ring.x, ring.y, ring.z);
        const xzRadius =  0.5
        const yRadius = 0.5;
        const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
        const yDistance = Math.abs(py - ringY)
        const inNode = xzDistance <= xzRadius && yDistance <= yRadius
        if ((inNode && !triggeredRings.has(ring.id))) {
            executedRing = ring;
            // Player is inside the ring
            triggeredRings.add(ring.id);



            if ((ring.type == "etherwarp" || ring.type == "pearlclip") && !Player.asPlayerMP().isOnGround){
                return;
            }

            if (ring.center){
                stop();
                center();
                Client.scheduleTask(() => {
                    DoRing(ring.type, ring.yaw, ring.pitch, ring.distance, ring.useItem, rings.delay);
                })
            }
            else if (ring.awaitbat){
                batListener.register();
                return;
            }
            else if (ring.awaitSecret){
                if (ring.type == "etherwarp"){
                    rotateCharacter(ring.yaw, ring.pitch)
                    setSneakKey(true);
                }
                if (ring.type == "pearl"){
                    swapToItem("Ender Pearl");
                    rotateCharacter(ring.yaw, ring.pitch);
                }
                secretListener.register();
                batSecretListener.register();
                itemSecretListener.register();
                return;
            } else {
                DoRing(ring.type, ring.yaw, ring.pitch, ring.distance, ring.useItem, false, ring.delay);
                return;
            }
        } else if (!inNode && triggeredRings.has(ring.id)){
            triggeredRings.delete(ring.id);
        }
    })
})

let batListener = register("tick", () => {
    let entities = World.getAllEntities();
    entities.forEach(entity => {

        if (entity.getName() != "Bat") return;
        const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()]
        const [batx, baty, batz] = [entity.getX(), entity.getY(), entity.getZ()];

        if (((batx - px) > 5 ) && ((baty - py) > 5 ) && ((batz - pz) > 5 )) return;

        Client.scheduleTask(() => {
            DoRing(executedRing.type, executedRing.yaw, executedRing.pitch, executedRing.distance, executedRing.useItem);
        })
        batListener.unregister();
    })
}).unregister();




const blyat = register("tick", () => {
    const [px, py, pz] = [Math.abs(Player.getX()), Math.abs(Player.getY()), Math.abs(Player.getZ())]



    // Get the decimal part

    // Check if the decimal part is either 0.0 or 0.5
    if (isCentered(px) && isCentered(py) && isCentered(pz)) {
        centered = true;
        blyat.unregister(); // Unregister after meeting the condition
    }
}).unregister();

function isCentered(num) {
    const numStr = num.toString();
    const decimalPart = numStr.split('.');
    if (decimalPart.length > 1){
        return true;;
    }
    if (decimalPart === null || decimalPart === "0" || decimalPart === "5"){
        return true;
    }
    return false;
}

function center() {
    Player.asPlayerMP().setPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5)
}

let commandRan = false;

register("command", () => {
    //chat("simulating secret")
    if (Client.isInGui()) return;
    const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()];
    let [ringX, ringY, ringZ] = RoomUtils.getRealCoords(executedRing.x, executedRing.y, executedRing.z);
    const xzRadius = 0.5
    const yRadius = 0.5;
    const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
    const yDistance = Math.abs(py - ringY)
    const inNode = xzDistance <= xzRadius && yDistance <= yRadius
    if (inNode && !commandRan){
        commandRan = true;
        secretListener.unregister();
        itemSecretListener.unregister();
        batSecretListener.unregister();
        batListener.unregister();
        DoRing(executedRing.type, executedRing.yaw, executedRing.pitch, executedRing.distance, executedRing.useItem, false, executeRing.delay);
        Client.scheduleTask(19, () => { commandRan = false })
    }

}).setName("simulateSecret")

register("clicked", (x,y,btn,pressed) => {
    if (Client.isInGui()) return;
    if (pressed && btn == 0){
        const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()];
        let [ringX, ringY, ringZ] = RoomUtils.getRealCoords(executedRing.x, executedRing.y, executedRing.z);
        const xzRadius = 0.5
        const yRadius = 0.5;
        const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
        const yDistance = Math.abs(py - ringY)
        const inNode = xzDistance <= xzRadius && yDistance <= yRadius
        if (inNode && !commandRan){
            commandRan = true;
            secretListener.unregister();
            // itemSecretListener.unregister(); // Commented out
            // batSecretListener.unregister(); // Commented out
            batListener.unregister();
            DoRing(executedRing.type, executedRing.yaw, executedRing.pitch, executedRing.distance, executedRing.useItem, false, executeRing.delay);
            Client.scheduleTask(19, () => { commandRan = false })
        }
    }
})

function executeRing(){
    const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()]
    let [ringX, ringY, ringZ] = RoomUtils.getRealCoords(executedRing.x, executedRing.y, executedRing.z);
    const xzRadius = 0.5
    const yRadius = 0.5
    const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
    const yDistance = Math.abs(py - ringY)
    const inNode = xzDistance <= xzRadius && yDistance <= yRadius
    if (!inNode){
        return;
    }
    secretListener.unregister();
    // itemSecretListener.unregister(); // Commented out
    // batSecretListener.unregister(); // Commented out
    DoRing(executedRing.type, executedRing.yaw, executedRing.pitch, executedRing.distance, executedRing.useItem, true, executedRing.delay);
}


const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const SecretPickupEvent = Java.type("me.odinmain.events.impl.SecretPickupEvent");


const secretListener = register("packetsent", (packet, event) => {
    if (event.isCanceled()) return;


    const blockId = World.getBlockAt(new BlockPos(packet.func_179724_a())).type.getID();
    if (blockId === 144 || blockId === 54 || blockId === 146 || blockId === 69) {
        executeRing();
        secretListener.unregister();
        return;
    }

}).setFilteredClass(C08PacketPlayerBlockPlacement).unregister();

// Commented out due to invalid event type - requires OdinMain mod
// const itemSecretListener = register("secretpickup", () => {
//     executeRing();
//     itemSecretListener.unregister();
// }).unregister();

// const batSecretListener = register("secretpickup", () => {
//     executeRing();
//     batSecretListener.unregister();
// }).unregister();

let hasFilled = false;

register("tick", () => {
    if (Client.isInGui() || !inClear || !Settings().autoRefillPearls) return;
    const itemSlot = Player?.getInventory()?.getItems().findIndex(item => { return item?.getName()?.toLowerCase()?.includes("ender pearl") })
    if (itemSlot === -1 || itemSlot > 7) {
        return
    }

    let itemStack = Player.getInventory().getStackInSlot(itemSlot).getStackSize()

    if (itemStack < 8 && !hasFilled){
        hasFilled = true;
        ChatLib.command(`gfs ender_pearl ${16 - itemStack}`, false)
        setTimeout(() => {
            hasFilled = false;
        }, 5000)
    }
})

function DoRing(type, yaw, pitch, distance, useItem, awaitSecretAction, delay) {
    if (type == "start"){
        return;
    }
    console.log(`doing ring of type ${type}, yaw: ${yaw}, pitch: ${pitch}, distance: ${distance}, useItem: ${useItem}`)
    if (type == "etherwarp" || type == "pearl" ||type == "use"){
        rotateCharacter(yaw, pitch);
    }
    if (delay > 0){
        delay = (delay / 50)
        Client.scheduleTask((delay),() => {
            doRingAction(type, yaw, pitch, distance, useItem, awaitSecretAction)
        })
    } else {
        doRingAction(type, yaw, pitch, distance, useItem, awaitSecretAction)
    }
}

function doRingAction(type, yaw, pitch, distance, useItem, awaitSecretAction) {

    switch (type) {
        case "walk":
            stop();
            chat("Walking");
            walk(yaw, pitch);
            break
        case "etherwarp":
            chat("etherwarping")
            stop();
            etherwarp(yaw, pitch, awaitSecretAction);
            break
        case "jump":
            chat("Jumping")
            jump()
            break
        case "stop":
            chat("Stopping")
            stop()
            break
        case "boom":
            chat("Exploding")
            if (Settings().autoroutesInfinityBoom){
                swapToItem("Infinityboom TNT")
            } else {
                swapToItem("Superboom TNT")
            }
            Client.scheduleTask(0, () => {
                leftClick()
                return;
            } )
            break
        case "rotate":
            chat(`rotating`)
            rotateCharacter(yaw, pitch)
            break
        case "pearl":
            chat("pearling")
            swapToItem("Ender Pearl");
            rotateCharacter(yaw, pitch);
            Client.scheduleTask(4, () => {
                rightClick();
            })
            break
        case "pearlclip":
            const pearls = Player?.getInventory()?.getItems()?.findIndex(item => { return item?.getName()?.toLowerCase()?.includes("ender pearl") })
            chat("pearlclipping")
            PearlClip(distance);
            break
        case "use":
            swapToItem(useItem);
            rotateCharacter(yaw, pitch);
            Client.scheduleTask(4, () => {
                sendBlockPlacement();
            })
            break
        case "start":
            break
    }
    lastRing = executeRing.type
}






register("worldload", () => {
    Client.scheduleTask(100, () => {
        if (!Dungeon.inDungeon) {
                    secretListener.unregister();
        // batSecretListener.unregister(); // Commented out
        // itemSecretListener.unregister(); // Commented out
        inClear = false;
        return;
        };
        if (inClear) return;
        inClear = true;
        secretListener.unregister();
        // batSecretListener.unregister(); // Commented out
        // itemSecretListener.unregister(); // Commented out
        triggeredRings.clear();
        executedRings = 0;
    })

})

register("renderworld", () => {
    if (!Settings().autoroutes) return;
    if (!inClear) return;
    rings.forEach(rings => {
        if (rings.room != RoomUtils.getCurrentRoomName()) {
            return;
        }
        renderRings(rings.x, rings.y, rings.z, 1, rings.type)
    })
})

register("step", () => {
    if (Settings().autoSaveAutoRoutes) {
        saveAutoRoutes();
    }
}).setFps(1)
