import Settings from "../config"

const fakeKeybinds = []

function onKeyPress(_keyBindName, code) {
    keyPressListener.register()
    fakeKeybinds.push({ keybindName: _keyBindName, exec: code })
}

export default { onKeyPress }

const keyPressListener = register("tick", () => {
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    const settings = Settings()
    const pressedKeybinds = fakeKeybinds.filter(keybind => settings[keybind.keybindName] === keyCode)
    if (!pressedKeybinds.length) return

    pressedKeybinds.forEach(keybind => keybind.exec()) // Execute the code associated with the pressed keybinds. There can be multiple on the same key.
}).unregister()
