import Settings from "../config"
import { packetCounterGui } from "../config"
import { renderBoxes, renderRings, stop, motion, walk, hclip, rotateCharacter } from "../utils/autoP3Utils";
import { chat, leftClick, swapToItem, lavaclip, distanceToPlayer, jump, setVelocity, unpressAllMovementKeys, pressAllPressedMovementKeys, C03PacketPlayer, center, S08PacketPlayerPosLook, C04PacketPlayerPosition } from "../utils/utils";
import PogObject from "../../PogData";


const mc = Client.getMinecraft().func_175598_ae()

let p3Active = false;
let selectedRoute = Settings().route


let cooldown = false;
let moduleName = "AutismClient"
let path = "data/rings/AutoP3Rings.json"

let rings = []

loadAutoP3();


function saveAutoP3() {
    try {
        FileLib.write(moduleName, path, JSON.stringify(rings, null, 4))
    } catch (error) {
        chat("AutoP3 failed to save")
    }
}

function loadAutoP3() {
    try {
        const data = FileLib.read(moduleName, path)
        if (!data) return
        rings = JSON.parse(data)
    } catch (error) {
        chat("AutoP3 failed to load")
    }
}

register("chat", () => {
    if (Settings().autop3){
        loadAutoP3();
    }
    if (Settings().startOnBoss){
        chat("started p3")
        p3Active = true;
        renderRing.register();
        renderMove.register();
        selectedRoute = Settings().route
    }
}).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!")

register("chat", () => {
    chat("started p3")
    p3Active = true;
    renderRing.register();
    renderMove.register();
    selectedRoute = Settings().routeP3
}).setCriteria("[BOSS] Storm: I should have known that I stood no chance.")



register("command", (...args) => {
    if (!args) { chat("/part3 [add, stop, start, edit, remove, clear, undo, save, load]!"); return }
    switch(args[0]){
        case "add":
            let [id, type, active, route, x, y, z, yaw, pitch, delay] = [Date.now(), args[1].toLowerCase(), true, selectedRoute, Math.round(mc.field_78730_l * 2) / 2, Math.round(mc.field_78731_m * 2) / 2, Math.round(mc.field_78728_n * 2) / 2, mc.field_78735_i, mc.field_78732_j, 0]
            if  (!["awaitterm","walk","rotate", "jump", "stop", "boom","hclip", "motion","vclip","cmd", "blink"].includes(type)) {
                chat("Invalid ring type!");
                return;
            }
            let w = isNaN(args[2]) ? 1 : args[2];
            let h = isNaN(args[3]) ? 1 : args[3];

            chat(`Type: ${type}Route: ${route},Width: ${w}, Height: ${h}`)
            let toPush = { id, type, active, route, x, y, z, w, h, yaw, pitch }

            if (args[1] == "cmd") {
                let cmdArgs = args.slice(4);
                let delayIndex = cmdArgs.indexOf("delay");
                if (delayIndex !== -1) {
                    cmdArgs = cmdArgs.slice(0, delayIndex);
                }
                let cmd = cmdArgs.join(" ");
                toPush.cmd = cmd;
                chat("added command " + cmd);
            }
            if (args[1] == "vclip"){
                let action = args[4];
                if (!action){
                    chat("must specify depth in format: /p3 add vclip width height depth")
                    return;
                }
                toPush.action = action;
                chat("added depth " + action);
            }
            if (args[1] == "blink"){
                let blinkName = args[4];
                if (!blinkName){
                    chat("must specify the name of what blinkroute u wanna play in the format /p3 add blink `name`");
                    return;
                }
                toPush.blinkName = blinkName;
                chat("added blink " + blinkName)
            }
            if (args.includes("center")){
                toPush.center = true;
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

            cooldown = true
            Client.scheduleTask(19, () => { cooldown = false })
            rings.push(toPush)
            chat(`${type} placed!`)
            break
        case "start":
            loadAutoP3();
            p3Active = true;
            renderMove.register()
            renderRing.register()
            chat(`P3 Started!`)
            triggeredRings.clear();
            break
        case "stop":
            p3Active = false;
            renderMove.unregister()
            renderRing.unregister()
            chat(`P3 Stopped!`)
            triggeredRings.clear();
            break
        case "edit":
            if (!Settings().editMode) { Settings().getConfig().setConfigValue("AutoP3", "editMode", true); chat("Editmode on!") }
            else { Settings().getConfig().setConfigValue("AutoP3", "editMode", false); chat("Editmode off!") }
            break
        case "remove":
            rings = rings.filter(ring => {
                if (ring.route !== selectedRoute) return true;
                range = args[1]
                if (!range) { range = 2 }
                let distance = distanceToPlayer(ring.x, ring.y, ring.z)
                return distance >= range;
            })
            break
        case "clear":
            rings = [];
            saveAutoP3();
            chat("Rings cleared!")
            break
        case "undo":
            rings.pop();
            chat("Ring undone!")
            break
        case "save":
            saveAutoP3();
            chat("Rings saved!")
            break
        case "load":
            route = args[1]
            if (!route){
                chat("dont forget the route name!");
                return;
            }
            Settings().getConfig().setConfigValue("AutoP3", "route", route);
            selectedRoute = route;
            chat(`Route ${route} loaded!`)
            break
    }
}).setName("part3")



const renderRing = register("renderworld", () => {
    if (!Settings().autop3) return;
    if (!p3Active) return;
    rings.forEach(rings => {
        if (rings.route !== selectedRoute) return;
        if (Settings().renderRings) {
            renderRings(rings.x, rings.y, rings.z, rings.w, rings.type)
        } else {
            renderBoxes(rings.x, rings.y, rings.z, rings.h, rings.w, rings.type)
        }
    })
}).unregister()

let triggeredRings = new Set();


const renderMove = register("renderworld", () => {
    if (!Settings().autop3 || Settings().editMode) return;
    if (!p3Active) return
    if (Client.isInGui()) return
    rings.forEach(ring => {
        const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()]
        let [ringX, ringY, ringZ] = [ring.x, ring.y, ring.z]
        const xzRadius = parseFloat((ring.w / 2) + 0.25)
        const yRadius = parseFloat((ring.h / 2) + 0.25)
        const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
        const yDistance = Math.abs(py - ringY)
        const inNode = xzDistance <= xzRadius && yDistance <= yRadius
        if (ring.route != selectedRoute) return;
        if (inNode && !triggeredRings.has(ring.id) &&!cooldown) {
            if (ring.center){
                centerCircle(ring.x, ring.y, ring.z);
            }
            if (ring.delay > 0){
                stop();
                let delay = ring.delay / 50;
                Client.scheduleTask(delay, () => {
                    DoRing(ring)
                })
            } else {
                DoRing(ring)
            }
            triggeredRings.add(ring.id);
        } else if (!inNode && triggeredRings.has(ring.id)){
            triggeredRings.delete(ring.id);
        }
    })
}).unregister()

