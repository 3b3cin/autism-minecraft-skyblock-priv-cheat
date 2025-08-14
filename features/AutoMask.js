import { chat } from "../utils/utils";
import Settings from "../config"

const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow");
const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot");
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow");
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow");
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow");

let items = [];
let cwid = -1
let itemName = ""
let inGui = false
let slotCount = 0;

const close = register("packetreceived", (packet, event) => {
    const title = ChatLib.removeFormatting(packet.func_179840_c().func_150254_d());
    if (title !== "Your Equipment and Stats") return
    cancel(event)
    cwid = packet.func_148901_c()
    slotCount = packet.func_148898_f()
}).setFilteredClass(S2DPacketOpenWindow).unregister()

const getItems = register("packetreceived", (packet, event) => {
    const itemStack = packet.func_149174_e();
    const slot = packet.func_149173_d();
    if (!itemStack || !slot) return
    const item = new Item(itemStack)
    items[slot] = item
    if (items.length !== slotCount + 36) return
    const index = items.findIndex(x => x?.getName()?.includes(itemName))
    if (!index || index === -1) {
        chat("Not found!")
        return
    }
    click(index)
    getItems.unregister()
    Client.sendPacket(new C0DPacketCloseWindow(cwid))
    Client.scheduleTask(9, () => {
        close.unregister()
    })
}).setFilteredClass(S2FPacketSetSlot).unregister()

function click(slot) {
    if (cwid === -1 || !cwid) return false;
    //ChatLib.chat("clicking" + " " + cwid + " " + slot)
    Client.sendPacket(new C0EPacketClickWindow(cwid, slot, 0, 0, null, 0))
    return true;
}

register("command", (thing) => {
    if (!thing || thing === "") return
    items = [];
    itemName = thing
    close.register()
    getItems.register()
    ChatLib.command("eq")
}).setName("equip")

register("packetsent", () => {
    cwid = -1
    inGui = false
}).setFilteredClass(C0DPacketCloseWindow)

register("packetreceived", () => {
    cwid = -1
    inGui = false
}).setFilteredClass(S2EPacketCloseWindow)

register("chat", () => {
    if (!Settings().autoEquip || inGui) return
    ChatLib.command("equip Bonzo", true)
}).setCriteria("Second Wind Activated! Your Spirit Mask saved your life!")

register("chat", () => {
    if (!Settings().autoEquip || inGui) return
    ChatLib.command("equip Spirit Mask", true)
}).setCriteria("Your Bonzo's Mask saved your life!")

register("packetreceived", () => { inGui = true }).setFilteredClass(S2DPacketOpenWindow)
