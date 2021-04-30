import { useState, useEffect } from "react";

export const useUserMedia = (requestedMedia: MediaStreamConstraints) => {
    const [mediaStream, setMediaStream] = useState();

    useEffect(() => {
        const enableStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(requestedMedia);
                // @ts-ignore
                setMediaStream(stream);
            } catch(err) {
                console.error(err)
                // Removed for brevity
            }
        }

        if (!mediaStream) {
            enableStream(); //.then();
        } else {
            return function cleanup() {
                // @ts-ignore
                mediaStream.getTracks().forEach(track => {
                    track.stop();
                });
            }
        }
    }, [mediaStream, requestedMedia]);

    return mediaStream;
}