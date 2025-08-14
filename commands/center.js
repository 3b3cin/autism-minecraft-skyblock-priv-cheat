register("command", () => {
    Player.asPlayerMP().setPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5)
}).setName("center")
