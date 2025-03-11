import React, { useState, useEffect } from "react";
import { SearchBar } from "../components/SearchBar";
import { NutritionChart } from "../components/NutritionChart";
import { getDailyLogs, saveDailyLogs } from "../utils/localStorage";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const NutrientsTracker = () => {
  const [dailyLogs, setDailyLogs] = useState(() => getDailyLogs());
  const today = new Date().toISOString().split("T")[0];
  const currentLog = dailyLogs.find((log) => log.date === today) || {
    date: today,
    calories: 0,
    protein: 0,
    foods: [],
  };

  // Theme effect

  // Handle food selection
  const handleFoodSelect = (food) => {
    const updatedLogs = [...dailyLogs];
    const todayIndex = updatedLogs.findIndex((log) => log.date === today);

    if (todayIndex >= 0) {
      updatedLogs[todayIndex] = {
        ...updatedLogs[todayIndex],
        calories: updatedLogs[todayIndex].calories + food.calories,
        protein: updatedLogs[todayIndex].protein + food.protein,
        foods: [...updatedLogs[todayIndex].foods, food],
      };
    } else {
      updatedLogs.push({
        date: today,
        calories: food.calories,
        protein: food.protein,
        foods: [food],
      });
    }

    setDailyLogs(updatedLogs);
    saveDailyLogs(updatedLogs);
  };

  // Handle food deletion
  const handleFoodDelete = (index) => {
    const updatedLogs = [...dailyLogs];
    const todayIndex = updatedLogs.findIndex((log) => log.date === today);

    if (todayIndex >= 0) {
      const deletedFood = updatedLogs[todayIndex].foods[index];
      updatedLogs[todayIndex] = {
        ...updatedLogs[todayIndex],
        calories: updatedLogs[todayIndex].calories - deletedFood.calories,
        protein: updatedLogs[todayIndex].protein - deletedFood.protein,
        foods: updatedLogs[todayIndex].foods.filter((_, i) => i !== index),
      };

      setDailyLogs(updatedLogs);
      saveDailyLogs(updatedLogs);
    }
  };

  return (
    <div className="min-h-screen  dark:bg-gray-900 transition-colors max-w-[1400px] mx-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl italic font-bold  dark:text-blue-400 text-center sm:text-left">
            Nutrition Tracker
          </h1>
        </div>

        <div className="grid gap-6">
          {/* Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              Search Foods
            </h2>
            <SearchBar onFoodSelect={handleFoodSelect} />
          </div>

          {/* Summary & Today's Foods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Today's Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Calories
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {currentLog.calories.toFixed(0)}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/50 p-4 rounded-lg">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Protein
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currentLog.protein.toFixed(1)}g
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Foods */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Today's Foods
              </h2>
              <div className="max-h-48 overflow-y-auto">
                {currentLog.foods.map((food, index) => (
                  <div
                    key={`${food.fdcId}-${index}`}
                    className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        {food.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {food.calories.toFixed(0)} kcal |{" "}
                        {food.protein.toFixed(1)}g protein
                      </p>
                    </div>
                    <button
                      onClick={() => handleFoodDelete(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                      aria-label="Delete food item"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              Progress Chart
            </h2>
            <div className="w-full overflow-x-auto">
              <NutritionChart data={dailyLogs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutrientsTracker;
