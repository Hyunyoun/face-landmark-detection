// import * as tf from "@tensorflow/tfjs";


export interface PixelFace {
    /**
     * The image to classify. Can be a tensor, DOM element image, video, or
     * canvas.
     */

    // input: tf.Tensor3D|ImageData|HTMLVideoElement|HTMLImageElement|
    //   HTMLCanvasElement;

    /** Position of Body. [-1, 1] **/
    bodyPosition: number;

    /** Eye Blinks **/
    leftEyeBlink: boolean;
    rightEyeBlink: boolean;

    /** Iris Position [-1, 1] **/
    irisPosition: number;

    /** Eyebrow Position [0, 1] **/
    eyebrowPosition: number;

    /** Mouth Shape **/
    mouthShape: MouthShape; /** Another Interface **/

}


export enum MouthShape {
    Neutral = 'Neutral',
    M = 'Neutral',
    F = 'Neutral',
    D = 'DSLEe',
    S = 'DSLEe',
    L = 'DSLEe',
    Ee = 'DSLEe',
    Smile = 'DSLEe',
    Aa = 'AaR',
    R = 'AaR',
    Surprised = 'AaR',
    W_Oo = 'W-Oo',
    Oh = 'OhUh',
    Uh = 'Ohuh'
}


export enum TraitType {
    EYE = 'eye',
    MOUTH = 'mouth',
    EYEBROW = 'eyebrow'
}