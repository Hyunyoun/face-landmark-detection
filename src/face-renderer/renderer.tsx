
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

import {TRIANGULATION} from './triangulation';
import {distance, drawPath} from "./meshUtilities";
import {ScatterGL} from "scatter-gl";
import {Coord2D, Coord3D} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import {AnnotatedPrediction} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import {MESH_ANNOTATIONS} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints";
import {eye} from "@tensorflow/tfjs-core";


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


const drawTriangulateMesh = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, color: string) => {
    context.strokeStyle = color;
    context.lineWidth = 0.5;

    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        const points = [
            TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1], TRIANGULATION[i * 3 + 2]
        ].map(index => keyPoints[index]);

        drawPath(context, points, true);
    }
}

export const randomData = () => {
    const a: Coord3D[] = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12]
    ]
    return a;
}


const drawKeyPoints = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, color: string) => {
    context.fillStyle = color;
    for (let i = 0; i < NUM_KEYPOINTS; i++) {
        const x = keyPoints[i][0];
        const y = keyPoints[i][1];

        let radius = 1;
        context.beginPath();
        context.arc(x, y, radius /* radius */, 0, 2 * Math.PI);
        context.fill();
    }

    // Left Eyelid
    const leftUpperEyeKeyPoints = MESH_ANNOTATIONS.leftEyeUpper0.map(i => keyPoints[i]);
    drawParts(leftUpperEyeKeyPoints, context, RED);
    const leftLowerEyeKeyPoints = MESH_ANNOTATIONS.leftEyeLower0.map(i => keyPoints[i]);
    drawParts(leftLowerEyeKeyPoints, context, RED);

    // Right Eyelid
    const rightUpperEyeKeyPoints = MESH_ANNOTATIONS.rightEyeUpper0.map(i => keyPoints[i]);
    drawParts(rightUpperEyeKeyPoints, context, RED);
    const rightLowerEyeKeyPoints = MESH_ANNOTATIONS.rightEyeLower0.map(i => keyPoints[i]);
    drawParts(rightLowerEyeKeyPoints, context, RED);


}

export const drawParts = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, color: string) => {
    context.fillStyle = color;
    for (let i = 0; i < keyPoints.length; i++) {
        const x = keyPoints[i][0];
        const y = keyPoints[i][1];

        let radius = 1.5;
        context.beginPath();
        context.arc(x, y, radius /* radius */, 0, 2 * Math.PI);
        context.fill();
    }
}


export const drawFaceContour = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, state: State) => {
    const color = BLUE;
    if (state.triangulateMesh)
        drawTriangulateMesh(keyPoints, context, color);
    else
        drawKeyPoints(keyPoints, context, color);
}


const drawIris = (keyPoints: Coord3D[], context: CanvasRenderingContext2D) => {
    const center = keyPoints[0];
    const diameterY = distance(keyPoints[4], keyPoints[2]);
    const diameterX = distance(keyPoints[3], keyPoints[1]);

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
    const leftIrisPoints = keyPoints.slice(NUM_KEYPOINTS, NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS);
    drawIris(leftIrisPoints, context);
    // draw right iris
    const rightIrisPoints = keyPoints.slice(NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS, NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS);
    drawIris(rightIrisPoints, context);
}


const isEyeBlink = (keyPoints: Coord3D[], side: string) => {
    let lowerEyePoints: Coord3D[];
    let upperEyePoints: Coord3D[];
    let irisPoints: Coord3D[];
    if (side === 'left') {
        upperEyePoints = MESH_ANNOTATIONS.leftEyeUpper0.map(i => keyPoints[i]).slice(2, 6);
        lowerEyePoints = MESH_ANNOTATIONS.leftEyeLower0.map(i => keyPoints[i]).slice(3, 7);
        irisPoints = keyPoints.slice(NUM_KEYPOINTS, NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS);
    } else {
        upperEyePoints = MESH_ANNOTATIONS.rightEyeUpper0.map(i => keyPoints[i]).slice(2, 6);
        lowerEyePoints = MESH_ANNOTATIONS.rightEyeLower0.map(i => keyPoints[i]).slice(3, 7);
        irisPoints = keyPoints.slice(NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS, NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS);
    }

    let eyelidDiff = 0;
    for (let i = 0; i < upperEyePoints.length; i++) {
        eyelidDiff += (lowerEyePoints[i][1] - upperEyePoints[i][1]) / upperEyePoints.length;
    }
    const irisRadius = 0.5 * distance(irisPoints[4], irisPoints[2]);
    return (eyelidDiff < 0.8 * irisRadius);
}


const isLeftEyeBlink = (keyPoints: Coord3D[]) => {
    return isEyeBlink(keyPoints, 'left');
}


const isRightEyeBlink = (keyPoints: Coord3D[]) => {
    return isEyeBlink(keyPoints, 'right');
}


export const showFaceFuncs = (
    keyPoints: Coord3D[],
    boundingBox: {topLeft: Coord2D, bottomRight: Coord2D},
    context: CanvasRenderingContext2D
) => {
    context.font = '20px Arial';

    const relativeXPos = Math.round((0.5 * (boundingBox.topLeft[0] + boundingBox.bottomRight[0]) - 300) / 15);
    context.fillText(`Position: ${relativeXPos}`, 250, 500);

    if (keyPoints.length < NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS)
        return;

    let status = '';
    if (isLeftEyeBlink(keyPoints))
        status = 'Blinked';
    else
        status = 'Open';
    context.fillText(`Left Eye ${status}`, 400, 400);
    if (isRightEyeBlink(keyPoints))
        status = 'Blinked';
    else
        status = 'Open';
    context.fillText(`Right Eye ${status}`, 100, 400);

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