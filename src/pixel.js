import React, {useEffect, useRef, useState} from "react";
import {forkJoin} from "rxjs";
import {createCanvas, loadImage} from "canvas";

const RED = "#FF2C35";


const setupPixelCanvas = () => {
    const canvasConfig = {
        width: 1600,
        height: 900
    }

    const canvasContainer = document.querySelector('.canvas-wrapper2');
    canvasContainer.style = `width: ${canvasConfig.width}px; height: ${canvasConfig.width}px`;

    const canvas = document.getElementsByClassName('pixel-canvas').item(0);
    // const canvasWidth = canvasConfig.width;
    // canvas.width = canvasWidth;
    // canvas.height = canvasConfig.height;

    const context = canvas.getContext('2d');
    context.fillStyle = RED;
    context.fillRect(0, 0, canvas.width, canvas.height);
}


const loadImages = () => {
    let jarOfPromise = [];
    let traitImageCollections = {};
    const traits = [
        'ApeFace', 'ApeEyeShadow', 'ApeLeftEyeball', 'ApeRightEyeball',
        'ApeLeftPupil', 'ApeRightPupil', 'ApeLeftEyelid', 'ApeRightEyelid',
        'ApeNose', 'ApeMouth', 'ApeKnittedCap'
    ]
    const path = require('path');
    console.log(path.join(__dirname, '../'));

    traits.forEach(trait => {
        const srcPath = `./image/trait/Ape/${trait}.png`;
        console.log(srcPath);
        jarOfPromise.push(
            loadImage(srcPath)
        );
        //     new Promise((resolve, reject) => {
        //         traitImageCollections[trait] = new Image();
        //         traitImageCollections[trait].src = srcPath;
        //         // console.log(traitImageCollections[trait]);
        //         traitImageCollections[trait].addEventListener('load', function () {
        //             resolve(true);
        //         });
        //     })
        // )
    });

    return jarOfPromise
}

const PixelPart = () => {
    const canvasRef = useRef(null);
    const [canvasLoad, setCanvasLoad] = useState(false);

    // useEffect(
    //     () => {
    //         setupPixelCanvas();
    //         setCanvasLoad(true);
    //     },
    //     []
    // );

    useEffect(
        () => {
            if (!canvasRef.current)
                return;

            setupPixelCanvas();

            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement.getContext('2d');

            forkJoin(loadImages())
                .subscribe( images => {
                    console.log(images);
                    images.forEach(image => {
                        console.log(image.src);
                        canvasCtx.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);
                    })
                });
        },
        []

    );

    return (
        <div className="canvas-wrapper2">
            <canvas ref={canvasRef} className="pixel-canvas"/>
        </div>
    );
}

export default PixelPart;
