import React from "react";
import * as ReactDOM from "react-dom";
// import MediapipeApp from "./App";
import TfjsApp from "./TfjsApp";
import BackgroundApp from "./components/background";


const rootElement = document.getElementById("cameraRoot");
ReactDOM.render(
    <React.StrictMode>
        <TfjsApp />
        {/*<MediapipeApp />*/}
        <BackgroundApp />
    </React.StrictMode>,
    rootElement
);
