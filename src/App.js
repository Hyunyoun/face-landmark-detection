import React, { useRef, useState, useEffect, useCallback } from "react";
import "./App.css";
// import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
// import { drawMesh } from "./face-renderer/meshUtilities.js";
import {timer, Subject, from, ReplaySubject, interval, AsyncSubject} from 'rxjs';
import {filter, map, take, tap} from "rxjs/operators";
import {catchError, mergeMap} from 'rxjs/operators';
import logo from "./image/space_low.gif"
import {Camera} from "./userMedia/webcam";

require('@tensorflow/tfjs-backend-webgl');

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = '#32EEDB';
const RED = "#FF2C35";
const BLUE = "#157AB3";

function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

let model, ctx, videoWidth, videoHeight, video, canvas,
  scatterGLHasInitialized = false, scatterGL, rafID, predictions;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = mobile === false;
// const stats = new Stats();
const state = {
  backend: 'webgl',
  maxFaces: 1,
  triangulateMesh: true,
  predictIrises: true
};

const WEBCAM_CONSTRAINTS = {
  audio: true,
  video: { facingMode: "environment" },
};


const loadFaceLandmarksDetection = async () => {
  const network = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    {
      maxFaces: 1
    }
  );
  return network
  // console.log(network.estimateFaces());
  // console.log(network.estimateFaces());
  // setInterval(() => {
  //   detectFace(network);
  // }, 5000);
};

//
// const detectFace = async (network) => {
//   const webcamReference = useRef(null);
//   const canvasReference = useRef(null);
//
//   if (
//     typeof webcamReference.current !== "undefined" &&
//     webcamReference.current !== null &&
//     webcamReference.current.video.readyState === 4
//   ) {
//     // Get Video Properties
//     const video = webcamReference.current.video;
//     const videoWidth = webcamReference.current.video.videoWidth;
//     const videoHeight = webcamReference.current.video.videoHeight;
//
//     // Set video width
//     webcamReference.current.video.width = videoWidth;
//     webcamReference.current.video.height = videoHeight;
//
//     // Set canvas width
//     canvasReference.current.width = videoWidth;
//     canvasReference.current.height = videoHeight;
//
//     // Make Detections
//     const faceEstimate = await network.estimateFaces(video);
//     console.log(faceEstimate);
//
//     //Get canvas context
//     const ctx = canvasReference.current.getContext("2d");
//     drawMesh(faceEstimate, ctx);
//   }
// };
//
//

// ctx.drawImage(
//   video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

//
// const estimate = async (model) => {
//
//   model.estimateFaces({
//     input: document.querySelector('video'),
//     returnTensors: false,
//     flipHorizontal: false,
//     predictIrises: state.predictIrises
//   }).then((resolve, reject) =>
//     console.log(resolve)
//   );
//
//   return predictions
// }

const printPredictionData = (predictions) => {
  console.log(`face predicted: ${predictions.length}`);
  for (let i = 0; i < predictions.length; i++) {
    const keyPoints = predictions[i].scaledMesh;

    // Log facial keypoints.
    for (let i = 0; i < 5; i++) {  // keyPoints.length; i++) {
      const [x, y, z] = keyPoints[i];
      console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
    }
  }
}

// video =
// it's loaded
const config = {
  input: document.querySelector('video'),
  returnTensors: false,
  flipHorizontal: false,
  predictIrises: false
}


//
//
// model.then(function (res) {
//     video = document.querySelector('video')
//     if (video.readyState === 4) {
//       // it's loaded
//       const config = {
//         input: video,
//         returnTensors: false,
//         flipHorizontal: false,
//         predictIrises: false
//       }
//       const predictions = res.estimateFaces(config);
//
//       predictions.then(
//         function (res) {
//           printPredictionData(res);
//           console.log(res);
//         }
//         , function(err) {
//           console.log(err);
//         }
//       )
//     }
//   }, function (err) {
//     console.log(err);
//   }
// // );
//
// // const [loaded, setLoaded] = useState(false);
// let loaded = false;
// model = loadFaceLandmarksDetection()
//   .then(loaded = true);
//
//
// //
// // from(model).pipe(
// //   filter( () => {
// //     const videoElement = document.querySelector('video');
// //     console.log(videoElement);
// //     return videoElement !== null && videoElement !== 'undefined' && videoElement.readyState === 4
// //   }),
// // ).subscribe(() => setLoaded(true));
// //
//
// from(interval(2000)).pipe(
//   filter( () => {
//     const videoElement = document.querySelector('video');
//     console.log(videoElement);
//     return videoElement !== null && videoElement !== 'undefined' && videoElement.readyState === 4
//   }),
//   filter(() => loaded === true),
//   tap(() => console.log("Estimation start!!")),
//   mergeMap( () => model.estimateFaces(config)),
// ).subscribe(result => printPredictionData(result));
//
const detectionModel = faceLandmarksDetection.load(
  faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
  {
    maxFaces: 1
  }
);
const observable = from(detectionModel);

// scheduled(model, Scheduler(1000)).pipe(
// from(model).pipe(
//   filter( () => {
//     const videoElement = document.querySelector('video');
//     console.log(videoElement);
//     return videoElement !== null && videoElement !== 'undefined' && videoElement.readyState === 4
//   }),
//   tap(() => console.log("Estimation start!!")),
//   mergeMap( result => result.estimateFaces(config)),
// ).subscribe(result => printPredictionData(result));


const App = () => {

  observable.pipe(
    filter( () => {
      const videoElement = document.querySelector('video');
      console.log(videoElement);
      return videoElement !== null && videoElement !== 'undefined' && videoElement.readyState === 4
    }),
    // filter(() => loaded === true),
    // tap(() => console.log("Estimation start!!")),
    mergeMap( result => result.estimateFaces(config)),
  ).subscribe(result => printPredictionData(result));

  return (
    <div className="App">
      { Camera() }
      <img className="animated-gif" src={logo} alt="loading..."/>
    </div>
  );
}

export default App;

