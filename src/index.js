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
import {from, timer} from "rxjs";
import {delay, filter, map, mergeMap, switchMap} from "rxjs/operators";
import {ScatterGL} from "scatter-gl";
import {streamVideo, drawPathToCanvas, ellipsing, scatterKeyPoints, loadDetectionModel} from "./face-renderer/renderer";
import {useState} from "react";

require('@tensorflow/tfjs-backend-webgl');


const GREEN = '#32EEDB';
const RED = "#FF2C35";
const BLUE = "#157AA0";

function isMobile() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isAndroid || isiOS;
}

let model, ctx, video, canvas, scatterGL, rafID;

const VIDEO_SIZE = 600;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = mobile === false;

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

    const changeBackend = (backend) => {
        window.cancelAnimationFrame(rafID);
        from(tf.setBackend(backend))
            .subscribe(requestAnimationFrame(renderPrediction));
    }
    gui.add(state, 'backend', ['webgl'])
        .onChange(changeBackend);

    gui.add(state, 'maxFaces', 1, 20, 1)
        .onChange(loadDetectionModel);
    // gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
    //   model = await loadDetectionModel(val);
    // });

    gui.add(state, 'triangulateMesh');

    gui.add(state, 'predictIrises');

    if (state.renderPointcloud) {
        gui.add(state, 'renderPointcloud')
            .onChange(render => {
                document.querySelector('#scatter-gl-container').style.display =
                    render ? 'inline-block' : 'none';
            });
    }
}


const setupCamera = () => {
    video = document.getElementById('video');

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

const startVideoStream = () => {
    video.play();
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;
}


const setupScatterCanvas = (videoElement) => {
    canvas = document.getElementById('output');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const canvasContainer = document.querySelector('.canvas-wrapper');
    canvasContainer.style = `width: ${videoElement.videoWidth}px; height: ${videoElement.videoHeight}px`;

    ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = GREEN;
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 0.5;

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

    console.log((new Date()).getMilliseconds()); // NEED TO REMOVE.

    from(model).pipe(
        mergeMap(result => result.estimateFaces(faceConfig)),
        filter(result => result.length > 0)
    )
        .subscribe(predictions => {
            /** stream the video **/
            streamVideo(video, ctx, canvas);

            /** draw key points based mesh image if needed **/
            predictions.forEach(prediction => {
                const keyPoints = prediction.scaledMesh;
                drawPathToCanvas(keyPoints, ctx, state);
                ellipsing(keyPoints, ctx);
            });

            /** scatter key points in 3D-axis layer if needed  **/
            scatterKeyPoints(predictions, state, scatterGL);
        });

    rafID = requestAnimationFrame(renderPrediction);
};


const main = async () =>  {
    await tf.setBackend(state.backend);
    setupDatGui();

    console.log("Start to setup camera.");
    const completed = setupCamera();

    from(completed)
        .subscribe(() => {
            startVideoStream();
            model = loadDetectionModel(state.maxFaces);
            renderPrediction();

            if (state.renderPointcloud)
                setupScatterCanvas(video);
        });
}


main();



