import React from "react";
import * as ReactDOM from "react-dom";
// import MediapipeApp from "./App";
import PixelCharacterTfjs from "./components/pixelCharacterTfjs";
import BackgroundApp from "./components/background";


const rootElement = document.getElementById("cameraRoot");
ReactDOM.render(
    <React.StrictMode>
        <PixelCharacterTfjs />
        {/*<MediapipeApp />*/}
        <BackgroundApp />
    </React.StrictMode>,
    rootElement
);
