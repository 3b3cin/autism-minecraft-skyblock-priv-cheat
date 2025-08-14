const mc = Client.getMinecraft();

// TODO: made methods to static
export const KeyBindingUtils = new class {

    // static mc = Client.getMinecraft();

    // static ss = this.mc.field_71474_y.field_74312_F

    // static KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");


    lastClick = 0;

    gameSettings = Client.getSettings().getSettings();

    leftClick = this.gameSettings.field_74312_F;

    rightClick = this.gameSettings.field_74313_G;

    KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");

    

    getKeyCode(keyName) {
        return Keyboard.getKeyIndex(keyName);
    }

    getKeyName(keyCode) {
        return Keyboard.getKeyName(keyCode);
    }

    isKeyDown(keyCode) {
        return Keyboard.isKeyDown(keyCode);
    }

    setHotbarState(index, state) {
        this.setKeyState(this.gameSettings.field_151456_ac[index].func_151463_i(), state);
    }

    pressHotbar(index) {
        this.setHotbarState(index, true);
        Client.scheduleTask(() => this.setHotbarState(index, false));
    }

    setLeftClick(state) {
        this.setKeyState(this.leftClick.func_151463_i(), state)
        // this.KeyBinding.func_74510_a(this.leftClick.func_151463_i(), state);
        // if (state) {
        //     // ChatLib.chat(1000 / (Date.now() - this.lastClick));
        //     // this.lastClick = Date.now();
        //     this.KeyBinding.func_74507_a(this.leftClick.func_151463_i());
        // }
    }

    isLeftClickDown() {
        return this.leftClick.func_151470_d();
    }
    
    setRightClick(state) {
        this.setKeyState(this.rightClick.func_151463_i(), state);
        // this.KeyBinding.func_74510_a(this.rightClick.func_151463_i(), state);
        // if (state) {
        //     this.KeyBinding.func_74507_a(this.rightClick.func_151463_i());
        // }
    }

    setKeyState(keyCode, state) {
        this.KeyBinding.func_74510_a(keyCode, state);
        if (state) {
            this.KeyBinding.func_74507_a(keyCode);
        }

    }
}