import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, MapPin } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleClientNavigation = () => {
    navigate('/client');
  };

  const handleDriverNavigation = () => {
    navigate('/driver'); // Optional: route for drivers later
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl text-center">
        {/* Header */}
        <header className="mb-10 md:mb-16">
          <MapPin className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-600 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-700 tracking-tight">
            Smart Waste Route Planner
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mt-3 md:mt-4 max-w-2xl mx-auto">
            Optimizing waste collection with intelligent routing for a cleaner, greener community.
          </p>
        </header>

        {/* Navigation Buttons */}
        <main className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Client Portal */}
            <button
              onClick={handleClientNavigation}
              aria-label="Navigate to Client Portal"
              className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-2xl focus-visible:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:ring-opacity-75"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-sky-500 rounded-full mb-5 group-hover:bg-sky-600 transition-colors duration-300">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-sky-700 group-hover:text-sky-800 transition-colors duration-300">
                  Client Portal
                </h2>
                <p className="text-gray-500 mt-2.5 text-sm sm:text-base">
                  Access your collection schedule, request services, and manage your account.
                </p>
              </div>
            </button>

            {/* Driver Dashboard */}
            <button
              onClick={handleDriverNavigation}
              aria-label="Navigate to Driver Dashboard"
              className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-2xl focus-visible:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-opacity-75"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-emerald-500 rounded-full mb-5 group-hover:bg-emerald-600 transition-colors duration-300">
                  <Truck className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors duration-300">
                  Driver Dashboard
                </h2>
                <p className="text-gray-500 mt-2.5 text-sm sm:text-base">
                  View optimized routes, update collection status, and access operational tools.
                </p>
              </div>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 md:mt-20 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Smart Waste Solutions Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
