import React, {useEffect, useRef, useState} from "react";
import {forkJoin} from "rxjs";
import {loadImage} from "canvas";
import {getTraitUrl} from "./cryptopunks";


const initializeCanvas = (canvasRef) => {
    // const canvasConfig = {
    //     width: 1000,
    //     height: 500
    // }
    canvasRef = document.getElementsByClassName('pixel-canvas').item(0);
}

const loadImages = (imagesRef) => {
    let imagePromises = [];
    const traits = [
        'ApeFace', 'ApeEyeShadow', 'ApeEyeballs', 'ApeEyes',
        'ApeNose', 'ApeKnittedCap'
    ]

    traits.forEach(trait => {
        const srcPath = getTraitUrl(trait);
        // const srcPath = `./image/trait/Ape/${trait}.jpeg`;
        imagePromises.push(
            loadImage(srcPath)
        );
    });

    imagesRef.current = imagePromises
}

const drawTraits = (images, location, canvasElement) => {
    const canvasCtx = canvasElement.getContext('2d')
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    images.forEach(image => {
        const scale = 2  // canvasElement.height / image.width
        canvasCtx.drawImage(image, location.x, location.y, scale * image.width, scale * image.height);
    })
}

const PixelCharacterRenderer = () => {
    const canvasRef = useRef()
    const imagesRef = useRef([])
    const [location, setLocation] = useState({x: 0, y: 0})

    /** Initialize **/
    useEffect(
        () => {
            initializeCanvas()
            loadImages(imagesRef)
        },
        []
    )

    useEffect(
        () => {
            if (!canvasRef.current)
                return;

            forkJoin(imagesRef.current)
                .subscribe({
                    next: images => drawTraits(images, location, canvasRef.current),
                    error: err => console.error(err)
                });
        },
        [location]
    );

    const handleCanvasClick = (e) => {
        setLocation({ x: e.clientX, y: e.clientY })
    }

    return (
        <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onClick={handleCanvasClick}
            className="pixel-canvas"
        />
    );
}

export default PixelCharacterRenderer;
