import React, { useRef, useState } from 'react';
import Measure from "react-measure";
import { useUserMedia } from './useUserMedia';
import { useCardRatio } from "./useCardRatio";
import { useOffsets } from './useOffsets';

const WEBCAM_CONSTRAINTS = {
    audio: false,
    video: { facingMode: "environment" },
};

export const Camera = () => {
    const videoRef = useRef();
    const mediaStream = useUserMedia(WEBCAM_CONSTRAINTS);
    const [container, setContainer] = useState({height: 0});
    const [aspectRatio, setAspectRatio] = useCardRatio(1.586); // default card ratio
    const offsets = useOffsets(
        videoRef.current && videoRef.current.videoWidth,
        videoRef.current && videoRef.current.videoHeight,
        container.width,
        container.height
    );

    if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = mediaStream;
    }

    const handleCanPlay = () => {
        videoRef.current.play();
    }

    const handleResize = (contentRect) => {
        setContainer({
            height: Math.round(contentRect.bounds.width / aspectRatio)
        });
    }

    return (
        <Measure bounds onResize={handleResize}>
            {({ measureRef }) => (
                <div ref={measureRef} style={{ height: `${container.height}px` }}>
                    <video
                        ref={videoRef}
                        onCanPlay={handleCanPlay}
                        style={{ top: `-${offsets.y}px`, left: `-${offsets.x}px` }}
                        autoPlay
                        playsInline
                        muted
                    />
                </div>
            )}
        </Measure>
    );
};
