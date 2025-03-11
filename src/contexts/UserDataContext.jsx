import { createContext, useContext, useState, useEffect } from "react";
import { format, isYesterday, isSameDay } from "date-fns";

const UserDataContext = createContext();

export const useUserData = () => useContext(UserDataContext);

export function UserDataProvider({ children }) {
  // Initialize state with data from localStorage
  const [moodEntries, setMoodEntries] = useState(() => {
    const saved = localStorage.getItem("moodEntries");
    return saved ? JSON.parse(saved) : [];
  });

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("streak");
    return saved ? JSON.parse(saved) : 0;
  });

  const [lastEntryDate, setLastEntryDate] = useState(() => {
    const saved = localStorage.getItem("lastEntryDate");
    return saved || null;
  });

  // Calculate streak whenever moodEntries changes
  useEffect(() => {
    if (moodEntries.length === 0) {
      setStreak(0);
      setLastEntryDate(null);
      return;
    }

    // Sort entries by date
    const sortedEntries = [...moodEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group entries by date
    const entriesByDate = sortedEntries.reduce((acc, entry) => {
      const date = format(new Date(entry.date), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});

    // Get unique dates
    const dates = Object.keys(entriesByDate);

    if (dates.length === 0) {
      setStreak(0);
      return;
    }

    // Start with 1 for the first entry
    let currentStreak = 1;
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

    // Check if the last entry was today or yesterday
    const lastDate = dates[dates.length - 1];
    if (lastDate !== today && lastDate !== yesterday) {
      setStreak(1); // Reset to 1 if chain is broken
      setLastEntryDate(lastDate);
      return;
    }

    // Count consecutive days
    for (let i = dates.length - 1; i > 0; i--) {
      const currentDate = new Date(dates[i]);
      const prevDate = new Date(dates[i - 1]);
      const dayDiff = Math.round(
        (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
    setLastEntryDate(lastDate);
  }, [moodEntries]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("moodEntries", JSON.stringify(moodEntries));
    localStorage.setItem("streak", JSON.stringify(streak));
    localStorage.setItem("lastEntryDate", lastEntryDate);
  }, [moodEntries, streak, lastEntryDate]);

  const addMoodEntry = (mood, notes) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      mood,
      notes,
    };

    setMoodEntries((prev) => [...prev, newEntry]);
  };

  const value = {
    moodEntries,
    streak,
    addMoodEntry,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}
