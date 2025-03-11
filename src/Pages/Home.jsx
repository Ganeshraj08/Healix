import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faRunning,
  faAppleAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      <main className="flex flex-col gap-10 items-center text-center px-6 md:flex-row md:text-left md:justify-between md:px-12 lg:px-24 h-full py-20 bg-gradient-to-br from-white to-sky-50 text-gray-900">
        <motion.div
          className=" md:w-1/2"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 bg-gradient-to-r from-orange-600 to-purple-500 text-transparent bg-clip-text">
            Your AI-powered health companion for a better you
          </h1>
          <p className="text-gray-700 mb-6 text-lg">
            Track your fitness, mental wellness, and nutrition—all in one
            AI-driven platform.
          </p>
          <motion.a
            className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-md hover:scale-105 transition-transform"
            href="#"
            whileHover={{ scale: 1.1 }}
          >
            Get Started
          </motion.a>
        </motion.div>
        <motion.div
          className="mt-8 md:mt-0 md:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <img
            src="https://imageio.forbes.com/specials-images/imageserve/6699b9efc8dd32a2aae52664/AI-has-significant-potential-in-the-realm-of-hyper-personalized-healthcare-/960x0.jpg?format=jpg&width=1440"
            alt="AI Health Companion"
            className="rounded-lg shadow-md w-full "
          />
        </motion.div>
      </main>

      {/* Cards Section */}
      <section className="mt-16 px-6 md:px-12 lg:px-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Mental Health Coach */}
          {[
            {
              to: "/mental-health-coach",
              icon: faBrain,
              title: "Mental Health Coach",
              text: "AI-driven therapy insights and mood tracking.",
            },
            {
              to: "/visionary-fitness",
              icon: faRunning,
              title: "Visionary Fitness",
              text: "Personalized training plans powered by AI Motion Tracking & Risk Monitoring & more.",
            },
            {
              to: "/nutrients-tracker",
              icon: faAppleAlt,
              title: "Nutrients Tracker",
              text: "Smart meal tracking and AI dietary recommendations.",
            },
          ].map((item, index) => (
            <Link to={item.to} key={index}>
              <div className="p-8  rounded-lg  shadow-md border-2 border-violet-400 bg-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-violet-700 hover:shadow-lg hover:text-white transition-transform transform hover:scale-105">
                <div className="text-4xl mb-4 flex gap-3 text-violet-600 hover:text-white">
                  <FontAwesomeIcon icon={item.icon} />
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                </div>

                <p className="text-lg">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 h-full ">
          <h2 className="text-2xl font-semibold mb-4">
            Mental Health Resources
          </h2>
          <iframe
            src="https://pundaree1-healthcare-chatbot-app-jx915u.streamlit.app/?embed=true"
            width="100%"
            height="600"
            style={{ border: "1px solid #ccc", borderRadius: "16px" }}
            allowFullScreen
            title="Healthcare & fitness coach"
            className="mx-auto"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 py-6 text-center text-gray-600 flex flex-col sm:flex-row justify-center items-center gap-4">
        <p>Built By Team Electro Mavericks.</p>
        <p>KEC Hackathon</p>
        <div className="space-x-6 flex">
          {[faTwitter, faInstagram, faLinkedin].map((icon, index) => (
            <motion.a
              key={index}
              className="text-gray-600 hover:text-gray-900 text-2xl"
              href="#"
              whileHover={{ scale: 1.2 }}
            >
              <FontAwesomeIcon icon={icon} />
            </motion.a>
          ))}
        </div>
      </footer>
    </>
  );
};

export default Home;
