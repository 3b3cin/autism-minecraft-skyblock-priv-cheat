import { McUtils } from "./McUtils";

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");
const C04PacketPlayerPosition = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C04PacketPlayerPosition");
const C05PacketPlayerLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C05PacketPlayerLook");
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook");
const C07PacketPlayerDigging = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const S01PacketJoinGame = Java.type("net.minecraft.network.play.server.S01PacketJoinGame");
const S07PacketRespawn = Java.type("net.minecraft.network.play.server.S07PacketRespawn");
const S0CPacketSpawnPlayer = Java.type("net.minecraft.network.play.server.S0CPacketSpawnPlayer");
// const S0EPacketSpawnObject  = Java.type("net.minecraft.network.play.server.S0EPacketSpawnObject");
const S14PacketEntity  = Java.type("net.minecraft.network.play.server.S14PacketEntity");
const S18PacketEntityTeleport  = Java.type("net.minecraft.network.play.server.S18PacketEntityTeleport");

const C03YawField = C03PacketPlayer.class.getDeclaredField("field_149476_e");
const C03PitchField = C03PacketPlayer.class.getDeclaredField("field_149473_f");
C03YawField.setAccessible(true);
C03PitchField.setAccessible(true);
const EntityPlayerSP = Java.type("net.minecraft.client.entity.EntityPlayerSP");
const lastReportedYawField = EntityPlayerSP.class.getDeclaredField("field_175164_bL");
const lastReportedPitchField = EntityPlayerSP.class.getDeclaredField("field_175165_bM");
lastReportedYawField.setAccessible(true);
lastReportedPitchField.setAccessible(true);

const mc = Client.getMinecraft();
let ticks = 0;

const Float = Java.type("java.lang.Float");
const RenderPlayerEventPre = Java.type("net.minecraftforge.client.event.RenderPlayerEvent$Pre");
const RenderPlayerEventPost = Java.type("net.minecraftforge.client.event.RenderPlayerEvent$Post");

register("tick", () => {
    ticks++;
})

