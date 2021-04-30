import React, {useEffect, useState} from "react";
import ReactDOM from "react-dom";
import App from "./App";
import Observe from "./ObserverTest";

const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        {/*<Observe />*/}
        <App />
    </React.StrictMode>,
    rootElement
);

