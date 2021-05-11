import React from "react";
import * as ReactDOM from "react-dom";
import MediapipeApp from "./App";
import TfjsApp from "./TfjsApp";
import PixelCharacterRenderer from "./renderer/pixel";


const rootElement = document.getElementById("cameraRoot");
ReactDOM.render(
    <React.StrictMode>
        {/*<TfjsApp />*/}
        {/*<MediapipeApp />*/}
        <PixelCharacterRenderer />
    </React.StrictMode>,
    rootElement
);
