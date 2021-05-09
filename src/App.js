import React, {useEffect, useRef, useState} from "react";
import {defer, forkJoin, from, interval} from "rxjs";
import ReactDOM from "react-dom";
import * as tf from "@tensorflow/tfjs-core";
import {
    drawFaceContour,
    drawIrises,
    drawPathToCanvas,
    ellipsing,
    loadDetectionModel, scatterKeyPoints, showFaceFuncs
} from "./tfjs/estimator";
import {filter, mergeMap, repeatWhen, switchMap} from "rxjs/operators";
// import Checkbox from "react-checkbox";
import {
    FaceMesh, FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_LIPS,
    FACEMESH_RIGHT_EYE,
    FACEMESH_RIGHT_EYEBROW,
    FACEMESH_TESSELATION,
    Results
} from "@mediapipe/face_mesh";
import {drawConnectors} from "@mediapipe/drawing_utils";
import PixelCharacterRenderer, {drawTraits, initializeCanvas, loadImages} from "./renderer/pixel";


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


const defaultVideoConstraints = {
    'audio': false,
    'video': {
        facingMode: 'user',
        width: WIDTH,
        height: HEIGHT
    }
}


const getMedia = (webcamRef) => {
    from(
        navigator.mediaDevices.getUserMedia(defaultVideoConstraints)
    )
    .subscribe({
        next: (stream) => {
            webcamRef.current.srcObject = stream
            webcamRef.current.msHorizontalMirror = true
            webcamRef.current.play()
        },
        error: err => console.error(err)
    })
}

const estimateFaceContour = (webcamRef, model, config) => {
    const canvas = document.getElementById('output')

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

    const webcamRef = useRef()
    const canvasRef = useRef()
    const imagesRef = useRef([])

    const [preLoaded, setPreLoaded] = useState(false)
    // const [videoLoaded, setVideoLoaded] = useState(false)
    const [config, setConfig] = useState(baseConfig)
    const [location, setLocation] = useState({x: 0, y: 0})

    // const model = loadDetectionModel(config.maxFaces);
    const faceMesh = new FaceMesh()
    console.log(faceMesh)
    faceMesh.setOptions({
        selfieMode: false,
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    // faceMesh.onResults(onResults);

    // const handleChange = (event) => {
    //     setConfig({...config, [event.target.name] : event.target.checked });
    // }
    //
    // const checkBoxes = [
    //     {
    //         name: 'triangulateMesh',
    //         key: 'triangulateMesh',
    //         label: 'Triangulate Mesh',
    //     },
    //     {
    //         name: 'predictIrises',
    //         key: 'predictIrises',
    //         label: 'Predict Irises',
    //     }
    // ];

    const handleCanvasClick = (e) => {
        setLocation({ x: e.clientX, y: e.clientY })
    }

    /** Preprocessing **/
    useEffect(
        () => {
            // from(tf.setBackend(config.backend))
            //     .subscribe(() => setPreLoaded(true))

            getMedia(webcamRef)
            loadImages(imagesRef)
        },
        []
    )

    useEffect(
        () => {
            if (!webcamRef.current || !canvasRef.current || !imagesRef.current)
                return

            from(faceMesh.send({image: webcamRef.current}))
                .subscribe( results =>
                    console.log(`RESULT: ${results}`)
                )

            console.log(location)
            forkJoin(imagesRef.current)
                .subscribe({
                    next: images => drawTraits(images, location, canvasRef.current),
                    error: err => console.error(err)
                });

            // const intervalInMilli = Math.round(1000 / config.fps);
            //
            // console.log(`Start to subscribe`);
            // const subscription = interval(intervalInMilli)
            //     .pipe(
            //         mergeMap(() => faceMesh.send({image: webcamRef.current}))
            //         // mergeMap(() => faceMesh.estimateFaces({
            //         //     input: webcamRef.current,
            //         //     returnTensors: false,
            //         //     flipHorizontal: false,
            //         //     predictIrises: config.predictIrises
            //         // }))
            //     )
            //     .subscribe(
            //         (result) => {
            //             console.log(result);
            //             console.log('a');
            //             onResults(result);
            //             //estimateFaceContour(webcamRef, model, config);
            //             console.log('b');
            //         }
            //     );
            // return () => {
            //     subscription.unsubscribe();
            //     console.log("unsubscribed");
            // }

        },
        [location, config]
    );

    return (
        <div className="container">
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth /2}
                    height={window.innerHeight / 2}
                    onClick={handleCanvasClick}
                    className="pixel-canvas"
                />
                <video
                    ref={webcamRef}
                    width={window.innerWidth /2}
                    height={window.innerHeight / 2}
                    className="webcam"
                />
            </div>
        </div>
    );
}

export default NewApp;
