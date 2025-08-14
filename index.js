import Settings from "./config";

import "./commands/center";

import "./features/AutoP3";
import "./features/Simulation";
import "./features/HClip";
// import "./features/AutoRoute"; // Hidden functionality
import "./features/VClip";
import "./features/BlockClip";
import "./features/ZeroPingEtherwarp";
import "./features/PearlClip";
// import "./features/fastleap";
import "./features/AutoMask";


register("command", () => {
    Settings().openGui();

}).setName("autismclient").setAliases("auc");

ChatLib.chat("§0[§cAutism§0] §bAutismClient is Autisiming");
