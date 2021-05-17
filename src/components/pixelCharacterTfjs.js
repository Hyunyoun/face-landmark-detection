import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs-core";
import {combineLatest, from, interval} from 'rxjs';
import {filter, mergeMap} from 'rxjs/operators';
import {drawTraits, getFaceInfo, loadImages} from "../utils/pixelCharacterRenderer";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

require('@tensorflow/tfjs-backend-webgl');


const setBackend = (backendName, backendRef) => {
    from(tf.setBackend(backendName))
        .subscribe(backend => backendRef.current = backend)
}


const loadTFModel = (maxFaces) => {
    return from(faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        {maxFaces: maxFaces}
    ))
}


const getMedia = (webcamRef, setFunc) => {
    const defaultVideoConstraints = {
        'audio': false,
        'video': {
            facingMode: 'user',
        }
    }
    from(navigator.mediaDevices.getUserMedia(defaultVideoConstraints))
        .subscribe({
            next: (stream) => {
                webcamRef.current.srcObject = stream
                // webcamRef.current.msHorizontalMirror = true
                webcamRef.current.play()
                webcamRef.current.style.display = "none"
                setFunc(true)

            },
            error: err => console.error(err)
        })
}

const getModelConfig = (webcamObject) => {
    return {
        input: webcamObject,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: true
    }
}


const PixelCharacterTfjs = () => {
    const backendRef = useRef(null)
    const webcamRef = useRef(null)
    const canvasRef = useRef(null)
    const imagesRef = useRef([])

    const [webcamLoaded, setWebcamLoaded] = useState(false)

    const modelObservable = loadTFModel(1);

    // const handleCanPlay = () => {
    //     webcamRef.current.play()
    //     setWebcamLoaded(true)
    // }

    /** Preprocessing **/
    useEffect(
        () => {
            setBackend('webgl', backendRef)
            loadImages(imagesRef)
            getMedia(webcamRef, setWebcamLoaded)
        },
        []
    )

    useEffect(
        () => {
            if (!webcamLoaded || !backendRef.current || !modelObservable)
                return

            const fps = 30
            combineLatest([interval(Math.round(1000/fps)), modelObservable])
                .pipe(
                    mergeMap(([_, model]) => model.estimateFaces(getModelConfig(webcamRef.current))),
                    filter(predictions => predictions.length > 0)
                ).subscribe({
                next: predictions => {
                    predictions.forEach(
                        newPrediction => {
                            const faceInfo = getFaceInfo(newPrediction)
                            drawTraits(imagesRef.current, faceInfo, canvasRef.current)
                        }
                    )
                },
                error: err => console.error(err),
                complete: () => {}
            })
        },
        [webcamLoaded]
    )

    return (
        <div className="container">
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className="pixel-canvas"
                />
                <video
                    ref={webcamRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    // onCanPlay={handleCanPlay}
                    className="webcam"
                />
            </div>
        </div>
    );
}

export default PixelCharacterTfjs;

