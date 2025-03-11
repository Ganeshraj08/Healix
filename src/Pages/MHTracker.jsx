import { useState, useEffect } from "react";
import { useUserData } from "../contexts/UserDataContext";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSmile,
  faHeartbeat,
  faPen,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import Resources from "../components/Resources";

import { motion } from "framer-motion";

import { FaSmile, FaMeh, FaFrown } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RecommendationCard = ({ emoji, text }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center transition-transform transform hover:scale-105 w-[400px] h-[200px] flex flex-col justify-center shadow-lg hover:shadow-xl">
      <span className="text-8xl">{emoji}</span>
      <p className="mt-4 text-lg font-semibold">{text}</p>
    </div>
  );
};

function MHTracker() {
  //   const { streak } = useUserData();
  const currentDate = format(new Date(), "MMMM d, yyyy");
  const currentTime = format(new Date(), "h:mm a");
  const [isDashboard, setIsDashboard] = useState(true);
  const [isMoodTracker, setIsMoodTracker] = useState(false);
  const [isExercises, setIsExercises] = useState(false);
  const [isJournal, setIsJournal] = useState(false);

  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState("inhale");
  const [duration, setDuration] = useState(60); // Default 1 minute
  const [timeLeft, setTimeLeft] = useState(duration);
  const [meditationTime, setMeditationTime] = useState(300); // Default 5 minutes
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(meditationTime);
  const [isMeditating, setIsMeditating] = useState(false);

  // Breathing exercise timer
  useEffect(() => {
    let timer;
    if (isBreathing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsBreathing(false);
      setTimeLeft(duration);
      setPhase("inhale");
    }
    return () => clearInterval(timer);
  }, [isBreathing, timeLeft, duration]);

  // Breathing phases
  useEffect(() => {
    let phaseTimer;
    if (isBreathing) {
      phaseTimer = setInterval(() => {
        setPhase((prev) => {
          if (prev === "inhale") return "hold";
          if (prev === "hold") return "exhale";
          return "inhale";
        });
      }, 4000);
    }
    return () => clearInterval(phaseTimer);
  }, [isBreathing]);

  // Meditation timer
  useEffect(() => {
    let timer;
    if (isMeditating && meditationTimeLeft > 0) {
      timer = setInterval(() => {
        setMeditationTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (meditationTimeLeft === 0) {
      setIsMeditating(false);
      setMeditationTimeLeft(meditationTime);
    }
    return () => clearInterval(timer);
  }, [isMeditating, meditationTimeLeft, meditationTime]);

  const startBreathingExercise = () => {
    setIsBreathing(true);
    setTimeLeft(duration);
  };

  const backBreathingExercise = () => {
    setIsBreathing(false);
    setDuration(60);
    setTimeLeft(duration);
  };

  const startMeditation = () => {
    setIsMeditating(true);
    setMeditationTimeLeft(meditationTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Navigation handlers

  const changePage = (page) => {
    if (page === "dashboard") {
      setIsDashboard(true);
      setIsMoodTracker(false);
      setIsExercises(false);
      setIsJournal(false);
    } else if (page === "mood") {
      setIsDashboard(false);
      setIsMoodTracker(true);
      setIsExercises(false);
      setIsJournal(false);
    } else if (page === "exercises") {
      setIsDashboard(false);
      setIsMoodTracker(false);
      setIsExercises(true);
      setIsJournal(false);
    } else if (page === "journal") {
      setIsDashboard(false);
      setIsMoodTracker(false);
      setIsExercises(false);
      setIsJournal(true);
    }
  };

  const { addMoodEntry, moodEntries } = useUserData();
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Mood to value mapping
  const moodToValue = {
    happy: 3,
    neutral: 2,
    sad: 1,
  };

  // Recommendations mapping with 8 options for each mood
  const moodRecommendations = {
    happy: [
      { emoji: "😊", text: "Keep up the positive vibes!" },
      { emoji: "🎉", text: "Share your happiness with friends." },
      { emoji: "📝", text: "Consider journaling about what made you happy." },
      { emoji: "🌳", text: "Take a moment to appreciate nature around you." },
      { emoji: "🎶", text: "Listen to your favorite upbeat music." },
      { emoji: "🍽", text: "Treat yourself to your favorite meal." },
      { emoji: "💌", text: "Send a kind message to someone you care about." },
      { emoji: "🏆", text: "Celebrate your small wins!" },
      { emoji: "💃", text: "Dance like nobody's watching!" },
      { emoji: "🎨", text: "Express yourself through art or creativity." },
      { emoji: "📸", text: "Capture a happy moment in a photo." },
      { emoji: "🎁", text: "Surprise someone with a small gift." },
      { emoji: "🌞", text: "Spend some time in the sunshine." },
      { emoji: "🌸", text: "Buy yourself some flowers." },
      { emoji: "🧑‍🍳", text: "Cook or bake something you love." },
      { emoji: "🎉", text: "Plan a mini celebration just for you." },
      { emoji: "🎮", text: "Play your favorite game." },
      { emoji: "📚", text: "Read a book that inspires you." },
      { emoji: "🎶", text: "Sing your heart out." },
      { emoji: "💪", text: "Set a fun challenge and conquer it!" },
    ],
    neutral: [
      { emoji: "🤔", text: "Take a moment to reflect on your feelings." },
      { emoji: "🎶", text: "Listen to your favorite music." },
      { emoji: "🌱", text: "Try something new today." },
      { emoji: "🧘", text: "Practice a short breathing exercise." },
      { emoji: "📚", text: "Read an interesting article or book." },
      { emoji: "📝", text: "Write down one thing you're grateful for." },
      { emoji: "🚶", text: "Take a short walk and clear your mind." },
      { emoji: "☕", text: "Enjoy a warm cup of tea or coffee." },
      { emoji: "📖", text: "Start a new book or podcast." },
      { emoji: "💻", text: "Learn something new online." },
      { emoji: "🧩", text: "Solve a puzzle or brain game." },
      { emoji: "🎥", text: "Watch an inspiring documentary." },
      { emoji: "🖌", text: "Doodle or sketch something." },
      { emoji: "🧹", text: "Organize your space for clarity." },
      { emoji: "🍽", text: "Cook a comforting meal." },
      { emoji: "🧡", text: "Practice some self-compassion." },
      { emoji: "💡", text: "Write down a few goals for the week." },
      { emoji: "🌳", text: "Spend some quiet time in nature." },
      { emoji: "🎼", text: "Try listening to instrumental music." },
      { emoji: "📅", text: "Plan something exciting for the weekend." },
    ],
    sad: [
      { emoji: "💌", text: "Reach out to a friend or family member." },
      { emoji: "🧘", text: "Try a short meditation or breathing exercise." },
      { emoji: "📝", text: "Consider writing down your feelings." },
      { emoji: "🌳", text: "Go for a walk or do some light exercise." },
      { emoji: "🎥", text: "Watch a funny movie or read a good book." },
      { emoji: "☕", text: "Drink a warm cup of tea and relax." },
      { emoji: "🛀", text: "Take a break and do something calming." },
      {
        emoji: "🌈",
        text: "Remind yourself that tough times don’t last forever.",
      },
      { emoji: "🧡", text: "Practice self-kindness and patience." },
      { emoji: "🎶", text: "Listen to soothing or uplifting music." },
      { emoji: "📖", text: "Journal about things that bring you hope." },
      { emoji: "💌", text: "Write a letter to your future self." },
      { emoji: "🎨", text: "Create something expressive." },
      { emoji: "🧸", text: "Cuddle up with a soft blanket or pet." },
      { emoji: "🍽", text: "Treat yourself to comfort food." },
      { emoji: "🌙", text: "Get a good night’s rest." },
      { emoji: "💬", text: "Talk to someone you trust." },
      { emoji: "📺", text: "Watch a nostalgic, feel-good show." },
      { emoji: "💪", text: "Remember how far you’ve come." },
      { emoji: "🧘", text: "Practice progressive muscle relaxation." },
    ],
  };

  const getRandomRecommendation = (mood, usedRecommendations) => {
    const options = moodRecommendations[mood];
    const availableOptions = options.filter(
      (option) => !usedRecommendations.has(option.text)
    );

    if (availableOptions.length === 0) {
      return null; // No more unique recommendations available
    }

    const randomIndex = Math.floor(Math.random() * availableOptions.length);
    return availableOptions[randomIndex]; // This will return an object with emoji and text
  };

  // Prepare data for the graph
  const chartData = {
    labels: moodEntries
      .slice(-7)
      .map((entry) =>
        new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" })
      ),
    datasets: [
      {
        label: "Mood Over Time",
        data: moodEntries.slice(-7).map((entry) => moodToValue[entry.mood]),
        borderColor: "rgb(14, 165, 233)",
        backgroundColor: "rgba(14, 165, 233, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          callback: (value) => ["", "Sad", "Neutral", "Happy"][value],
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setRecommendations([]); // Clear recommendations when mood is selected
  };

  const handleSubmit = () => {
    if (selectedMood) {
      addMoodEntry(selectedMood, notes);
      setSelectedMood(null);
      setNotes("");
      setSubmitted(true);

      const uniqueRecommendations = new Set();
      const newRecommendations = [];

      while (
        newRecommendations.length < 3 &&
        uniqueRecommendations.size < moodRecommendations[selectedMood].length
      ) {
        const recommendation = getRandomRecommendation(
          selectedMood,
          uniqueRecommendations
        );
        if (recommendation) {
          newRecommendations.push(recommendation);
          uniqueRecommendations.add(recommendation.text); // Add to the set to avoid duplicates
        }
      }

      setRecommendations(newRecommendations); // Set the unique recommendations
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("journalEntries");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  const handleSave = () => {
    if (entry.trim()) {
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        content: entry,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setEntry("");
    }
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        {isDashboard && (
          <>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-2xl md:text-3xl italic font-bold">
                  Welcome to MindWell
                </h1>
                <div className="text-right">
                  <p className="text-lg font-medium">{currentDate}</p>
                  <p className="text-gray-600">{currentTime}</p>
                </div>
              </div>

              <div className="shadow-lg p-6 md:p-10 rounded-2xl max-w-[1000px] m-auto">
                <h2 className="text-xl font-semibold mb-4">Daily Quote</h2>
                <p className="italic text-lg">
                  "Happiness can be found even in the darkest of times, if one
                  only remembers to turn on the light."
                </p>
                <p className="text-right mt-2">- J.K. Rowling</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                <div
                  onClick={() => changePage("mood")}
                  className="card rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white shadow-lg transform transition-transform duration-300 hover:scale-105"
                >
                  <FontAwesomeIcon icon={faSmile} className="text-4xl mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    Log Today's Mood
                  </h2>
                  <p className="text-sm">
                    Tap to share how you're feeling today!
                  </p>
                </div>

                <div
                  onClick={() => changePage("exercises")}
                  className="card rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white shadow-lg transform transition-transform duration-300 hover:scale-105"
                >
                  <FontAwesomeIcon
                    icon={faHeartbeat}
                    className="text-4xl mb-4"
                  />
                  <h2 className="text-xl font-semibold mb-2">
                    Start Breathing Exercise
                  </h2>
                  <p className="text-sm">Relax and rejuvenate your mind.</p>
                </div>

                <div
                  onClick={() => changePage("journal")}
                  className="card rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 p-6 text-white shadow-lg transform transition-transform duration-300 hover:scale-105"
                >
                  <FontAwesomeIcon icon={faPen} className="text-4xl mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    Write in Journal
                  </h2>
                  <p className="text-sm">
                    Capture your thoughts and reflections.
                  </p>
                </div>
              </div>

              {/* Embedded Mental Health App */}
              <div className="mt-8 h-full">
                <h2 className="text-xl font-semibold mb-4">
                  Mental Health Resources
                </h2>
                <iframe
                  src="https://mental-health-lkbfprjdh9utfyz593luxi.streamlit.app/?embed=true"
                  width="100%"
                  height="600"
                  style={{ border: "1px solid #ccc", borderRadius: "16px" }}
                  allowFullScreen
                  title="Mental Health App"
                ></iframe>
              </div>
            </div>

            <Resources />
          </>
        )}
        {isMoodTracker && (
          <div className="space-y-6">
            <button
              onClick={() => changePage("dashboard")}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-bold">Mood Tracker</h1>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                How are you feeling today?
              </h2>

              <div className="flex flex-col md:flex-row justify-center space-x-0 md:space-x-8 mb-6">
                <button
                  onClick={() => handleMoodSelect("happy")}
                  className={`flex flex-col items-center space-y-2 transition-all ${
                    selectedMood === "happy"
                      ? "text-primary-600 scale-110"
                      : "hover:text-primary-600"
                  }`}
                >
                  <FaSmile className="text-4xl" />
                  <span>Happy</span>
                </button>

                <button
                  onClick={() => handleMoodSelect("neutral")}
                  className={`flex flex-col items-center space-y-2 transition-all ${
                    selectedMood === "neutral"
                      ? "text-primary-600 scale-110"
                      : "hover:text-primary-600"
                  }`}
                >
                  <FaMeh className="text-4xl" />
                  <span>Neutral</span>
                </button>

                <button
                  onClick={() => handleMoodSelect("sad")}
                  className={`flex flex-col items-center space-y-2 transition-all ${
                    selectedMood === "sad"
                      ? "text-primary-600 scale-110"
                      : "hover:text-primary-600"
                  }`}
                >
                  <FaFrown className="text-4xl" />
                  <span>Sad</span>
                </button>
              </div>

              {selectedMood && (
                <div className="mb-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add some notes about your mood..."
                    className="w-full p-2 border border-gray-300 rounded"
                    rows="4"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                className={`mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all ${
                  !selectedMood ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!selectedMood}
              >
                Submit Mood
              </button>

              {submitted && (
                <div className="text-green-500">Mood entry submitted!</div>
              )}

              {recommendations.length > 0 && (
                <div className="mt-4 flex flex-col gap-4">
                  <h3 className="text-lg font-semibold">Recommendations:</h3>
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
                    {recommendations.map((recommendation) => (
                      <RecommendationCard
                        key={recommendation.text}
                        emoji={recommendation.emoji}
                        text={recommendation.text}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card max-w-[1000px]">
              <h2 className="text-xl font-semibold mb-4">Mood Over Time</h2>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
        {isExercises && (
          <>
            <div className="space-y-6">
              <button
                onClick={() => changePage("dashboard")}
                className="flex items-center text-indigo-600 hover:text-indigo-500"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Dashboard
              </button>

              <h1 className="text-2xl md:text-3xl font-bold italic">
                Mindfulness Exercises
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card shadow-xl p-6 md:p-10 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">
                    Breathing Exercise
                  </h2>
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale:
                          phase === "inhale" ? 1.5 : phase === "hold" ? 1.5 : 1,
                      }}
                      transition={{ duration: 4 }}
                      className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 text-white mb-4"
                    />
                    <p className="text-xl mt-7 mb-2">
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </p>
                    <p className="text-2xl mb-4">{formatTime(timeLeft)}</p>

                    {!isBreathing && (
                      <div className="mb-4 border-1 border-black">
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="input-field border-1 border-black"
                        >
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                          <option value={180}>3 minutes</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2 justify-center items-center">
                      <button
                        onClick={startBreathingExercise}
                        disabled={isBreathing}
                        className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-600 px-5 py-2 rounded-md text-white text-lg"
                      >
                        {isBreathing
                          ? "Exercise in Progress..."
                          : "Start Breathing Exercise"}
                      </button>
                      {isBreathing && (
                        <button
                          onClick={backBreathingExercise}
                          className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-600 px-5 py-2 rounded-md text-white text-lg"
                        >
                          Back
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card shadow-xl p-6 md:p-10 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">
                    Meditation Timer
                  </h2>
                  <div className="flex flex-col items-center">
                    <p className="text-6xl font-bold mb-4">
                      {formatTime(meditationTimeLeft)}
                    </p>

                    {!isMeditating && (
                      <div className="mb-4">
                        <select
                          value={meditationTime}
                          onChange={(e) =>
                            setMeditationTime(Number(e.target.value))
                          }
                          className="input-field"
                        >
                          <option value={300}>5 minutes</option>
                          <option value={600}>10 minutes</option>
                          <option value={900}>15 minutes</option>
                          <option value={1200}>20 minutes</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-4 justify-center items-center">
                      <button
                        onClick={startMeditation}
                        disabled={isMeditating}
                        className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-600 px-5 py-2 rounded-md text-white text-lg"
                      >
                        {isMeditating
                          ? "Meditation in Progress..."
                          : "Start Meditation"}
                      </button>
                      {isBreathing && (
                        <button
                          onClick={backBreathingExercise}
                          className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-600 px-5 py-2 rounded-md text-white text-lg"
                        >
                          Back
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isJournal && (
          <>
            <div className="space-y-6">
              <button
                onClick={() => changePage("dashboard")}
                className="flex items-center text-blue-500 hover:text-blue-700"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl md:text-3xl font-bold">Journal</h1>

              <div className="card w-full">
                <h2 className="text-xl font-semibold mb-4">
                  Write Your Thoughts
                </h2>
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="How are you feeling today? What's on your mind?"
                  className="input-field h-64 resize-none mb-4 w-full p-5"
                />
                <button
                  onClick={handleSave}
                  disabled={!entry.trim()}
                  className={`${
                    !entry.trim() ? "opacity-50 cursor-not-allowed " : ""
                  }`}
                >
                  Save Entry
                </button>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Previous Entries</h2>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(entry.date), "MMMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No journal entries yet. Start writing to see your entries
                      here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MHTracker;
