import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Page components
import Home from './pages/Home';
import SketchGallery from './pages/SketchGallery';
import SketchEditor from './pages/SketchEditor';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<SketchGallery />} />
          <Route path="/sketch/:sketchId" element={<SketchEditor />} />
          <Route path="/new" element={<SketchEditor isNew={true} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;