import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Heart, Dumbbell, AlertTriangle, Activity } from "lucide-react";
// Exercise information with calories per rep

const ExerciseApp2 = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [exerciseCount, setExerciseCount] = useState({
    pushups: 0,
    squats: 0,
    pullups: 0,
    "dumbbell curls": 0,
    "jumping jacks": 0,
  });

  const [currentExercise, setCurrentExercise] = useState("");

  // Position states for each exercise
  const [pullupPosition, setPullupPosition] = useState("down");
  const [pushupPosition, setPushupPosition] = useState("up");
  const [squatPosition, setSquatPosition] = useState("up");
  const [dumbbellCurlPosition, setDumbbellCurlPosition] = useState("down");
  const [jumpingJackPosition, setJumpingJackPosition] = useState("down");

  const isDetectionActive = useRef(false);
  const isExerciseInProgressRef = useRef(false);

  const [riskStatus, setRiskStatus] = useState({
    cramps: { risk: "low", message: "" },
    heartAttack: { risk: "low", message: "" },
  });

  const [exerciseIntensity, setExerciseIntensity] = useState({
    duration: 0,
    repetitions: 0,
    startTime: Date.now(),
  });

  // Breathing animation state
  const [breathingPhase, setBreathingPhase] = useState("inhale");
  const lastUpdateTime = useRef(Date.now());

  const getPosition = useCallback(
    (exercise) => {
      if (!exercise) return "";
      switch (exercise.toLowerCase()) {
        case "pushups":
          return pushupPosition;
        case "squats":
          return squatPosition;
        case "pullups":
          return pullupPosition;
        case "dumbbell curls":
          return dumbbellCurlPosition;
        case "jumping jacks":
          return jumpingJackPosition;
        default:
          return "";
      }
    },
    [
      pushupPosition,
      squatPosition,
      pullupPosition,
      dumbbellCurlPosition,
      jumpingJackPosition,
    ]
  );

  useEffect(() => {
    const monitorRisks = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastUpdateTime.current;

      // Only update if enough time has passed (every 1 second)
      if (timeDiff >= 1000) {
        const exerciseDuration =
          (currentTime - exerciseIntensity.startTime) / 1000;
        const totalReps = Object.values(exerciseCount).reduce(
          (a, b) => a + b,
          0
        );

        setExerciseIntensity((prev) => ({
          ...prev,
          duration: exerciseDuration,
          repetitions: totalReps,
        }));

        // Cramp risk assessment
        if (exerciseDuration > 1800) {
          setRiskStatus((prev) => ({
            ...prev,
            cramps: {
              risk: "high",
              message:
                "Extended exercise duration. Consider taking a break and hydrating.",
            },
          }));
        } else if (exerciseDuration > 900) {
          setRiskStatus((prev) => ({
            ...prev,
            cramps: {
              risk: "medium",
              message: "Remember to stay hydrated",
            },
          }));
        }

        // Heart attack risk assessment
        const repsPerMinute = totalReps / (exerciseDuration / 60);
        if (repsPerMinute > 15) {
          setRiskStatus((prev) => ({
            ...prev,
            heartAttack: {
              risk: "high",
              message:
                "High intensity detected. Please slow down and check your heart rate.",
            },
          }));
        } else if (repsPerMinute > 8) {
          setRiskStatus((prev) => ({
            ...prev,
            heartAttack: {
              risk: "medium",
              message: "Moderate to high intensity. Monitor your breathing.",
            },
          }));
        }

        lastUpdateTime.current = currentTime;
      }
    };

    // Run the monitoring more frequently (every 100ms)
    const riskMonitorInterval = setInterval(monitorRisks, 100);
    return () => clearInterval(riskMonitorInterval);
  }, [exerciseCount, exerciseIntensity.startTime]);

  const detectExercise = useCallback(
    (keypoints) => {
      if (!keypoints) return;

      const keypointsMap = {};
      keypoints.forEach((kp) => {
        keypointsMap[kp.name] = kp;
      });

      // Only detect the selected exercise
      switch (currentExercise) {
        case "Pushups":
          detectPushup(keypointsMap);
          break;
        case "Squats":
          detectSquat(keypointsMap);
          break;
        case "Pullups":
          detectPullup(keypointsMap);
          break;
        case "Dumbbell Curls":
          detectDumbbellCurl(keypointsMap);
          break;
        case "Jumping Jacks":
          detectJumpingJacks(keypointsMap);
          break;
      }
    },
    [currentExercise]
  );

  useEffect(() => {
    const updateBreathing = () => {
      const position = getPosition(currentExercise);
      if (!currentExercise) return;

      switch (currentExercise.toLowerCase()) {
        case "pushups":
          setBreathingPhase(position === "down" ? "exhale" : "inhale");
          break;
        case "squats":
          setBreathingPhase(position === "down" ? "inhale" : "exhale");
          break;
        case "pullups":
          setBreathingPhase(position === "up" ? "exhale" : "inhale");
          break;
        case "dumbbell curls":
          setBreathingPhase(position === "up" ? "exhale" : "inhale");
          break;
        case "jumping jacks":
          setBreathingPhase(position === "up" ? "inhale" : "exhale");
          break;
      }
    };

    const breathingInterval = setInterval(updateBreathing, 100);
    return () => clearInterval(breathingInterval);
  }, [currentExercise, getPosition]);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const moveNet = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );
      setDetector(moveNet);
      console.log("MoveNet model loaded!");
    };

    loadModel();
  }, []);

  const detectPose = useCallback(async () => {
    if (!detector || !webcamRef.current) return;

    const video = webcamRef.current.video;
    if (!video) return;

    try {
      const poses = await detector.estimatePoses(video, {
        flipHorizontal: false,
      });

      if (poses.length > 0) {
        drawPose(poses[0], 640, 480);
        detectExercise(poses[0].keypoints);
      } else {
        console.warn("No poses detected");
      }
    } catch (error) {
      console.error("Error estimating poses:", error);
    }

    requestAnimationFrame(detectPose);
  }, [detectExercise, detector]);

  useEffect(() => {
    if (detector) {
      detectPose();
    }
  }, [detector, detectPose]);

  const handleExerciseChange = (exercise) => {
    setCurrentExercise(exercise);
    setPushupPosition("up"); // Reset pushup position
    setSquatPosition("up");
    setJumpingJackPosition("up");
    setPullupPosition("down");
    setDumbbellCurlPosition("down");
    // Reset squat position
    isExerciseInProgressRef.current = false; // Reset progress flag
  };

  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const detectPushup = (keypointsMap) => {
    const leftElbow = keypointsMap["left_elbow"];
    const rightElbow = keypointsMap["right_elbow"];
    const leftShoulder = keypointsMap["left_shoulder"];
    const rightShoulder = keypointsMap["right_shoulder"];
    const leftWrist = keypointsMap["left_wrist"];
    const rightWrist = keypointsMap["right_wrist"];
    const nose = keypointsMap["nose"];

    if (
      leftElbow &&
      rightElbow &&
      leftShoulder &&
      rightShoulder &&
      leftWrist &&
      rightWrist &&
      nose &&
      leftElbow.score > 0.5 &&
      rightElbow.score > 0.5 &&
      leftShoulder.score > 0.5 &&
      rightShoulder.score > 0.5 &&
      leftWrist.score > 0.5 &&
      rightWrist.score > 0.5 &&
      nose.score > 0.5
    ) {
      // Calculate angles
      const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist
      );

      // Define angle thresholds
      const ELBOW_ANGLE_THRESHOLD_DOWN = 110;
      const ELBOW_ANGLE_THRESHOLD_UP = 145;

      setPushupPosition((prevPos) => {
        // Check if elbows are bent + nose is below shoulders
        const isDownPosition =
          leftElbowAngle < ELBOW_ANGLE_THRESHOLD_DOWN &&
          rightElbowAngle < ELBOW_ANGLE_THRESHOLD_DOWN &&
          nose.y > leftShoulder.y && // Nose should be below the left shoulder
          nose.y > rightShoulder.y; // Nose should be below the right shoulder

        if (isDownPosition) {
          if (prevPos !== "down") {
            console.log("Pushup: Down position detected");
            isExerciseInProgressRef.current = false; // Reset flag when user goes down
            return "down";
          }
        } else if (
          leftElbowAngle > ELBOW_ANGLE_THRESHOLD_UP &&
          rightElbowAngle > ELBOW_ANGLE_THRESHOLD_UP
        ) {
          if (prevPos === "down" && !isExerciseInProgressRef.current) {
            console.log("Pushup: Up position detected");
            setExerciseCount((prevCount) => ({
              ...prevCount,
              pushups: prevCount.pushups + 1,
            }));
            isExerciseInProgressRef.current = true; // Prevent multiple increments
          }
          return "up";
        }

        return prevPos;
      });
    }
  };

  const detectSquat = (keypointsMap) => {
    const leftKnee = keypointsMap["left_knee"];
    const rightKnee = keypointsMap["right_knee"];
    const leftHip = keypointsMap["left_hip"];
    const rightHip = keypointsMap["right_hip"];

    if (
      leftKnee &&
      rightKnee &&
      leftHip &&
      rightHip &&
      leftKnee.score > 0.2 &&
      rightKnee.score > 0.2 &&
      leftHip.score > 0.2 &&
      rightHip.score > 0.2
    ) {
      const isKneeBend = leftKnee.y < leftHip.y && rightKnee.y < rightHip.y; // Check if knees are bent
      const isStanding = leftKnee.y > leftHip.y && rightKnee.y > rightHip.y; // Check if standing

      setSquatPosition((prevPos) => {
        if (isKneeBend && prevPos !== "down") {
          console.log("Squat down position detected");
          isExerciseInProgressRef.current = true; // Set to true when in squat position
          return "down"; // Indicate that the user is in a squat position
        } else if (isStanding && prevPos === "down") {
          if (isExerciseInProgressRef.current) {
            console.log("Standing position detected");
            setExerciseCount((prevCount) => ({
              ...prevCount,
              squats: prevCount.squats + 1, // Increment count when standing up
            }));
            isExerciseInProgressRef.current = false; // Reset progress flag
          }
          return "up"; // Indicate that the user is standing
        }

        return prevPos; // Return the previous position if no change
      });

      // Reset the exercise in progress flag when back to standing
      if (isStanding) {
        isExerciseInProgressRef.current = false;
      }
    }
  };

  const detectPullup = (keypointsMap) => {
    const leftShoulder = keypointsMap["left_shoulder"];
    const rightShoulder = keypointsMap["right_shoulder"];
    const leftElbow = keypointsMap["left_elbow"];
    const rightElbow = keypointsMap["right_elbow"];

    if (
      leftShoulder &&
      rightShoulder &&
      leftElbow &&
      rightElbow &&
      leftShoulder.score > 0.5 &&
      rightShoulder.score > 0.5 &&
      leftElbow.score > 0.5 &&
      rightElbow.score > 0.5
    ) {
      setPullupPosition((prevPos) => {
        const isHanging =
          leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y; // Elbows are below shoulders
        const isPullingUp =
          leftElbow.y < leftShoulder.y && rightElbow.y < rightShoulder.y; // Elbows are above shoulders

        // Count the pull-up when coming from hanging to pulling up
        if (
          isPullingUp &&
          prevPos === "down" &&
          !isExerciseInProgressRef.current
        ) {
          console.log("Pull-up: Up position detected");
          setExerciseCount((prevCount) => ({
            ...prevCount,
            pullups: prevCount.pullups + 1,
          }));
          isExerciseInProgressRef.current = true; // Set to true when a pull-up is counted
          return "up"; // Update position to up
        } else if (isHanging && prevPos === "up") {
          console.log("Pull-up: Down position detected");
          isExerciseInProgressRef.current = false; // Reset when going back down
          return "down"; // Update position to down
        }

        return prevPos; // Maintain previous position if no change
      });
    }
  };

  const detectDumbbellCurl = (keypointsMap) => {
    const leftShoulder = keypointsMap["left_shoulder"];
    const leftElbow = keypointsMap["left_elbow"];
    const leftWrist = keypointsMap["left_wrist"];
    const rightShoulder = keypointsMap["right_shoulder"];
    const rightElbow = keypointsMap["right_elbow"];
    const rightWrist = keypointsMap["right_wrist"];

    if (
      leftShoulder &&
      leftElbow &&
      leftWrist &&
      rightShoulder &&
      rightElbow &&
      rightWrist &&
      leftShoulder.score > 0.5 &&
      leftElbow.score > 0.5 &&
      leftWrist.score > 0.5 &&
      rightShoulder.score > 0.5 &&
      rightElbow.score > 0.5 &&
      rightWrist.score > 0.5
    ) {
      // Calculate angles for both arms
      const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightArmAngle = calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist
      );

      const PER_THRESHOLD_UP = 105; // Angle threshold for the upward position
      const PER_THRESHOLD_DOWN = 145; // Angle threshold for the downward position

      setDumbbellCurlPosition((prevPos) => {
        if (
          leftArmAngle > PER_THRESHOLD_DOWN &&
          rightArmAngle > PER_THRESHOLD_DOWN
        ) {
          // Both arms are in the downward position
          if (prevPos === "up" && !isExerciseInProgressRef.current) {
            console.log("Dumbbell Curl: Down position detected");
            setExerciseCount((prevCount) => ({
              ...prevCount,
              "dumbbell curls": prevCount["dumbbell curls"] + 1,
            }));
            isExerciseInProgressRef.current = true; // Prevent multiple increments
          }
          return "down";
        } else if (
          leftArmAngle < PER_THRESHOLD_UP &&
          rightArmAngle < PER_THRESHOLD_UP
        ) {
          // Both arms are in the upward position
          if (prevPos === "down") {
            console.log("Dumbbell Curl: Up position detected");
            isExerciseInProgressRef.current = false; // Reset when going back up
          }
          return "up";
        }
        return prevPos; // Maintain previous position if no change
      });
    }
  };

  const detectJumpingJacks = (keypointsMap) => {
    const leftShoulder = keypointsMap["left_shoulder"];
    const rightShoulder = keypointsMap["right_shoulder"];
    const leftElbow = keypointsMap["left_elbow"];
    const rightElbow = keypointsMap["right_elbow"];
    const leftHip = keypointsMap["left_hip"];
    const rightHip = keypointsMap["right_hip"];

    if (
      leftShoulder &&
      rightShoulder &&
      leftElbow &&
      rightElbow &&
      leftHip &&
      rightHip &&
      leftShoulder.score > 0.5 &&
      rightShoulder.score > 0.5 &&
      leftElbow.score > 0.5 &&
      rightElbow.score > 0.5 &&
      leftHip.score > 0.5 &&
      rightHip.score > 0.5
    ) {
      // Function to compute angle using three points (A, B, C)
      const calculateAngle = (A, B, C) => {
        const AB = { x: A.x - B.x, y: A.y - B.y };
        const CB = { x: C.x - B.x, y: C.y - B.y };

        const dotProduct = AB.x * CB.x + AB.y * CB.y;
        const magnitudeAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
        const magnitudeCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

        const cosTheta = dotProduct / (magnitudeAB * magnitudeCB);
        return Math.acos(cosTheta) * (180 / Math.PI); // Convert to degrees
      };

      // Compute Shoulder-Elbow-Hip angles
      const leftAngle = calculateAngle(leftShoulder, leftElbow, leftHip);
      const rightAngle = calculateAngle(rightShoulder, rightElbow, rightHip);

      // Maintain a rolling average over the last 5 frames
      const angleHistory = { left: [], right: [] };
      const maxFrames = 5;

      const smoothAngle = (history, angle) => {
        history.push(angle);
        if (history.length > maxFrames) history.shift(); // Keep only the last 5 values
        return history.reduce((sum, val) => sum + val, 0) / history.length; // Average
      };

      const smoothLeftAngle = smoothAngle(angleHistory.left, leftAngle);
      const smoothRightAngle = smoothAngle(angleHistory.right, rightAngle);

      // Determine jumping jack position
      setJumpingJackPosition((prevPos) => {
        if (smoothLeftAngle > 130 && smoothRightAngle > 130) {
          // Arms are down
          if (prevPos === "up" && !isExerciseInProgressRef.current) {
            console.log("Jumping Jack: Down position detected");
            setExerciseCount((prevCount) => ({
              ...prevCount,
              "jumping jacks": prevCount["jumping jacks"] + 1,
            }));
            isExerciseInProgressRef.current = true; // Prevent multiple increments
            return "down";
          }
        } else if (smoothLeftAngle < 60 && smoothRightAngle < 60) {
          // Arms are up
          if (prevPos === "down") {
            console.log("Jumping Jack: Up position detected");
            isExerciseInProgressRef.current = false; // Allow counting again on next down
            return "up";
          }
        }

        return prevPos;
      });
    }
  };

  const drawPose = (pose, videoWidth, videoHeight) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pose || !pose.keypoints) return;

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const flippedKeypoints = pose.keypoints.map((keypoint) => ({
      ...keypoint,
      x: (videoWidth - keypoint.x) * scaleX,
      y: keypoint.y * scaleY,
    }));

    flippedKeypoints.forEach((keypoint) => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "yellow";
        ctx.fill();
      }
    });

    const skeleton = [
      ["nose", "left_eye"],
      ["nose", "right_eye"],
      ["left_eye", "left_ear"],
      ["right_eye", "right_ear"],
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_elbow"],
      ["right_shoulder", "right_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_elbow", "right_wrist"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["right_hip", "right_knee"],
      ["left_knee", "left_ankle"],
      ["right_knee", "right_ankle"],
    ];

    const keypointsMap = {};
    flippedKeypoints.forEach((kp) => {
      keypointsMap[kp.name] = kp;
    });

    skeleton.forEach(([partA, partB]) => {
      const kpA = keypointsMap[partA];
      const kpB = keypointsMap[partB];

      if (kpA && kpB && kpA.score > 0.2 && kpB.score > 0.2) {
        ctx.beginPath();
        ctx.moveTo(kpA.x, kpA.y);
        ctx.lineTo(kpB.x, kpB.y);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center bg-blend-overlay transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-10 animate-fadeIn backdrop-blur-sm bg-black/30 p-5 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tighter">
              VISIONARY <span className="text-sky-400">FITNESS</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-white">
                Session: {Math.floor(exerciseIntensity.duration)}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-sky-400" />
              <span className="text-white">
                Total Reps: {exerciseIntensity.repetitions}
              </span>
            </div>
          </div>
        </header>

        {/* Risk Monitoring Panel */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {Object.entries(riskStatus).map(
            ([type, status]) =>
              status.risk !== "low" && (
                <div
                  key={type}
                  className={`
                p-4 rounded-lg backdrop-blur-sm border
                ${
                  status.risk === "high"
                    ? "bg-red-500/20 border-red-500"
                    : "bg-yellow-500/20 border-yellow-500"
                }
              `}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        status.risk === "high"
                          ? "text-red-500"
                          : "text-yellow-500"
                      }`}
                    />
                    <h3 className="text-white font-semibold capitalize">
                      {type} Risk: {status.risk}
                    </h3>
                  </div>
                  <p className="text-gray-300 mt-1 text-sm">{status.message}</p>
                </div>
              )
          )}
        </div>

        {/* Exercise Selection and Stats */}
        <div className="mb-6 backdrop-blur-sm bg-black/30 p-5 rounded-2xl border border-zinc-800">
          <h2 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
            <span>{currentExercise || "Select Exercise"}</span>
            {currentExercise && (
              <span className="text-sky-400 text-2xl">
                Count: {exerciseCount[currentExercise.toLowerCase()]} |
                Position: {getPosition(currentExercise)}
              </span>
            )}
          </h2>
          <div className="flex gap-3 flex-wrap">
            {[
              "Pushups",
              "Squats",
              "Pullups",
              "Jumping Jacks",
              "Dumbbell Curls",
            ].map((exercise) => (
              <button
                key={exercise}
                onClick={() => handleExerciseChange(exercise)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentExercise === exercise
                    ? "bg-sky-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {exercise}
              </button>
            ))}
          </div>
        </div>

        {/* Breathing Indicator */}
        {currentExercise && (
          <div
            className={`mb-4 text-center p-3 rounded-lg backdrop-blur-sm border border-sky-500/50 
            ${
              breathingPhase === "inhale" ? "bg-sky-500/20" : "bg-indigo-500/20"
            }
            transform transition-all duration-1000 ${
              breathingPhase === "inhale" ? "scale-100" : "scale-90"
            }`}
          >
            <p className="text-white text-lg font-medium">
              {breathingPhase === "inhale" ? "Inhale 🫁" : "Exhale 💨"}
            </p>
          </div>
        )}

        {/* Webcam Display */}
        <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden border border-zinc-800">
          <Webcam
            ref={webcamRef}
            videoConstraints={{
              facingMode: "user",
              width: 640,
              height: 480,
            }}
            audio={false}
            screenshotFormat="image/jpeg"
            onUserMediaError={(e) => console.log("Webcam Error:", e)}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full bg-transparent"
            width={640}
            height={480}
          />
        </div>
      </div>
    </div>
  );
};

export default ExerciseApp2;
