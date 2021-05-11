import React, {useEffect, useRef, useState} from "react"
import {from, Observable, of, timer} from "rxjs"
import {loadImage} from "canvas"
import {getTraitUrl} from "./cryptopunks"
import {getEyePosition, isLeftEyeBlink, isRightEyeBlink} from "../tfjs/estimator";
import { parseGIF, decompressFrames } from 'gifuct-js'
import {concatMap, delay, map, mergeMap, repeat, switchMap, tap} from "rxjs/operators";
import {flatMap} from "rxjs/internal/operators";


const PIXEL_SIZE = 24;


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

    const scale = 20;
    // const imageHeight = imageSet['Face'].subscribe(image => return image.height);

    const box = prediction.boundingBox;
    const location = {
        x: 0.5 * (box.topLeft[0] + box.bottomRight[0]),
        y: canvasElement.height - scale * PIXEL_SIZE  // 0.5 * (box.topLeft[1] + box.bottomRight[1])
    };

    const keyPoints = prediction.scaledMesh;
    const eyePosition = Math.round(getEyePosition(keyPoints, 'left')) * scale;
    const leftEyelidPosition = isLeftEyeBlink(keyPoints) ? scale : 0;
    const rightEyelidPosition = isRightEyeBlink(keyPoints) ? scale : 0;


    ['Face', 'SkinEffect', 'EyeShadow', 'LeftEyeball', 'RightEyeball'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y, scale * image.width, scale * image.height))
        }
    });

    /** Pupil **/
    ['LeftPupil', 'RightPupil'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x + eyePosition, location.y, scale * image.width, scale * image.height))
        }
    });

    /** Eyeblink **/
    ['LeftEyelid'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y + leftEyelidPosition, scale * image.width, scale * image.height))
        }
    });
    ['RightEyelid'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y + rightEyelidPosition, scale * image.width, scale * image.height))
        }
    });

    ['Nose', 'Neck', 'Mustache', 'Beard'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y, scale * image.width, scale * image.height))
        }
    });

    /** Mouth **/
    ['Mouth'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y, scale * image.width, scale * image.height))
        }
    });

    /** Mouth **/
    ['Earring', 'Hair', 'Hat', 'Mask', 'EyesCover', 'NoseAccessory', 'Cigar'].forEach(trait => {
        if (trait in imageSet) {
            imageSet[trait]
                .subscribe(image => canvasCtx.drawImage(image, location.x, location.y, scale * image.width, scale * image.height))
        }
    });
}

const loadBackgroundImage = (gifRef, setFunc) => {
    const gifURL = 'https://cryptopunk-test.s3.ap-northeast-2.amazonaws.com/background/SpaceShip_1x_210509.gif'

    // const gifImage = from(fetch(gifURL).then(resp => resp.arrayBuffer()))
    //     .pipe(
    //         // flatMap(resp => resp.arrayBuffer()),
    //         flatMap(buff => parseGIF(buff)),
    //         flatMap(gif => decompressFrames(gif, true))
    //     )
    // gifRef.current = gifImage
    const promisedGif = fetch(gifURL)
        .then(resp => resp.arrayBuffer())
        .then(buff => parseGIF(buff))
        .then(gif => decompressFrames(gif, true))

    gifRef.current = from(promisedGif)
    setFunc(true)
}


const showBackground = (gifObservable, canvasElement) => {
    console.log("reached here")

    // Observable.create(obs => {
    //     obs.next([1, 2, 3]);
    //     obs.complete();
    // })

    Observable(obs => {
            obs.next([1, 2, 3]);
            obs.complete();
        }
    )
        .pipe(
            // make observable to emit each element of the array (not the whole array)
            mergeMap((x) => from(x)),
            // delay each element by 1 sec
            concatMap(x => of(x).pipe(delay(1000)))
        )
        .subscribe(x => console.log(x));

    //
    // gifObservable
    //     .pipe(
    //         switchMap(parsedFrames => from(parsedFrames)
    //             .pipe(
    //                 map(parsedFrame => {
    //                     delay(parsedFrame.delay * 100)
    //                     return parsedFrame
    //                 })
    //             )
    //         )
    //     )
    //     .subscribe( data =>
    //         console.log(data.delay)
    //     )



    //
    // // let onlyFirst = true
    // gifObservable
    //     .pipe(
    //         repeat(2),
    //
    //     )
    //     .subscribe(
    //         parsedFrames => {
    //             parsedFrames.forEach( parsedFrame => {
    //                 console.log(parsedFrame.delay)
    //                 // sleep(parsedFrame.delay*10)
    //                 timer(parsedFrame.delay*10)
    //                 // delay(parsedFrame.delay)
    //                 // // if (onlyFirst) {
    //                 //     console.log(parsedFrame)
    //                 // }
    //                 // onlyFirst = false
    //             })
    //         }
    //     )
}

const PixelCharacterRenderer = () => {
    const canvasRef = useRef()
    const backgroundCanvasRef = useRef()
    const imagesRef = useRef([])
    const backgroundImageRef = useRef()
    const [location, setLocation] = useState({x: 0, y: 0})
    const [loaded, setLoaded] = useState(false)

    /** Initialize **/
    useEffect(
        () => {
            if (!imagesRef.current)
                loadImages(imagesRef)
            if (!backgroundImageRef.current)
                loadBackgroundImage(backgroundImageRef, setLoaded)
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

    useEffect(
        () => {
            if (!loaded || !backgroundCanvasRef.current || !backgroundImageRef.current)
                return

            showBackground(backgroundImageRef.current, backgroundCanvasRef.current)
        },
        [loaded]
    )

    const handleCanvasClick = (e) => {
        setLocation({ x: e.clientX, y: e.clientY })
    }

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={window.innerWidth /2}
                height={window.innerHeight / 2}
                onClick={handleCanvasClick}
                className="pixel-canvas"
            />
            <canvas
                ref={backgroundCanvasRef}
                width={window.innerWidth /2}
                height={window.innerHeight / 2}
                className="background-canvas"
            />
        </div>
    )
}

export default PixelCharacterRenderer
