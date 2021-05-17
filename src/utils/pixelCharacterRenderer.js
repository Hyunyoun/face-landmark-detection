import {from} from "rxjs"
import {loadImage} from "canvas"
import {getEyePosition, isLeftEyeBlink, isRightEyeBlink} from "./pixelMovement";
import {MouthShape} from "./pixelCharacter";


const PIXEL_SIZE = 24;


/** Trait Image들을 어떻게 가져올 지 정해지지 않아 하드코딩으로 일단 고정해두었음.  */

const getTraitName = (trait) => {
    return `Ape${trait}`
}

const getTraitUrl = (trait) => {
    // const traitName = getTraitName(trait);
    return `https://cryptopunk-test.s3.ap-northeast-2.amazonaws.com/Ape/${trait}.png`;
}

export const loadImages = (imagesRef) => {
    const traits = {
        'Face': 'Face',
        'LeftEyeball': 'LeftEyeball',
        'RightEyeball': 'RightEyeball',
        'LeftPupil': 'LeftPupil',
        'RightPupil': 'RightPupil',
        'LeftEyelid': 'LeftEyelid',
        'RightEyelid': 'RightEyelid',
        'Nose': 'Nose',
        'Lip': 'Mouth',
        'Neck': 'GoldChain',
        'Hat': 'KnittedCap',
    }

    let imageSet = {}
    for (const [key, value] of Object.entries(traits)) {
        const srcPath = getTraitUrl(`Ape${value}`)
        imageSet[key] = from(loadImage(srcPath))
    }
    imagesRef.current = imageSet
}


export const getFaceInfo = (prediction) => {
    const box = prediction ? prediction.boundingBox : {topLeft: [0, 0], bottomRight: [0, 0]}
    const keyPoints = prediction.scaledMesh

    return {
        bodyPosition: Math.round(0.5 * (box.topLeft[0] + box.bottomRight[0])),
        leftEyeBlink: isLeftEyeBlink(keyPoints),
        rightEyeBlink: isRightEyeBlink(keyPoints),
        irisPosition: Math.round(getEyePosition(keyPoints, 'left')),
        eyebrowPosition: 0,
        mouthShape: MouthShape.Neutral
    }
}


export const drawTraits = (imageSet, faceInfo, canvasElement) => {
    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.imageSmoothingEnabled = false

    /** Scale 기준 논의해 봐야 함. ex) Canvas Height x 60~70% */
    const scale = 40;
    // const imageHeight = imageSet['Face'].subscribe(image => return image.height);

    const rootX = faceInfo.bodyPosition;
    const rootY = canvasElement.height - scale * PIXEL_SIZE;

    const irisPosition = faceInfo.irisPosition * scale;
    const leftEyelidPosition = faceInfo.leftEyeBlink ? scale : 0;
    const rightEyelidPosition = faceInfo.rightEyeBlink ? scale : 0;
    // TODO: eyebrowPosition
    // TODO: mouthShape using voice prediction (new info)

    ['Face', 'SkinEffect', 'EyeShadow', 'LeftEyeball', 'RightEyeball']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY, scale));

    /** Pupil **/
    ['LeftPupil', 'RightPupil']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX + irisPosition, rootY, scale));

    /** Eyeblink **/
    ['LeftEyelid']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY + leftEyelidPosition, scale));

    ['RightEyelid']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY + rightEyelidPosition, scale));

    ['Nose', 'Neck', 'Mustache', 'Beard']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY, scale));

    /** Lip **/
    ['Lip']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY, scale));

    /** Outer **/
    ['Earring', 'Hair', 'Hat', 'Mask', 'EyesCover', 'NoseAccessory', 'Cigar']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, rootX, rootY, scale));
}


const drawTrait = (trait, imageSet, canvasContext, x, y, scale) => {
    if (trait in imageSet)
        imageSet[trait]
            .subscribe(image => canvasContext.drawImage(image, x, y, scale * image.width, scale * image.height))
}
