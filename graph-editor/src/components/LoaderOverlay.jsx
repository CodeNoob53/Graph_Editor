import React from 'react';
import '../styles/LoaderOverlay.css';

function LoaderOverlay({ loading }) {
  return (
    <div id="overlay" className={loading ? 'active' : ''}>
      <div className="loader-content">
        <div className="loader">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 66" className="spinner">
            <circle stroke="url(#gradient)" r="20" cy="33" cx="33" strokeWidth="1" fill="transparent" className="path"></circle>
            <linearGradient id="gradient">
              <stop stopOpacity="1" stopColor="#fe0000" offset="0%"></stop>
              <stop stopOpacity="0" stopColor="#af3dff" offset="100%"></stop>
            </linearGradient>
          </svg> 
        </div>
        <div className="loader-text">
          <div className="title">Calculate</div>
          <div className="subtitle">Please wait...</div>
        </div>
      </div>
    </div>
  );
}

export default LoaderOverlay;