function DoRing(ring){
    const [px, py, pz] = [Player.getX(), Player.getY(), Player.getZ()]
    let [ringX, ringY, ringZ] = [ring.x, ring.y, ring.z]
    const xzRadius = parseFloat((ring.w / 2) + 0.25)
    const yRadius = parseFloat((ring.h / 2) + 0.25)
    const xzDistance = Math.sqrt((px - ringX) ** 2 + (pz - ringZ) ** 2)
    const yDistance = Math.abs(py - ringY)
    const inNode = xzDistance <= xzRadius && yDistance <= yRadius
    if (!inNode) return;
    switch (ring.type) {
        case "awaitterm":
            //broken fix
            break
        case "cmd":
            chat(`Executing CMD ring: ${ring.cmd}`);
            ChatLib.command(ring.cmd, true);
            break
        case "walk":
            chat("Walking")
            walk(ring.yaw, ring.pitch)
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
            if (Settings().autop3InfinityBoom){
                swapToItem("Infinityboom TNT")
            } else {
                swapToItem("Superboom TNT")
            }
            Client.scheduleTask(0, () => { leftClick() } )
            break
        case "motion":
            chat("Motion")
            stop();
            motion(ring.yaw, ring.pitch);
            break
        case "hclip":
            chat("hclipping")
            stop();
            hclip(ring.yaw)
            break
        case "vclip":
            chat("Vclipping")
            lavaclip(ring.action)
            break
        case "rotate":
            chat(`rotating`)
            rotateCharacter(ring.yaw, ring.pitch)
            break
        case "edge":
            chat("Edging")
            edge()
            break
        case "blink":
            chat("Blinking")
            stop();
            setTimeout(() => {
                blink(ring.blinkName);
            }, 20)
            break
    }
}

function centerCircle(x,y,z) {
    Player.asPlayerMP().setPosition(x,y,z)
}


