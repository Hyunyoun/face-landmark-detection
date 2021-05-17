
import {distance} from "./meshUtilities";
import {Coord3D} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";
import {MESH_ANNOTATIONS} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/keypoints";


const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;


const isEyeBlink = (keyPoints: Coord3D[], side: string) => {
    if (keyPoints.length < NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS)
        return false

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
        eyelidDiff += distance(lowerEyePoints[i], upperEyePoints[i]) / upperEyePoints.length;
    }
    const irisRadius = 0.5 * distance(irisPoints[4], irisPoints[2]);
    return (eyelidDiff < 0.8 * irisRadius);
}


export const isLeftEyeBlink = (keyPoints: Coord3D[]) => {
    return isEyeBlink(keyPoints, 'left');
}


export const isRightEyeBlink = (keyPoints: Coord3D[]) => {
    return isEyeBlink(keyPoints, 'right');
}

export const getEyePosition = (keyPoints: Coord3D[], side: string) => {
    if (keyPoints.length < NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS)
        return 0

    let lowerEyePoints: Coord3D[];
    let irisPoints: Coord3D[];
    if (side === 'left') {
        lowerEyePoints = MESH_ANNOTATIONS.leftEyeLower0.map(i => keyPoints[i]);
        irisPoints = keyPoints.slice(NUM_KEYPOINTS, NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS);
    } else {
        lowerEyePoints = MESH_ANNOTATIONS.rightEyeLower0.map(i => keyPoints[i]);
        irisPoints = keyPoints.slice(NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS, NUM_KEYPOINTS + 2 * NUM_IRIS_KEYPOINTS);
    }

    return (distance(lowerEyePoints[0], irisPoints[0]) / distance(lowerEyePoints[0], lowerEyePoints[8]))
}
