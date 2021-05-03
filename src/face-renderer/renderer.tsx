
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import {TRIANGULATION} from './triangulation';
import {distance, drawPath} from "./meshUtilities";
import {ScatterGL} from "scatter-gl";
import {Coord3D} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import {AnnotatedPrediction} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import {MESH_ANNOTATIONS} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints";


const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = '#32EEDB';
const RED = "#FF2C35";
const BLUE = "#157AB3";


type State = {
    backend: string,
    maxFaces: number,
    triangulateMesh: boolean,
    predictIrises: boolean,
    renderPointcloud: boolean,
    scatterGLHasInitialized: boolean
};


export const loadDetectionModel = (maxFaces: number) => {
    return faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        {maxFaces: maxFaces}
    );
}


export const streamVideo = (videoElement: HTMLVideoElement, context: CanvasRenderingContext2D) => {
    context.drawImage(
        videoElement,
        0, 0, videoElement.videoWidth, videoElement.videoHeight,
        -videoElement.videoWidth, 0, videoElement.videoWidth, videoElement.videoHeight  // canvas.width, canvas.height)
    )
}


const drawTriangulateMesh = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    context.strokeStyle = BLUE;
    context.lineWidth = 0.5;

    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        const points = [
            TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]
        ].map(index => keyPoints[index]);

        drawPath(context, points, true);
    }
}


const drawKeyFacePoints = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    context.fillStyle = BLUE;
    for (let i = 0; i < NUM_KEYPOINTS; i++) {
        context.fillStyle = BLUE;
        const x = keyPoints[i][0];
        const y = keyPoints[i][1];

        let radius = 1;
        context.beginPath();
        context.arc(x, y, radius /* radius */, 0, 2 * Math.PI);
        context.fill();
    }
}

export const drawParts = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    context.fillStyle = RED;
    for (let i = 0; i < NUM_KEYPOINTS; i++) {
        context.fillStyle = BLUE;
        const x = keyPoints[i][0];
        const y = keyPoints[i][1];

        let radius = 2;
        context.beginPath();
        context.arc(x, y, radius /* radius */, 0, 2 * Math.PI);
        context.fill();
    }
}


export const drawFaceContour = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, state: State) => {
    if (state.triangulateMesh)
        drawTriangulateMesh(keyPoints, context);
    else {
        drawKeyFacePoints(keyPoints, context);
    }
}

// if (MESH_ANNOTATIONS.leftEyeUpper0.includes(i) || MESH_ANNOTATIONS.leftEyeLower0.includes(i)) {
//     radius = 2;
//     context.fillStyle = RED;
// }


const drawIris = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, indexStart: number) => {
    const center = keyPoints[indexStart];
    const diameterY = distance(
        keyPoints[indexStart + 4],
        keyPoints[indexStart + 2]);
    const diameterX = distance(
        keyPoints[indexStart + 3],
        keyPoints[indexStart + 1]);

    context.beginPath();
    context.ellipse(center[0], center[1], diameterX / 2, diameterY / 2, 0, 0, 2 * Math.PI);
    context.stroke();
}


export const drawIrises = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    if (keyPoints.length < NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS)
        return;

    context.strokeStyle = RED;
    context.lineWidth = 1;

    // draw left iris
    drawIris(keyPoints, context, NUM_KEYPOINTS);
    // draw left iris
    drawIris(keyPoints, context, NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS);
}

// const drawEyelid = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
//     keyPoints[MESH_ANNOTATIONS.rightEyeUpper0]
// }

export const scatterKeyPoints = (predictions: AnnotatedPrediction[], state: State, scatterGL: ScatterGL) => {
    if (!state.renderPointcloud || scatterGL == null)
        return;

    const pointsData = predictions.map(prediction => {
        let scaledMesh = prediction.scaledMesh;
        // @ts-ignore
        return scaledMesh.map((point: Coord3D) => ([-point[0], -point[1], -point[2]]));
    });

    let flattenedPointsData: any[] = [];
    for (let i = 0; i < pointsData.length; i++) {
        flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
    }
    const dataset = new ScatterGL.Dataset(flattenedPointsData);

    if (!state.scatterGLHasInitialized) {
        scatterGL.setPointColorer((i) => {
            if(i % (NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS * 2) > NUM_KEYPOINTS)
                return RED;
            return BLUE;
        });
        scatterGL.render(dataset);
    } else {
        scatterGL.updateDataset(dataset);
    }
    state.scatterGLHasInitialized = true;
}