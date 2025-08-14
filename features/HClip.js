import keybinds from "../utils/keybinds"
import { chat, jump, pressAllPressedMovementKeys, setVelocity, unpressAllMovementKeys } from "../utils/utils";

keybinds.onKeyPress("hclipKeybind", () => {
    const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806
    const direction = Player.getPlayer().field_70177_z;
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
});
