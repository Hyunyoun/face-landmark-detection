import {Coord3D} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import {MESH_ANNOTATIONS} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints";
import {distance} from "./meshUtilities";


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


const drawParts = (keyPoints: Coord3D[], context: CanvasRenderingContext2D, color: string) => {
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