import React, {useEffect, useRef, useState} from "react";
import * as ReactDOM from "react-dom";
import NewApp from "./App";
import TfjsApp from "./TfjsApp";
// import PixelCharacterRenderer from "./renderer/pixel";


const rootElement = document.getElementById("cameraRoot");
ReactDOM.render(
    <React.StrictMode>
        {/*<CheckboxExample />*/}
        <TfjsApp />
        {/*<NewApp />*/}
        {/*<PixelCharacterRenderer />*/}
    </React.StrictMode>,
    rootElement
);