register("command", () => {
    const modulePath = "AutismClient";
    const filePath = "data/rings/rings.json";
    const endPath = "data/rings/AutoP3Rings.json";
    let ringsNew;

    try {
        const data = FileLib.read(modulePath, filePath)
        if (!data) return
        ringsNew = JSON.parse(data)
    } catch (e) {
        ChatLib.chat("&cError reading rings.json");
        return;
    }


    let updated = false;
    let currentId = Date.now();
    const newRings = ringsNew.map((ring, index) => {
        console.log(ring)
        if (!ring.id) {
            ring.id = currentId + index;
            updated = true;
        }
        return ring;
    });

    if (updated) {
        FileLib.write(modulePath, endPath, JSON.stringify(newRings, null, 4));
        ChatLib.chat("&aUpdated rings.json with missing IDs.");
    } else {
        ChatLib.chat("&eNo missing IDs found.");
    }
}).setName("updaterings");



register("worldload", () => {
    p3Active = false;
    renderMove.unregister()
    renderRing.unregister()
});

register("step", () => {
    if (Settings().autoSave) {
        saveAutoP3();
        selectedRoute = Settings().route
    }

}).setFps(1)







// BLINK

const data = new PogObject("AutismClient", {
    packetCounter: {
        x: Renderer.screen.getWidth() / 2,
        y: Renderer.screen.getHeight() / 2,
        scale: 1,
    }
}, "../data/PosData.json");

const renderText = register("renderoverlay", () => {
    Renderer.scale(data.packetCounter.scale)
    const text = `${savedTicks}`
    Renderer.drawString(text, data.packetCounter.x, data.packetCounter.y)
}).unregister()

register("step", () => {
    if (packetCounterGui.isOpen()) preview.register()
    else preview.unregister()
}).setFps(2)

const preview = register("renderoverlay", () => {
    Renderer.scale(data.packetCounter.scale)
    Renderer.drawString(400, data.packetCounter.x, data.packetCounter.y)
}).unregister()

register("dragged", (_0, _1, x, y, bn) => {
    if (!packetCounterGui.isOpen()) return
    if (bn === 2) return
    data.packetCounter.x = x / data.packetCounter.scale
    data.packetCounter.y = y / data.packetCounter.scale
    data.save()
})


register("scrolled", (_0, _1, dir) => {
    if (!packetCounterGui.isOpen()) return
    if (dir == 1) data.packetCounter.scale += 0.01
    else data.packetCounter.scale -= 0.01
    data.packetCounter.scale = Math.round(data.packetCounter.scale * 100) / 100
    ChatLib.clearChat(69427)
    new Message(`Current scale: ${data.packetCounter.scale}`).setChatLineId(69427).chat()
    data.save()
})
let savedTicks = 0;

let ticksStill = 0;

let worldJoinTicks = 0;

let savedPacketTimestamps = [];

let postP3 = false;

let chargingPackets = false;

let S08RecievedRecently = false

register("packetreceived", () => {
    S08RecievedRecently = true
    Client.scheduleTask(1, () => S08RecievedRecently = false)
}).setFilteredClass(S08PacketPlayerPosLook)

register("chat", () => {
    if (!Settings().blink) return
    packetCollector.unregister()
    renderText.unregister()
    postP3 = true
    chargingPackets = false

}).setCriteria("The Core entrance is opening!")

register("chat", () => {
    if (!Settings().blink) return
    postP3 = false;
    chargingPackets = true;
    packetCollector.register()
    renderText.register()
}).setCriteria("[BOSS] Storm: I should have known that I stood no chance.")

register("worldunload", () => {
    packetCollector.unregister()
    renderText.unregister()
    chargingPackets = false
    postP3 = false
})


const packetCollector = register("packetsent", (packet, event) => {
    if (!Settings().blink) return
    let currentTime = Date.now()

    savedPacketTimestamps = savedPacketTimestamps.filter(timestamp => {
        if (currentTime - timestamp >= 20000) {
            if (savedTicks > 0) {
                savedTicks--
                return false
            }
        }
        return true
    })
    const packetName = packet.class.getSimpleName()
    if (packetName === "C06PacketPlayerPosLook" && S08RecievedRecently) return
    if ((packetName === "C05PacketPlayerLook" || packetName === "C06PacketPlayerPosLook")) return
    if (!Player.asPlayerMP().isOnGround() || ticksStill === 0) return

    if (worldJoinTicks > 20 && savedTicks < 382 && savedPacketTimestamps.length < 382) {
        cancel(event)
        savedTicks++
        savedPacketTimestamps.push(currentTime)
    }
}).setFilteredClasses([C03PacketPlayer]).unregister()

register("worldload", () => {
    worldJoinTicks = 0;
})

register("tick", () => {
    worldJoinTicks++;
})

let posLastTick = [Player.getX(), Player.getY(), Player.getZ()]

