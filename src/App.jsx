import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

// Import your components for different routes
import ExerciseApp from "./Pages/ExerciseApp";
import NutrientsTracker from "./Pages/NutrientsTracker";
import Home from "./Pages/Home";
import MHTracker from "./Pages/MHTracker";

const App = () => {
  const [isVF, setisVF] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="bg-white text-gray-900 min-h-screen">
        {/* Header */}
        <header
          className={`p-4 md:p-6 transition-colors duration-500 shadow-md ${
            isVF ? "bg-violet-300" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center max-w-[1400px] mx-auto">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => setisVF(false)}
              className="text-3xl md:text-5xl font-bold"
            >
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-700 text-transparent bg-clip-text">
                HEALIx
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 text-lg">
              {[
                { name: "Mental Health Coach", path: "/mental-health-coach" },
                {
                  name: "Visionary Fitness",
                  path: "/visionary-fitness",
                  vf: true,
                },
                { name: "Nutrients Tracker", path: "/nutrients-tracker" },
              ].map(({ name, path, vf }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setisVF(vf || false)}
                  className="hover:text-violet-700 hover:underline transition"
                >
                  {name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-800 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <nav className="md:hidden bg-white shadow-lg mt-2 p-4 rounded-lg">
              {[
                { name: "Mental Health Coach", path: "/mental-health-coach" },
                {
                  name: "Visionary Fitness",
                  path: "/visionary-fitness",
                  vf: true,
                },
                { name: "Nutrients Tracker", path: "/nutrients-tracker" },
              ].map(({ name, path, vf }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => {
                    setisVF(vf || false);
                    setIsMenuOpen(false);
                  }}
                  className="block py-2 text-lg text-gray-700 hover:text-violet-700 transition"
                >
                  {name}
                </Link>
              ))}
            </nav>
          )}
        </header>

        {/* Routes */}
        <main >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visionary-fitness" element={<ExerciseApp />} />
            <Route path="/nutrients-tracker" element={<NutrientsTracker />} />
            <Route path="/mental-health-coach" element={<MHTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
