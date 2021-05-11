import {decompressFrames, ParsedFrame, parseGIF} from "gifuct-js";
import {from, Observable, of} from "rxjs";
import {concatMap, delay, mergeMap, repeat} from "rxjs/operators";
import React, {Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState} from "react";


const getGifURL = (gifName: string) => {
    return `https://cryptopunk-test.s3.ap-northeast-2.amazonaws.com/background/${gifName}.gif`
}


const loadBackgroundImage = (gifURL: string, gifRef: MutableRefObject<any>, setFunc: Dispatch<SetStateAction<boolean>>) => {
    const promisedGif = fetch(gifURL)
        .then(resp => resp.arrayBuffer())
        .then(buff => parseGIF(buff))
        .then(gif => decompressFrames(gif, true))

    gifRef.current = from(promisedGif)
        .pipe(
            // repeat almost infinite times (1 day)
            repeat(10000),
            // make observable to emit each element of the array (not the whole array)
            mergeMap((x) => from(x)),
            // delay each element by 1 sec
            concatMap(x => of(x).pipe(delay(x.delay)))
        )

    setFunc(true)
}


const showBackground = (gifObservable: Observable<ParsedFrame>, canvasElement: HTMLCanvasElement) => {
    const canvasCtx = canvasElement.getContext('2d')
    canvasCtx!!.imageSmoothingEnabled = false

    let scale = canvasElement.width

    gifObservable
        .subscribe(frame => {
            const dim = frame.dims
            scale = Math.round(Math.min(scale, canvasElement.width / dim.width))
            const imageData = new ImageData(frame.patch, dim.width, dim.height)
            createImageBitmap(imageData)
                .then(imageBitmap =>
                    canvasCtx!!.drawImage(imageBitmap, scale * dim.left, scale * dim.top, scale * dim.width, scale * dim.height)
                )
        })
}


const BackgroundRenderer = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gifObservableRef = useRef<Observable<any>>(null)

    const [gifLoaded, setGifLoaded] = useState(false)

    const gifName = 'SpaceShip_1x_210509'

    /** Initialize **/
    useEffect(
        () => {
            if (!gifObservableRef.current) {
                loadBackgroundImage(getGifURL(gifName), gifObservableRef, setGifLoaded)
            }
        },
        []
    )

    useEffect(
        () => {
            if (!gifLoaded || !canvasRef.current || !gifObservableRef.current)
                return
            showBackground(gifObservableRef.current, canvasRef.current)
        },
        [gifLoaded]
    )

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="background-canvas"
        />
    )
}

export default BackgroundRenderer
