import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import ClientPortal from './components/Client';
import DriverPortal from './components/Driver'; 

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/client" element={<ClientPortal />} />
        <Route path="/driver" element={<DriverPortal />} />
      </Routes>
    </Router>
  );
};

export default App;
