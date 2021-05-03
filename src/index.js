/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import {gui as dat} from "dat.gui";
import {forkJoin, from} from "rxjs";
import {filter, mergeMap} from "rxjs/operators";
import {ScatterGL} from "scatter-gl";
import {
    streamVideo,
    drawIrises,
    scatterKeyPoints,
    loadDetectionModel,
    drawFaceContour, drawParts
} from "./face-renderer/renderer";
import {isMobile} from "./face-renderer/utils";
import {MESH_ANNOTATIONS} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints";

require('@tensorflow/tfjs-backend-webgl');


const GREEN = '#32EEDB';
// const RED = "#FF2C35";
// const BLUE = "#157AA0";

let model, video, canvas, scatterGL, rafID;

const VIDEO_SIZE = 600;
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = (isMobile() === false);


const state = {
    backend: 'webgl',
    maxFaces: 1,
    triangulateMesh: true,
    predictIrises: true,
    renderPointcloud: renderPointcloud,
    scatterGLHasInitialized: false
}


const setupDatGui = () => {
    const gui = new dat.GUI();

    const updateBackend = (backend) => {
        window.cancelAnimationFrame(rafID);
        from(tf.setBackend(backend))
            .subscribe(requestAnimationFrame(renderPrediction));
    }
    gui.add(state, 'backend', ['webgl'])
        .onChange(updateBackend);

    gui.add(state, 'maxFaces', 1, 20, 1)
        .onChange(loadDetectionModel);
    // gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
    //   model = await loadDetectionModel(val);
    // });

    gui.add(state, 'triangulateMesh');

    gui.add(state, 'predictIrises');

    const updateScatterDisplay = render => {
        document.querySelector('#scatter-gl-container').style.display = render ? 'inline-block' : 'none';
    }
    if (state.renderPointcloud) {
        gui.add(state, 'renderPointcloud')
            .onChange(updateScatterDisplay);
    }
}


const initializeVideo = () => {
    video = document.getElementById('video');
    const mobile = isMobile()

    const videoConstraints = {
        'audio': false,
        'video': {
            facingMode: 'user',
            width: mobile ? undefined : VIDEO_SIZE,
            height: mobile ? undefined : VIDEO_SIZE
        }
    }

    from(navigator.mediaDevices.getUserMedia(videoConstraints))
        .subscribe(stream => {
            video.srcObject = stream;
            console.log("attached stream to video.");
        });

    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video)
    });
}


const setupVideoCanvas = (videoElement) => {
    canvas = document.getElementById('output');
    canvas.width = 2 * videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const canvasContainer = document.querySelector('.canvas-wrapper');
    canvasContainer.style = `width: ${videoElement.videoWidth}px; height: ${videoElement.videoHeight}px`;

    const context = canvas.getContext('2d');
    context.translate(video.videoWidth, 0);
    // context.translate(0.5*videoElement.videoWidth, 0);
}


const startVideoStream = (videoElement) => {
    videoElement.play();
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    videoElement.width = videoWidth;
    videoElement.height = videoHeight;
}


const setupScatterCanvas = () => {
    document.querySelector('#scatter-gl-container').style =
        `width: ${VIDEO_SIZE}px; height: ${VIDEO_SIZE}px;`;

    scatterGL = new ScatterGL(
        document.querySelector('#scatter-gl-container'),
        {'rotateOnStart': false, 'selectEnabled': false});
}


const renderPrediction = () => {
    const faceConfig = {
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: state.predictIrises
    }

    // console.log((new Date()).getMilliseconds()); // NEED TO REMOVE.

    from(model).pipe(
        mergeMap(result => result.estimateFaces(faceConfig)),
        filter(predictions => predictions.length > 0)
    )
        .subscribe(predictions => {
            const context = canvas.getContext('2d');
            context.fillStyle = GREEN;
            context.fillRect(0, 0, 600, 600);

            /** stream the video **/
            streamVideo(video, context);

            /** draw key points based mesh image if needed **/
            predictions.forEach(prediction => {
                const keyPoints = prediction.scaledMesh;
                drawFaceContour(keyPoints, context, state);
                // drawParts(keyPoints[MESH_ANNOTATIONS.leftEyeUpper0], context);
                drawIrises(keyPoints, context);
            });

            /** scatter key points in 3D-axis layer if needed  **/
            scatterKeyPoints(predictions, state, scatterGL);
        });

    rafID = requestAnimationFrame(renderPrediction);
};


const MainCamera = () => {
    setupDatGui();

    from(
        forkJoin(
            [tf.setBackend(state.backend), initializeVideo()]
        )
    ).subscribe(() => {
        setupVideoCanvas(video);
        startVideoStream(video);
        model = loadDetectionModel(state.maxFaces);
        renderPrediction();

        if (state.renderPointcloud)
            setupScatterCanvas();
    });
}

window.onload = MainCamera;
