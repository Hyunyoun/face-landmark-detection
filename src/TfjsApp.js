import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs-core";
import {from, Subject} from 'rxjs';
import {filter, mergeMap} from 'rxjs/operators';
import {loadDetectionModel} from "./tfjs/estimator";
import {drawTraits, loadImages} from "./renderer/pixel";

require('@tensorflow/tfjs-backend-webgl');


const setBackend = (backendName, backendRef) => {
    from(tf.setBackend(backendName))
        .subscribe(backend => backendRef.current = backend)
}


const getMedia = (webcamRef) => {
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


const TfjsApp = () => {
    const backendRef = useRef(null)
    const webcamRef = useRef(null)
    const canvasRef = useRef(null)
    const imagesRef = useRef([])

    const [webcamLoaded, setWebcamLoaded] = useState(false)
    const [prediction, setPrediction] = useState(null)

    const model = loadDetectionModel(1);

    // const subject = Subject(webcamRef.current)

    const handleCanPlay = () => {
        webcamRef.current.play()
        setWebcamLoaded(true)
    }

    /** Preprocessing **/
    useEffect(
        () => {
            setBackend('webgl', backendRef)
            loadImages(imagesRef)
            getMedia(webcamRef)
        },
        []
    )

    /** Re-draw character when face prediction values are updated **/
    useEffect(
        () => {
            if (!canvasRef.current || !imagesRef.current || !prediction)
                return
            drawTraits(imagesRef.current, prediction, canvasRef.current)
        },
        [prediction]
    )

    const getPredictions = () => {
        if (!webcamLoaded || !backendRef.current)
            return

        const subscription = from(model)
            .pipe(
                mergeMap(result => result.estimateFaces(getModelConfig(webcamRef.current))),
                filter(predictions => predictions.length > 0)
            ).subscribe({
            next: predictions => {
                predictions.forEach(newPrediction => setPrediction(newPrediction))
            },
            error: err => console.error(err),
            complete: () => {}
        })

        return () => subscription.unsubscribe()
    }

    console.log("PRE")
    getPredictions()

    return (
        <div className="container">
            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth / 2}
                    height={window.innerHeight / 2}
                    className="pixel-canvas"
                />
                <video
                    ref={webcamRef}
                    // currentTime={handleCurrentTime}
                    width={window.innerWidth / 2}
                    height={window.innerHeight / 2}
                    onCanPlay={handleCanPlay}
                    className="webcam"
                />
            </div>
        </div>
    );
}

export default TfjsApp;

