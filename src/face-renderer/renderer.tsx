
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import {TRIANGULATION} from './triangulation';
import {distance, drawPath} from "./meshUtilities";
import {ScatterGL} from "scatter-gl";
import {Coord3D} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import {AnnotatedPrediction} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";


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


export const streamVideo = (videoElement: HTMLVideoElement, context: CanvasRenderingContext2D, canvas: HTMLVideoElement) => (
    context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, canvas.width, canvas.height)
)


export const drawPathToCanvas = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, state: State) => {
    if (state.triangulateMesh) {
        context.strokeStyle = GREEN;
        context.lineWidth = 0.5;

        for (let i = 0; i < TRIANGULATION.length / 3; i++) {
            const points = [
                TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]
            ].map(index => keyPoints[index]);

            drawPath(context, points, true);
        }
    } else {
        context.fillStyle = GREEN;

        for (let i = 0; i < NUM_KEYPOINTS; i++) {
            const x = keyPoints[i][0];
            const y = keyPoints[i][1];

            context.beginPath();
            context.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
            context.fill();
        }
    }
}


export const ellipsing = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    if (keyPoints.length <= NUM_KEYPOINTS)
        return;

    context.strokeStyle = RED;
    context.lineWidth = 1;

    const leftCenter = keyPoints[NUM_KEYPOINTS];
    const leftDiameterY = distance(
        keyPoints[NUM_KEYPOINTS + 4],
        keyPoints[NUM_KEYPOINTS + 2]);
    const leftDiameterX = distance(
        keyPoints[NUM_KEYPOINTS + 3],
        keyPoints[NUM_KEYPOINTS + 1]);

    context.beginPath();
    context.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
    context.stroke();

    if (keyPoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
        const rightCenter = keyPoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
        const rightDiameterY = distance(
            keyPoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
            keyPoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
        const rightDiameterX = distance(
            keyPoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
            keyPoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

        context.beginPath();
        context.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
        context.stroke();
    }
}


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