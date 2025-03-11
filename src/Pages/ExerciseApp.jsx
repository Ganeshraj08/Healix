import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import {
  Activity,
  ChevronRight,
  Timer,
  Dumbbell,
  Flame,
  History,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

// Exercise information with calories per rep
const exerciseInfo = {
  Pushups: {
    description:
      "A classic upper body exercise that targets chest, shoulders, and triceps.",
    instructions:
      "1. Start in plank position\n2. Lower body until chest nearly touches ground\n3. Push back up to starting position\n4. Keep body straight throughout",
    caloriesPerRep: 0.5,
    image: "https://www.vecteezy.com/vector-art/162135-push-up-pose-vector",
  },
  Squats: {
    description:
      "A fundamental lower body exercise targeting quads, hamstrings, and glutes.",
    instructions:
      "1. Stand with feet shoulder-width apart\n2. Lower body as if sitting back into a chair\n3. Keep chest up and back straight\n4. Return to standing position",
    caloriesPerRep: 0.3,
    image:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=2369&ixlib=rb-4.0.3",
  },
  "Overhead Press": {
    description:
      "An advanced upper body exercise targeting shoulders and triceps.",
    instructions:
      "1. Stand with feet shoulder-width apart\n2. Hold barbell at shoulder level with an overhand grip\n3. Press barbell overhead until arms are fully extended\n4. Lower barbell back to shoulder level with control\n5. Keep core engaged and maintain proper posture throughout",
    caloriesPerRep: 1,
    image:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a34?auto=format&fit=crop&q=80&w=2376&ixlib=rb-4.0.3",
  },
  "Dumbbell Curls": {
    description: "An isolation exercise targeting the biceps muscles.",
    instructions:
      "1. Stand with dumbbells at sides\n2. Curl weights toward shoulders\n3. Lower with control\n4. Keep elbows close to body",
    caloriesPerRep: 0.4,
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=2370&ixlib=rb-4.0.3",
  },
  "Jumping Jacks": {
    description:
      "A full-body cardio exercise that raises heart rate and improves coordination.",
    instructions:
      "1. Start with feet together, arms at sides\n2. Jump feet apart while raising arms\n3. Jump back to starting position\n4. Maintain rhythm",
    caloriesPerRep: 0.2,
    image:
      "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=2370&ixlib=rb-4.0.3",
  },
};

const ExerciseApp = () => {
  const workoutPlan = [
    { name: "Pushups", reps: 5 },
    { name: "Squats", reps: 5 },
    { name: "Overhead Press", reps: 3 },
    { name: "Dumbbell Curls", reps: 4 },
    { name: "Jumping Jacks", reps: 5 },
  ];

  const [workoutHistory, setWorkoutHistory] = useState(() => {
    const saved = localStorage.getItem("workoutHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState(null);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [exerciseCount, setExerciseCount] = useState({
    pushups: 0,
    squats: 0,
    "overhead press": 0,
    "dumbbell curls": 0,
    "jumping jacks": 0,
  });

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1);
  const [currentExercise, setCurrentExercise] = useState("");
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

  // Timer states
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef(null);
  const [exerciseTimes, setExerciseTimes] = useState(
    Array(workoutPlan.length).fill(0)
  );

  const isExerciseInProgressRef = useRef(false);
  const isDetectionActive = useRef(false);

  const [overheadpressPosition, setoverheadpressPosition] = useState("up");
  const [pushupPosition, setPushupPosition] = useState("up");
  const [squatPosition, setSquatPosition] = useState("up");
  const [dumbbellCurlPosition, setDumbbellCurlPosition] = useState("down");
  const [jumpingJackPosition, setJumpingJackPosition] = useState("down");

  const [riskStatus, setRiskStatus] = useState({
    cramps: { risk: "low", message: "" },
    heartAttack: { risk: "low", message: "" },
  });

  const [exerciseIntensity, setExerciseIntensity] = useState({
    duration: 0,
    repetitions: 0,
    startTime: Date.now(),
  });

  const getPosition = useCallback(
    (exercise) => {
      if (!exercise) return "";
      switch (exercise.toLowerCase()) {
        case "pushups":
          return pushupPosition;
        case "squats":
          return squatPosition;
        case "overhead press":
          return overheadpressPosition;
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
      overheadpressPosition,
      dumbbellCurlPosition,
      jumpingJackPosition,
    ]
  );

  // Breathing animation state
  const [breathingPhase, setBreathingPhase] = useState("inhale");
  const lastUpdateTime = useRef(Date.now());

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
        } else if (repsPerMinute > 10) {
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
      if (!keypoints || !isDetectionActive.current) return;

      const keypointsMap = {};
      keypoints.forEach((kp) => {
        keypointsMap[kp.name] = kp;
      });

      const currentExerciseName = workoutPlan[currentExerciseIndex]?.name;

      // Only detect the current exercise
      switch (currentExerciseName) {
        case "Pushups":
          detectPushup(keypointsMap);
          break;
        case "Squats":
          detectSquat(keypointsMap);
          break;
        case "Overhead Press":
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
    [currentExerciseIndex]
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
        case "Overhead Press":
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
        // console.log("Detected Pose:", poses[0]);
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

  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
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

  const calculateTotalCalories = () => {
    let total = 0;
    Object.entries(exerciseCount).forEach(([exercise, count]) => {
      const exerciseName = exercise
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      total += count * (exerciseInfo[exerciseName]?.caloriesPerRep || 0);
    });
    return total;
  };

  const calculateTotalTime = () => {
    return exerciseTimes.reduce((total, num) => total + num, 0);
  };

  const completeWorkout = () => {
    const totalCalories = calculateTotalCalories();
    const totalTime = calculateTotalTime();
    const summary = {
      date: new Date().toISOString(),
      calories: totalCalories,
      duration: totalTime,
      exercises: Object.entries(exerciseCount).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      })),
    };

    setWorkoutHistory((prev) => {
      const newHistory = [...prev, summary];
      localStorage.setItem("workoutHistory", JSON.stringify(newHistory));
      return newHistory;
    });

    setWorkoutSummary(summary);
    stopTimer();
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
      setoverheadpressPosition((prevPos) => {
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
            "overhead press": prevCount["overhead press"] + 1,
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

  const startTimer = () => {
    setIsTimerActive(true);
    setTimer(0); // Reset timer to 0
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerActive(false);
  };

  const startWorkout = () => {
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0); // Start with the first exercise
    handleExerciseChange(workoutPlan[0].name);
    isDetectionActive.current = true; // Set the first exercise
    startTimer(); // Start the timer when the workout begins
  };

  const handleExerciseChange = (exercise) => {
    setCurrentExercise(exercise);
    // Reset positions and flags
    setPushupPosition("up");
    setSquatPosition("up");
    setoverheadpressPosition("up");
    setDumbbellCurlPosition("down");
    setJumpingJackPosition("down");
    isExerciseInProgressRef.current = false; // Reset progress flag

    // Add the current timer value to exerciseTimes
    setExerciseTimes((prev) => [...prev, timer]);

    // Reset timer for the new exercise
    setTimer(0);
  };

  const nextExercise = () => {
    isDetectionActive.current = false;

    setCurrentExerciseIndex((prevValue) => {
      const nextIndex = prevValue + 1;

      if (nextIndex < workoutPlan.length) {
        stopTimer();
        setExerciseTimes((prevTimes) => {
          const newTimes = [...prevTimes];
          newTimes[prevValue] = timer; // Store the time for the current exercise
          return newTimes;
        });
        handleExerciseChange(workoutPlan[nextIndex].name);
        isDetectionActive.current = true;
        startTimer();
        return nextIndex;
      } else {
        completeWorkout();
        setIsWorkoutStarted(false);
        setCurrentExerciseIndex(-1);
        setExerciseCount({
          pushups: 0,
          squats: 0,
          "Overhead Press": 0,
          "dumbbell curls": 0,
          "jumping jacks": 0,
        });
        stopTimer();
        return -1;
      }
    });
  };

  useEffect(() => {
    // Check if the current exercise's reps are completed
    const currentExerciseName =
      workoutPlan[currentExerciseIndex]?.name.toLowerCase();
    if (
      currentExerciseName &&
      exerciseCount[currentExerciseName] >=
        workoutPlan[currentExerciseIndex]?.reps
    ) {
      // Show the Next button if the current exercise is completed
      setShowNextButton(true);
    } else {
      setShowNextButton(false);
    }
  }, [exerciseCount, currentExerciseIndex, currentExercise]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center bg-blend-overlay transition-all duration-500">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-10 animate-fadeIn backdrop-blur-sm bg-black/30 p-5 rounded-2xl border border-violet-800/50">
          <div className="flex items-center gap-3">
            <Activity className="w-12 h-12 text-violet-400" />
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tighter">
              VISIONARY <span className="text-violet-400">FITNESS</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 max-md:flex-col ">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-lg 
                                  font-bold uppercase  text-xs
                                  hover:bg-violet-700 transition-all duration-300"
            >
              History
            </button>
            {isWorkoutStarted && (
              <div className="flex items-center px-3 py-1 gap-2 bg-violet-900/30 md:px-5 md:py-2.5 rounded-lg text-white border border-violet-700/50">
                <Timer className="w-5 h-5 text-violet-400" />
                <span className="font-mono text-lg">{timer}s</span>
              </div>
            )}
          </div>
        </header>

        {selectedExerciseInfo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-violet-950 rounded-2xl max-w-2xl w-full p-6 border border-violet-800/50 transform transition-all duration-300 scale-100 animate-slideIn">
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-2xl font-bold text-white">
                  {selectedExerciseInfo.name}
                </h3>
                <button
                  onClick={() => setSelectedExerciseInfo(null)}
                  className="text-violet-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <img
                src={exerciseInfo[selectedExerciseInfo.name].image}
                alt={selectedExerciseInfo.name}
                className="w-full h-56 object-cover rounded-xl mb-5 border border-violet-800/50"
              />
              <p className="text-violet-200 mb-5 text-base">
                {exerciseInfo[selectedExerciseInfo.name].description}
              </p>
              <div className="bg-violet-900/30 rounded-xl p-5 border border-violet-700/50">
                <h4 className="font-bold text-white mb-3 text-lg">
                  Instructions:
                </h4>
                <pre className="whitespace-pre-line text-violet-200 leading-relaxed">
                  {exerciseInfo[selectedExerciseInfo.name].instructions}
                </pre>
              </div>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-black rounded-2xl max-w-4xl w-full p-6 border border-violet-800/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Workout History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-violet-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="h-56 mb-6 bg-violet-900/30 p-4 rounded-xl border border-violet-700/50">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={workoutHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MM/dd")}
                      stroke="#8b5cf6"
                    />
                    <YAxis stroke="#8b5cf6" />
                    <Tooltip
                      labelFormatter={(date) =>
                        format(new Date(date), "MM/dd/yyyy")
                      }
                      contentStyle={{
                        backgroundColor: "#2e1065",
                        border: "1px solid #6d28d9",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#00ff00"
                      strokeWidth={2}
                      name="Calories Burned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                {workoutHistory.map((workout, index) => (
                  <div
                    key={index}
                    className="border-b border-violet-800/50 pb-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">
                        {format(new Date(workout.date), "MMM dd, yyyy HH:mm")}
                      </span>
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-2 text-violet-200">
                          <Timer className="w-4 h-4 text-sky-400" />
                          {workout.duration}s
                        </span>
                        <span className="flex items-center gap-2 text-violet-200">
                          <Flame className="w-4 h-4 text-red-500" />
                          {workout.calories.toFixed(1)} cal
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-violet-300">
                      {workout.exercises.map((exercise, i) => (
                        <span key={i} className="mr-5">
                          {exercise.name}: {exercise.count} reps
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {workoutSummary && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade In">
            <div className="bg-violet-950 rounded-2xl max-w-md w-full p-6 text-center border border-violet-800/50">
              <h3 className="text-2xl font-bold mb-5 text-white">
                Workout Complete! 💪
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-5 bg-violet-900/30 rounded-xl border border-violet-700/50">
                  <span className="font-medium text-white">Total Time:</span>
                  <span className="flex items-center gap-2 text-violet-200">
                    <Timer className="w-5 h-5 text-violet-400" />
                    {workoutSummary.duration}s
                  </span>
                </div>
                <div className="flex justify-between items-center p-5 bg-violet-900/30 rounded-xl border border-violet-700/50">
                  <span className="font-medium text-white">
                    Calories Burned:
                  </span>
                  <span className="flex items-center gap-2 text-violet-200">
                    <Flame className="w-5 h-5 text-violet-400" />
                    {workoutSummary.calories.toFixed(1)}
                  </span>
                </div>
                <div className="bg-violet-900/30 rounded-xl p-5 border border-violet-700/50">
                  <h4 className="font-medium mb-3 text-white">
                    Exercise Summary:
                  </h4>
                  {workoutSummary.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-xs mb-2 last:mb-0"
                    >
                      <span className="text-violet-200">{exercise.name}:</span>
                      <span className="text-violet-200">
                        {exercise.count} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setWorkoutSummary(null)}
                className="w-full px-5 py-3 bg-violet-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-violet-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!isWorkoutStarted ? (
          <div className="text-center py-20 animate-fadeIn backdrop-blur-sm bg-black/30 rounded-3xl border border-violet-800/50">
            <Dumbbell className="w-24 h-24 text-violet-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Ready to <span className="text-violet-400">Transform</span>?
            </h2>
            <p className="text-violet-200 mb-10 text-lg md:text-xl">
              Your journey to a stronger self starts here!
            </p>
            <button
              onClick={startWorkout}
              className="px-6 py-3 max-md:text-sm md:px-8 md:py-5 bg-violet-600 text-white rounded-xl font-bold text-lg uppercase tracking-wider
              shadow-lg shadow-violet-400/20 hover:bg-violet-700 transition-all duration-300"
            >
              Start Your Journey
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-gray-300 mt-1 text-sm">
                        {status.message}
                      </p>
                    </div>
                  )
              )}
            </div>

            {currentExercise && (
              <div
                className={`mb-4 text-center p-3 rounded-lg backdrop-blur-sm border 
                ${
                  breathingPhase === "inhale"
                    ? "bg-green-500/20 border-green-500/50 "
                    : "bg-orange-600/20 border-orange-500/50 "
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6  animate-slideIn">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-violet-800/50">
                <Webcam
                  ref={webcamRef}
                  videoConstraints={{
                    facingMode: "user",
                    width: 640,
                    height: 480,
                  }}
                  audio={false}
                  className="w-full h-full md:object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute  md:top-0 md:-left-2 max-md:-top-5 max-md:-left-5 w-full h-full "
                  width={640}
                  height={480}
                />
                <div className="absolute bottom-0 left-0 right-0 max-md:h-[10px] backdrop-blur-md bg-black/50 p-5">
                  <p className="text-white  max-md:relative text-center text-m max-md:bottom-3">
                    {currentExerciseIndex !== -1
                      ? `Performing: ${workoutPlan[currentExerciseIndex].name}`
                      : "Get ready for your next exercise"}
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="backdrop-blur-sm bg-black/30 rounded-2xl shadow-lg p-6 border border-violet-800/50">
                  <h2 className="text-2xl font-bold text-white mb-5">
                    Workout Progress
                  </h2>
                  <div className="space-y-3">
                    {workoutPlan.map((exercise, index) => {
                      const progress = Math.min(
                        100,
                        (exerciseCount[exercise.name.toLowerCase()] /
                          exercise.reps) *
                          100
                      );

                      return (
                        <div
                          key={exercise.name}
                          className={`rounded-xl p-5 transition-all duration-300 ${
                            index === currentExerciseIndex
                              ? "bg-violet-600/20 border-2 border-violet-500"
                              : "bg-violet-900/30 border border-violet-700/50"
                          }`}
                        >
                          <div className="flex items-center max-md:items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex justify-center flex-col gap-2">
                                <div className="flex gap-3 items-center">
                                  <h3 className="font-bold text-lg text-white">
                                    {exercise.name}
                                  </h3>
                                  <button
                                    onClick={() =>
                                      setSelectedExerciseInfo(exercise)
                                    }
                                    className="text-violet-400 hover:text-white transition-colors"
                                  >
                                    <Info className="w-5 h-5" />
                                  </button>
                                </div>

                                {index === currentExerciseIndex && (
                                  <span className="text-violet-200">
                                    Position: {getPosition(exercise.name)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-5">
                              <div className="text-lg font-mono">
                                <span className="text-white">
                                  {index < currentExerciseIndex && (
                                    <>{exercise.reps}</>
                                  )}
                                  {index === currentExerciseIndex && (
                                    <>
                                      {
                                        exerciseCount[
                                          exercise.name.toLowerCase()
                                        ]
                                      }
                                    </>
                                  )}
                                  {(currentExerciseIndex === -1 ||
                                    index > currentExerciseIndex) && (
                                    <>
                                      {
                                        exerciseCount[
                                          exercise.name.toLowerCase()
                                        ]
                                      }
                                    </>
                                  )}
                                </span>
                                <span className="text-violet-400">
                                  /{exercise.reps}
                                </span>
                              </div>
                              {index === currentExerciseIndex &&
                                showNextButton && (
                                  <>
                                    <button
                                      onClick={nextExercise}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg 
                                  font-bold uppercase tracking-wider text-xs
                                  hover:bg-green-500 transition-all duration-300 max-md:hidden"
                                    >
                                      Next
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={nextExercise}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg 
                                  font-bold uppercase tracking-wider text-xs
                                  hover:bg-green-500 transition-all duration-300 md:hidden "
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </div>
                          {index === currentExerciseIndex && (
                            <div className="mt-3 bg-violet-900/30 rounded-lg p-1">
                              <div
                                className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExerciseApp;
