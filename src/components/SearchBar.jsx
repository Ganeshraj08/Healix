import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { searchFoods } from "../utils/api";

export const SearchBar = ({ onFoodSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const performSearch = async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const foods = await searchFoods(query);
          setResults(foods);
          setShowSuggestions(true);
        } catch (error) {
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowSuggestions(false);
      }
    };

    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = window.setTimeout(performSearch, 500);
    }

    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSearch = async () => {
    if (query.length >= 2) {
      setIsLoading(true);
      try {
        const foods = await searchFoods(query);
        setResults(foods);
        setShowSuggestions(true);
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food..."
          className="w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none "
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Search size={25} />
        </button>
      </div>

      {isLoading && (
        <div className="absolute w-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          Loading...
        </div>
      )}

      {showSuggestions && results.length > 0 && (
        <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {results.map((food) => (
            <div
              key={food.fdcId}
              onClick={() => {
                onFoodSelect(food);
                setShowSuggestions(false);
                setQuery("");
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className="font-medium dark:text-white">
                {food.description}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {food.calories.toFixed(0)} kcal | {food.protein.toFixed(1)}g
                protein per {food.servingSize}
                {food.servingUnit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
