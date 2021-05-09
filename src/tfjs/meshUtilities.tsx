import { Coord3D } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";

const SKYBLUE = "#6085FB";

export const distance = (a: Coord3D, b: Coord3D) => {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};

// Triangle drawing method
export const drawPath = (
    context: CanvasRenderingContext2D,
    points: Coord3D[],
    closePath: boolean
) => {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point[0], point[1]);
    }

    if (closePath) region.closePath();

    context.strokeStyle = SKYBLUE;
    context.stroke(region);
};
