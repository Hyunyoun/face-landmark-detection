import React, {useEffect, useRef, useState} from "react"
import {from} from "rxjs"
import {loadImage} from "canvas"
import {getEyePosition, isLeftEyeBlink, isRightEyeBlink} from "../tfjs/estimator";


const PIXEL_SIZE = 24;


/** Trait Image들을 어떻게 가져올 지 정해지지 않아 하드코딩으로 일단 고정해두었음.  */

const getTraitName = (trait) => {
    return `Ape${trait}`
}

export const getTraitUrl = (trait) => {
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
        'Mouth': 'Mouth',
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


export const drawTraits = (imageSet, prediction, canvasElement) => {
    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.imageSmoothingEnabled = false

    /** Scale 기준 논의해 봐야 함. ex) Canvas Height x 60~70% */
    const scale = 20;
    // const imageHeight = imageSet['Face'].subscribe(image => return image.height);

    const box = prediction ? prediction.boundingBox : {topLeft: [0, 0], bottomRight: [0, 0]}
    const startPoint = {
        x: 0.5 * (box.topLeft[0] + box.bottomRight[0]),
        y: canvasElement.height - scale * PIXEL_SIZE  // 0.5 * (box.topLeft[1] + box.bottomRight[1])
    };
    let subStartPoint = startPoint;

    const keyPoints = prediction.scaledMesh;
    const eyePosition = Math.round(getEyePosition(keyPoints, 'left')) * scale;
    const leftEyelidPosition = isLeftEyeBlink(keyPoints) ? scale : 0;
    const rightEyelidPosition = isRightEyeBlink(keyPoints) ? scale : 0;
    // TODO: eyebrowPosition
    // TODO: mouthShape using voice prediction (new info)

    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y;
    ['Face', 'SkinEffect', 'EyeShadow', 'LeftEyeball', 'RightEyeball']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    /** Pupil **/
    subStartPoint.x = startPoint.x + eyePosition;
    subStartPoint.y = startPoint.y;
    ['LeftPupil', 'RightPupil']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    /** Eyeblink **/
    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y + leftEyelidPosition;
    ['LeftEyelid']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y + rightEyelidPosition;
    ['RightEyelid']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y;
    ['Nose', 'Neck', 'Mustache', 'Beard']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    /** Mouth **/
    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y;
    ['Mouth']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

    /** Outer **/
    subStartPoint.x = startPoint.x;
    subStartPoint.y = startPoint.y;
    ['Earring', 'Hair', 'Hat', 'Mask', 'EyesCover', 'NoseAccessory', 'Cigar']
        .forEach(trait => drawTrait(trait, imageSet, canvasCtx, subStartPoint, scale));

}


const drawTrait = (trait, imageSet, canvasContext, startPoint, scale) => {
    if (trait in imageSet) {
        imageSet[trait]
            .subscribe(image => canvasContext.drawImage(image, startPoint.x, startPoint.y, scale * image.width, scale * image.height))
    }
}


const PixelCharacterApp = () => {
    const canvasRef = useRef()
    const imagesRef = useRef([])

    const [location, setLocation] = useState({x: 0, y: 0})

    /** Initialize **/
    useEffect(
        () => {
            if (!imagesRef.current)
                loadImages(imagesRef)
        },
        []
    )

    useEffect(
        () => {
            if (!canvasRef.current)
                return

            console.log(location)
            // drawTraits(imagesRef.current, location, canvasRef.current)
        },
        [location]
    )

    const handleCanvasClick = (e) => {
        setLocation({ x: e.clientX, y: e.clientY })
    }

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth /2}
            height={window.innerHeight / 2}
            onClick={handleCanvasClick}
            className="pixel-canvas"
        />
    )
}

export default PixelCharacterApp
