// not done yet

/*import Settings from "../config"
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import { swapToItem, chat } from "../utils/utils";

let inClear = false;

register("chat", () => {
    inClear = false;
}).setCriteria("[BOSS] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!")

register("clicked", (x,y,btn,pressed) => {
    if (!pressed || btn != 0 || !inClear || !Settings().fastLeapWitherDoor || Client.isInGui()) return;
    heldItem = Player.getHeldItem().getName();
    console.log(heldItem)
    if (heldItem != "§5Infinileap") return;
    fastleap();
});

register("tick", () => {
    if (!Dungeon.inDungeon){
        inClear = false;
    }
    if (Dungeon.inDungeon && !inClear){
        inClear = true;
    }
})

register("chat", (name) => {

}).setCriteria("${name} opened a WITHER door!")


function fastleap() {

};*/