register("tick", () => { // Solution to jump lagback. Yeah...
    const posThisTick = [Player.getX(), Player.getY(), Player.getZ()]
    if ((!Player.getPlayer().field_70124_G || Player.getPlayer().field_70159_w !== 0 || Player.getPlayer().field_70179_y !== 0) || posThisTick.some((a, index) => a !== posLastTick[index])) {
        ticksStill = 0
        posLastTick = [...posThisTick]
        return
    }
    posLastTick = [...posThisTick]
    ticksStill++
})

let packetsRecording = false;

register("command", () => {
    chat(`flipped packets on or off`)
    if (packetsRecording) {
        packetCollector.unregister();
        renderText.unregister();
    } else {
        packetCollector.register();
        renderText.register();
    }
    packetsRecording = !packetsRecording;
}).setName("bonkpackets")


let recording = false;

let blinkRouteName = "";

let packetsLogged = 0;

register("command", (...args) => {
    if (!Settings().blink) return;
    blinkRouteName = args[0];
    if (blinkRouteName.length < 1) return chat("must specify routename when recording start of route");
    if (recording) {
        chat(`Blink route recording stopped. ${packetsLogged} packets logged.`)
        blinkRouteName = ""
        previousPacket = [0, 0, 0]
        blinkLogger.unregister();
    } else {
        // starting recording
        chat("starting to record")
        FileLib.delete("AutismClient/data/blinks/", blinkRouteName + ".json")
        FileLib.append("AutismClient/data/blinks/", blinkRouteName + ".json", `Speed when this route was recorded: ${((Player.getPlayer().field_71075_bZ.func_75094_b()) * 1000).toFixed(0)}`)
        blinkLogger.register();
    }
    recording = !recording;
}).setName("togglerecord");

let previousPacket = [0, 0, 0]

const blinkLogger = register("packetsent", (packet) => {
    if (packet.class.getSimpleName() === "C05PacketPlayerLook" || packet.class.getSimpleName() === "C03PacketPlayer"){
        return;
    }
    let currentPacket = packetGetXYZ(packet)
    if (currentPacket.every((param, index) => param == previousPacket[index])) return chat("was dupe")
    chat(`${packet.func_149464_c()}, ${packet.func_149467_d()}, ${packet.func_149472_e()}, ${packet.func_149465_i()}`)
    try {
        FileLib.append("AutismClient/data/blinks/", blinkRouteName + ".json", `\n${packet.func_149464_c()}, ${packet.func_149467_d()}, ${packet.func_149472_e()}, ${packet.func_149465_i()}`)
    } catch (e){
        chat(e);
    }
    chat("packet logged")
    packetsLogged++
    previousPacket = packetGetXYZ(packet)
}).setFilteredClasses([C03PacketPlayer]).unregister()

function blink(routeName) {
    //if (postP3) return;
    if (!packetsRecording) return chat(`You are not charging packets`)
    if (!FileLib.exists("AutismClient/data/blinks/", routeName + ".json")) return chat("Route doesn't exist!")
    const packets = parseFile(routeName + ".json")
    if (!packets) return chat("Unknown error. What the fuck?")
    const requiredTicks = packets.length;

    packetCollector.unregister()
    if (savedTicks < requiredTicks) return chat(`Required ticks: ${requiredTicks}`)



    if (!Player.asPlayerMP().isOnGround()) return chat(`Not on ground`)

    if (!Player.asPlayerMP().isOnGround()) return
    savedTicks -= requiredTicks
    chat(`Blinked (${packets.length} ticks)`)
    packets.forEach(packet => {
        if (!Settings().blink || !p3Active) return
        if(packet.length != 4){
            chat("packet did not have all arguments")
            return;
        }
        const [x, y, z, onGround] = [parseFloat(packet[0]), parseFloat(packet[1]), parseFloat(packet[2]), packet[3] === "true"]
        Player.getPlayer().func_70107_b(x, y, z)
        Client.sendPacket(new C04PacketPlayerPosition(x, y, z, onGround))
        stop();
    })
    setTimeout(() => {
        packetCollector.register();
    }, 20)
}



function parseFile(fileName) {
    try {
        const packets = FileLib.read("AutismClient/data/blinks/", fileName).split("\n").map(str => str.split(", "))
        packets.shift() // First line is always empty and I cba to make a better solution
        return packets
    } catch (e) {
        return null
    }
}

register("command", (...args) => {
    const fileName = args.join(" ")

    if (!FileLib.exists("AutismClient/data/blinks/", fileName + ".json")) { chat("Route doesn't exist!"); return }

    FileLib.delete("AutismClient/data/blinks/", fileName + ".json")
    chat(`Deleted ${fileName}.json`)
}).setName("removeblink").setAliases("rb")

export function packetGetXYZ(packet) {
    return [packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e()]
}