export const RotationUtils = new class {
    constructor() {
        this.predictS08 = 0;
        this.isFake = false;
        this.isSilentRotating = false;
        this.isRotated = false;
        // this.serverYaw = Player.getPlayer().field_70177_z;
        // this.serverPitch = Player.getPlayer().field_70125_A;
        this.serverYaw = NaN;
        this.serverPitch = NaN;
        this.lastReportedYaw = NaN;
        this.lastReportedPitch = NaN;
        this.onS08Packet = new Set();
        this.onFakeC03PacketPre = new Set();
        this.onFakeC03PacketPost = new Set();
        this.lastReportedX = NaN;
        this.lastReportedY = NaN;
        this.lastReportedZ = NaN;
        

        this.realRotations = [0, 0, 0, 0, 0, 0]

        this.S08PrecitTrigger = register("tick", () => {
            if (!this.isSilentRotating) return;
            if (this.predictS08 > 0) {
                // ChatLib.chat(this.predictS08)
                this.predictS08--;
            }
        }).unregister();

        this.cancelBlockBreakTrigger = register("packetSent", (packet, event) => {
            if (!this.isSilentRotating) return;
            // ChatLib.chat(packet.func_180762_c());
            cancel(event);
        }).setFilteredClass(C07PacketPlayerDigging).unregister();

        this.cancelAttackTrigger = register("AttackEntity", (entity, event) => {
            if (this.isSilentRotating) {
                cancel(event);
            }
        }).unregister();

        this.clientRotationTrigger = register("renderPlayer", (event) => {
            if (!this.isSilentRotating) return;
            const thePlayer = event.entity;
            if (thePlayer !== Player.getPlayer()) return;

            this.realRotations = [
                thePlayer.field_70125_A,
                thePlayer.field_70127_C,
                thePlayer.field_70761_aq,
                thePlayer.field_70759_as,
                thePlayer.field_70760_ar,
                thePlayer.field_70758_at
            ];
            thePlayer.field_70125_A = this.serverPitch;
            thePlayer.field_70127_C = this.lastReportedPitch;
            thePlayer.field_70761_aq += this.serverYaw - thePlayer.field_70177_z;
            thePlayer.field_70759_as += this.serverYaw - thePlayer.field_70177_z;
            thePlayer.field_70760_ar += this.lastReportedYaw - thePlayer.field_70126_B;
            thePlayer.field_70758_at += this.lastReportedYaw - thePlayer.field_70126_B;
            
            return;
        }).unregister();

        this.clientRotationTrigger1 = register("renderPlayer", (event) => {
            if (!this.isSilentRotating) return;
            const thePlayer = event.entity;
            if (thePlayer !== Player.getPlayer()) return;
            thePlayer.field_70125_A = this.realRotations[0];
            thePlayer.field_70127_C = this.realRotations[1];
            thePlayer.field_70761_aq = this.realRotations[2];
            thePlayer.field_70759_as = this.realRotations[3];
            thePlayer.field_70760_ar = this.realRotations[4];
            thePlayer.field_70758_at = this.realRotations[5];
        }).unregister();

        this.s08Listener = register("PacketReceived", (packet, event) => {

            for (let callBack of this.onS08Packet) {
                callBack(packet, event);
            }

            if (!this.isSilentRotating) return;
            if (Player.getPlayer() === null) return;

            if (event.isCanceled()) return;

            this.stop();
            return;
        }).setFilteredClass(S08PacketPlayerPosLook)//.unregister();

        // why lowest priority trigger can't be unregistered
        this.stopTrigger = register("PacketReceived", (packet, event) => {
            if (!this.isSilentRotating) return;
            if (Player.getPlayer() === null) return;
            if (event.isCanceled()) {
                // ChatLib.chat("canceled event: " + packet);
                return;
            }
            if (packet instanceof S01PacketJoinGame) {
                if (packet.func_149197_c() === Player.getPlayer().func_145782_y()) {
                    // ChatLib.chat("s01 detected")
                    this.stop();
                    return;
                }
            }

            if (packet instanceof S07PacketRespawn) {
                // ChatLib.chat("s07 detected")
                this.stop();
                return;
            }

            if (packet instanceof S0CPacketSpawnPlayer) {
                if (packet.func_148943_d() === Player.getPlayer().func_145782_y()) {
                    // ChatLib.chat("s0c detected")
                    this.stop();
                    return;
                }
            }

            if (packet instanceof S14PacketEntity) {
                if (packet.func_149065_a(mc.field_71441_e) === Player.getPlayer()) {
                    // ChatLib.chat("s14 detected")
                    this.stop();
                    return;
                }
            }

            if (packet instanceof S18PacketEntityTeleport) {
                if (packet.func_149451_c() === Player.getPlayer().func_145782_y()) {
                    // ChatLib.chat("s18 detected")
                    this.stop();
                    return;
                }
            }
        }).unregister()//.setPriority(Priority.LOWEST)//.unregister();

        this.silentRotationTrigger = register("packetSent", (packet, event) => {
            if (!(packet instanceof C03PacketPlayer)) return;
            if (!this.isSilentRotating || Player.getPlayer() === null || Player.asPlayerMP().getRiding()) {
                this.stop();
                return;
            }

            if (this.isFake) {
                // ChatLib.chat("fake skipped")
                // ChatLib.chat(packet)
                this.isFake = false;
                return;
            }

            for (let callBack of this.onFakeC03PacketPre) {
                callBack(packet, event);
            }

            if (event.isCanceled()) {
                return;
            }

            try {
                if (!this.isValidRotation()) {
                    this.stop();
                    return;
                }
            } catch (e) {
                console.log(e);
                return;
            }

            const x = packet.func_149464_c();
            const y = packet.func_149467_d();
            const z = packet.func_149472_e();

            // const yaw = packet.func_149462_g();
            // const pitch = packet.func_149470_h();
            const OnGround = packet.func_149465_i();
            const moving = packet.func_149466_j();
            let rotating = this.serverYaw - this.lastReportedYaw !== 0 || this.serverPitch - this.lastReportedPitch !== 0;
            
            // cancel(event);
            event.setCanceled(true);

            if (moving && rotating) {
                // ChatLib.chat("rotating c06 " + ticks)
                this.sendPacket(new C06PacketPlayerPosLook(x, y, z, this.serverYaw, this.serverPitch, OnGround));
            } else if (moving) {
                // ChatLib.chat("moving c04 " + ticks)
                this.sendPacket(new C04PacketPlayerPosition(x, y, z, OnGround));
            } else if (rotating) {
                // ChatLib.chat("c05")
                // ChatLib.chat("rotating c05 " + ticks)
                this.sendPacket(new C05PacketPlayerLook(this.serverYaw, this.serverPitch, OnGround));
            } else {
                this.sendPacket(new C03PacketPlayer(OnGround));
            }
            // lock view
            // McUtils.setRotations(this.serverYaw, this.serverPitch)

            if (rotating) {
                this.lastReportedYaw = this.serverYaw;
                this.lastReportedPitch = this.serverPitch;
                lastReportedYawField.setFloat(Player.getPlayer(), this.lastReportedYaw);
                lastReportedPitchField.setFloat(Player.getPlayer(), this.lastReportedPitch);
            }

            if (moving) {
                this.lastReportedX = x;
                this.lastReportedY = y;
                this.lastReportedZ = z;
            }

            // for bloomcore
            // if (event.isCanceled()) {
                C03YawField.setFloat(packet, this.lastReportedYaw);
                C03PitchField.setFloat(packet, this.lastReportedPitch);
            // }

            for (let callBack of this.onFakeC03PacketPost) {
                callBack(packet, event);
            }


        }).setFilteredClass(C03PacketPlayer).unregister()//.setPriority(Priority.HIGH)//.unregister();
    }

    // i don't fucking know why stackoverflow error pops up when i trying to register/unregister priority setted packet trigger while having bloomcore
    start() {
        if (this.isSilentRotating) return;
        this.isRotated = false;
        this.predictS08 = 0;
        // this.predictedS08 = false;
        // this.predictC06 = 0;
        this.serverYaw = Player.getPlayer().field_70177_z;
        this.serverPitch = Player.getPlayer().field_70125_A;
        this.lastReportedYaw = lastReportedYawField.get(Player.getPlayer());
        this.lastReportedPitch = lastReportedPitchField.get(Player.getPlayer());
        this.lastReportedX = Player.getLastX();
        this.lastReportedY = Player.getLastY();
        this.lastReportedZ = Player.getLastZ();
        this.isSilentRotating = true;
        this.cancelBlockBreakTrigger.register();
        this.S08PrecitTrigger.register();
        this.cancelAttackTrigger.register();
        this.clientRotationTrigger.register();
        this.clientRotationTrigger1.register();
        // this.s08Listener.register();
        this.stopTrigger.register();
        this.silentRotationTrigger.register();
        // ChatLib.chat("started " + ticks)
    }

    stop() {
        if (!this.isSilentRotating) return;
        this.silentRotationTrigger.unregister();
        this.stopTrigger.unregister();
        // this.s08Listener.unregister();
        this.clientRotationTrigger1.unregister();
        this.clientRotationTrigger.unregister();
        this.cancelAttackTrigger.unregister();
        this.S08PrecitTrigger.unregister();
        this.cancelBlockBreakTrigger.unregister();
        this.isSilentRotating = false;
        this.serverYaw = Player.getPlayer().field_70177_z;
        this.serverPitch = Player.getPlayer().field_70125_A;
        // Player.getPlayer().field_70177_z = this.serverYaw;
        // Player.getPlayer().field_70125_A = this.serverPitch;
        lastReportedYawField.setFloat(Player.getPlayer(), this.lastReportedYaw);
        lastReportedPitchField.setFloat(Player.getPlayer(), this.lastReportedPitch);
        // this.predictC06 = 0;
        // this.predictedS08 = false;
        this.predictS08 = 0;
        this.isRotated = false;
        Client.scheduleTask(() => Player.getPlayer().field_70177_z += Math.random() - 0.5);
        // ChatLib.chat("stopped " + ticks)
    }

    /**
     * 
     * @param {*} yaw this should be rotation yaw
     * @param {*} pitch 
     */
    setRotations(yaw, pitch) {
        yaw = Number(yaw);
        pitch = Number(pitch);

        if (isNaN(yaw) || isNaN(pitch)) return;

        this.serverYaw = yaw;
        this.serverPitch = pitch;
        this.serverYaw = new Float(this.serverYaw.toFixed(14));
        this.serverPitch = new Float(this.serverPitch.toFixed(14));
    }

    addRotations(yaw, pitch) {
        yaw = Number(yaw.toFixed(14));
        pitch = Number(pitch.toFixed(14));
        // if (!yaw && !pitch) return;
        if (isNaN(yaw) || isNaN(pitch)) return;
        // this.isRotated = true;
        this.setRotations(this.serverYaw + yaw, this.serverPitch + pitch);
    }

    getServerRotations() {
        return [this.serverYaw, this.serverPitch];
    }

    sendPacket(packet) {
        this.isFake = true;
        // ChatLib.chat("packet sending")
        Client.sendPacket(packet);
        // ChatLib.chat("packet sent")
    }

    handleS08(packet, event) {
        // ChatLib.chat("handle")
        if (!this.isSilentRotating) return;
        let x = packet.func_148932_c();
        let y = packet.func_148928_d();
        let z = packet.func_148933_e();
        let yaw = packet.func_148931_f();
        let pitch = packet.func_148930_g();
        const flag = packet.func_179834_f();

        event.setCanceled(true);

        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X)) {
            x += Player.getX();
        } else {
            Player.getPlayer().field_70159_w = 0;
        }

        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y)) {
            y += Player.getY();
        } else {
            Player.getPlayer().field_70181_x = 0;
        }

        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Z)) {
            z += Player.getZ();
        } else {
            Player.getPlayer().field_70179_y = 0;
        }

        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) {
            pitch += this.serverPitch;
        }

        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y_ROT)) {
            yaw += this.serverYaw;
        }

        this.setRotations(yaw, pitch);
        Player.getPlayer().func_70107_b(x, y, z);
        this.lastReportedX = x;
        this.lastReportedY = y;
        this.lastReportedZ = z;
        // Player.getPlayer().func_70080_a(x, y, z, Player.getPlayer().field_70177_z, Player.getPlayer().field_70125_A);
        // ChatLib.chat("catch s08 " + ticks)
        this.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, false));
    }

    isValidRotation() {
        if (isNaN(this.serverYaw) || isNaN(this.serverPitch) || this.serverPitch > 90 || this.serverPitch < -90) return false;
        return true;
    }
    
}
