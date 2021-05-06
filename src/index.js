import React, {useEffect, useRef, useState} from "react";
import {defer, from, interval} from "rxjs";
import ReactDOM from "react-dom";
import * as tf from "@tensorflow/tfjs-core";
import {
    drawFaceContour,
    drawIrises,
    drawPathToCanvas,
    ellipsing,
    loadDetectionModel, scatterKeyPoints, showFaceFuncs
} from "./face-renderer/renderer";
import {filter, mergeMap, repeatWhen, switchMap} from "rxjs/operators";
import Checkbox from "react-checkbox";
import {
    FaceMesh, FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_LIPS,
    FACEMESH_RIGHT_EYE,
    FACEMESH_RIGHT_EYEBROW,
    FACEMESH_TESSELATION,
    Results
} from "@mediapipe/face_mesh";
import {drawConnectors} from "@mediapipe/drawing_utils";
import PixelPart from "./pixel";


require('@tensorflow/tfjs-backend-webgl');


const onResults = (results) => {
    const canvasElement = document.getElementById('output');
    const canvasCtx = canvasElement.getContext('2d');

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
            drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
            drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
        }
    }
    canvasCtx.restore();
}



const GREEN = '#32EEDB';

const WIDTH = 1280;
const HEIGHT = 720;


// const state = {
//     backend: 'webgl',
//     maxFaces: 1,
//     triangulateMesh: true,
//     predictIrises: true,
//     renderPointcloud: true,
//     scatterGLHasInitialized: false
// }


const defaultVideoConstraints = {
    'audio': false,
    'video': {
        facingMode: 'user',
        width: WIDTH,
        height: HEIGHT
    }
}


const getMedia = (webcamRef, setFunc) => {
    from(
        navigator.mediaDevices.getUserMedia(defaultVideoConstraints)
    )
    .subscribe({
        next: (stream) => {
            webcamRef.current.srcObject = stream;
            webcamRef.current.play();
            setFunc(true);
        },
        error: err => {
            console.error(err);
        }
    });
}

const setupCanvas = () => {
    const canvasContainer = document.querySelector('.canvas-wrapper');
    canvasContainer.style = `width: ${defaultVideoConstraints.video.width}px; height: ${defaultVideoConstraints.video.width}px`;

    const canvas = document.getElementById('output');
    canvas.width = defaultVideoConstraints.video.width;
    canvas.height = defaultVideoConstraints.video.height;

    const context = canvas.getContext('2d');
    context.fillStyle = GREEN;
    context.fillRect(0, 0, 100, 100);
}


const estimateFaceContour = (webcamRef, model, config) => {
    const canvas = document.getElementById('output');

    const faceConfig = {
        input: webcamRef.current,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: config.predictIrises
    }

    from(model).pipe(
        mergeMap(result => result.estimateFaces(faceConfig)),
        filter(predictions => predictions.length > 0)
    )
        .subscribe(predictions => {
            const context = canvas.getContext('2d');
            context.fillStyle = GREEN;
            context.fillRect(0, 0, WIDTH, HEIGHT);

            /** draw key points based mesh image if needed **/
            predictions.forEach(prediction => {
                console.log(prediction.scaledMesh.length);
                const mesh = prediction.mesh;
                const box = prediction.boundingBox;
                const keyPoints = prediction.scaledMesh;
                drawFaceContour(keyPoints, context, config);
                drawIrises(keyPoints, context);
                showFaceFuncs(keyPoints, box, context);
            });

            // /** scatter key points in 3D-axis layer if needed  **/
            // scatterKeyPoints(predictions, state, scatterGL);
        });

    // rafID = requestAnimationFrame(renderPrediction);
};


