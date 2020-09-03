var video = document.getElementById("videoInput");
var canvas = document.getElementById("videoCanvas");
var ctx = canvas.getContext("2d");
var flipHorizontal = true;
var model;

import {drawBoundingBox, drawKeypoints, drawSkeleton} from './demo_util.js'

function startVideo(video) {
  // Video must have height and width in order to be used as input for NN
  // Aspect ratio of 3/4 is used to support safari browser.
  video.width = 450;
  video.height = 350;
  video.width = video.width || 400;
  video.height = video.height || video.width * (3 / 4);
  canvas.setAttribute("height", video.height);
  canvas.setAttribute("width", video.width);

  return new Promise(function (resolve, reject) {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then(stream => {
        window.localStream = stream;
        video.srcObject = stream
        video.onloadedmetadata = () => {
          video.play()
          resolve(true)
        }
      }).catch(function (err) {
        resolve(false)
      });
  });

}

async function stopVideo() {
  if (window.localStream) {
    window.localStream.getTracks().forEach((track) => {
      track.stop();
      return true;
    });
  } else {
    return false;
  }
}

async function loadModel(){

  const net = await posenet.load({
  architecture: 'MobileNetV1',
  outputStride: 16,
  inputResolution: 350,
  multiplier: 0.75,
  quantBytes:2
});

  console.log("Model loaded and warmed up....")

  return net

}

async function detectPose(model, video){
  // const poses = await model.estimateMultiplePoses(video, {
  //       flipHorizontal: false,
  //       maxDetections: 2,
  //       scoreThreshold: 0.6,
  //       nmsRadius: 20});
  let poses = []
  let all_poses = await model.estimatePoses(video, {
          flipHorizontal: flipHorizontal,
          decodingMethod: 'multi-person',
          maxDetections: 5,
          scoreThreshold: 0.4,
          nmsRadius: 30
        });
  poses = poses.concat(all_poses);
  return poses;
}

async function RenderVideo(){
  const pose = await detectPose(model,video);
  const minPoseConfidence = 0.15;
  const minPartConfidence = 0.1;
  // console.log(pose)
  ctx.clearRect(0, 0, video.width, video.height);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-video.width, 0);
  ctx.drawImage(video, 0, 0, video.width, video.height);
  ctx.restore();
  pose.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
          drawSkeleton(keypoints, minPartConfidence, ctx);
          // drawBoundingBox(keypoints, ctx);
      }
    });
}


function start(){
  RenderVideo();
  window.requestAnimationFrame(() => {
          setInterval(() => {
            RenderVideo();
          }, 1000 / 20);
        });
      }

window.startLoop = async () => {
        // if (flipHorizontal) {
        //   ctx.scale(-1, 1);
        //   ctx.translate(-video.width, 0);
        // }
        await startVideo(video);
        model = await loadModel()
        start();
      };