const NewApp = () => {
    let baseConfig = {
        backend: 'webgl',
        maxFaces: 1,
        fps: 2,
        triangulateMesh: false,
        predictIrises: true,
        renderPointcloud: true,
        scatterGLHasInitialized: false
    }
    const [preLoaded, setPreLoaded] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [config, setConfig] = useState(baseConfig);

    const webcamRef = useRef(null);

    // const model = loadDetectionModel(config.maxFaces);
    const faceMesh = new FaceMesh();

    faceMesh.setOptions({
        selfieMode: false,
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    // faceMesh.onResults(onResults);

    const handleChange = (event) => {
        setConfig({...config, [event.target.name] : event.target.checked });
    }

    const checkBoxes = [
        {
            name: 'triangulateMesh',
            key: 'triangulateMesh',
            label: 'Triangulate Mesh',
        },
        {
            name: 'predictIrises',
            key: 'predictIrises',
            label: 'Predict Irises',
        }
    ];

    /** Preprocessing **/
    useEffect(
        () => {
            from(tf.setBackend(config.backend))
                .subscribe(() => setPreLoaded(true));

            setupCanvas();
            console.log(`Setup Canvas`);
        },
        []
    );

    useEffect(
        () => {
            if (!preLoaded)
                return;

            getMedia(webcamRef, setVideoLoaded);
            console.log(`Video On!`);
        },
        [preLoaded]
    );

    useEffect(
        () => {
            if (!videoLoaded)
                return;

            const intervalInMilli = Math.round(1000 / config.fps);

            console.log(`Start to subscribe`);
            const subscription = interval(intervalInMilli)
                .pipe(
                    mergeMap(() => faceMesh.send({image: webcamRef.current.src}))
                    // mergeMap(() => faceMesh.estimateFaces({
                    //     input: webcamRef.current,
                    //     returnTensors: false,
                    //     flipHorizontal: false,
                    //     predictIrises: config.predictIrises
                    // }))
                )
                .subscribe(
                    (result) => {
                        console.log(result);
                        console.log('a');
                        onResults(result);
                        //estimateFaceContour(webcamRef, model, config);
                        console.log('b');
                    }
                );
            return () => {
                subscription.unsubscribe();
                console.log("unsubscribed");
            }

        },
        [videoLoaded, config]
    );

    // useEffect(() => {
    //     console.log("checkedItems: ", config);
    // }, [config]);

    return (
        <div className="container">
            {/*<Checkbox name="triangulateMesh" checked={checkedItems["triangulateMesh"]} onChange={handleChange}/>*/}
            {/*<Checkbox name="predictIrises" checked={checkedItems["predictIrises"]} onChange={handleChange}/>*/}
            {/*<p>FPS</p>*/}
            {/*<input type="range" min="2" max="20" step="2" value={config.fps} className="slider" id="fpsRange" onChange={handleChange} />*/}
            {/*<p />*/}

            <div className="canvas-wrapper">
                <video id='webcam' ref={webcamRef} />
                <canvas id='output'/>
            </div>
        </div>
    );
}

//
// const CheckboxExample = () => {
//     const [checkedItems, setCheckedItems] = useState({}); //plain object as state
//
//     const handleChange = (event) => {
//         // updating an object instead of a Map
//         setCheckedItems({...checkedItems, [event.target.name] : event.target.checked });
//     }
//
//     useEffect(() => {
//         console.log("checkedItems: ", checkedItems);
//     }, [checkedItems]);
//
//     const checkboxes = [
//         {
//             name: 'check-box-1',
//             key: 'checkBox1',
//             label: 'Check Box 1',
//         },
//         {
//             name: 'check-box-2',
//             key: 'checkBox2',
//             label: 'Check Box 2',
//         }
//     ];
//
//
//     return (
//         <div>
//             <lable>Checked item name : {checkedItems["check-box-1"]} </lable> <br/>
//             {
//                 checkboxes.map(item => (
//                     <label key={item.key}>
//                         {item.name}
//                         <Checkbox name={item.name} checked={checkedItems[item.name]} onChange={handleChange} />
//                     </label>
//                 ))
//             }
//         </div>
//     );
// }


export default NewApp;


const rootElement = document.getElementById("cameraRoot");
ReactDOM.render(
    <React.StrictMode>
        {/*<CheckboxExample />*/}
        <NewApp />
        <PixelPart />
    </React.StrictMode>,
    rootElement
);
