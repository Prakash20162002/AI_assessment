import React, { useState, useEffect, useRef } from 'react';
import './LoadingScreen.css';

/**
 * Premium DevPhoeniX Brand Loading Experience
 * @param {boolean} isReady - Flag indicating critical app initialization is complete
 * @param {function} onFinish - Callback fired after smooth exit transition completes
 * @param {string} customMessage - Contextual message (e.g. "Verifying session...", "Preparing exam...")
 */
export default function LoadingScreen({ isReady = true, onFinish, customMessage }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [statusMessage, setStatusMessage] = useState(customMessage || 'Initializing DevPhoeniX...');
  const exitTimer = useRef(null);

  // Monitor slow connection / initialization delay
  useEffect(() => {
    const slowTimer = setTimeout(() => {
      if (!isExiting) {
        setIsSlow(true);
      }
    }, 8000);

    return () => clearTimeout(slowTimer);
  }, [isExiting]);

  // Contextual status message rotation if customMessage is omitted
  useEffect(() => {
    if (customMessage) {
      setStatusMessage(customMessage);
      return;
    }

    const messages = [
      'Initializing DevPhoeniX...',
      'Verifying secure session...',
      'Preparing your digital workspace...',
      'System Ready! Revealing platform...',
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setStatusMessage(messages[idx]);
    }, 1800);

    return () => clearInterval(interval);
  }, [customMessage]);

  // Handle smooth curtain exit transition when ready
  useEffect(() => {
    if (isReady && !isExiting) {
      // Allow brief moment for smooth activation
      const timer = setTimeout(() => {
        setIsExiting(true);
        exitTimer.current = setTimeout(() => {
          if (onFinish) onFinish();
        }, 500); // matches CSS exit transition duration
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isReady, isExiting, onFinish]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className={`devphoenix-preloader ${isExiting ? 'preloader-exiting' : ''}`}
      role="status"
      aria-label="Loading DevPhoeniX Platform"
    >
      {/* Radial Background Lighting */}
      <div className="preloader-ambient-glow" />

      {/* Main Activation Stage */}
      <div className="preloader-stage">
        {/* Phoenix Emblem Hero Visual */}
        <div className="phoenix-emblem-wrap">
          <div className="phoenix-light-ring" />
          <img
            src="/favicon.png"
            alt="DevPhoeniX Emblem"
            className="phoenix-emblem-img"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
        </div>

        {/* Brand Typography */}
        <h1 className="preloader-brand-title">DEVPHOENIX</h1>
        <p className="preloader-brand-tagline">BUILDING INTELLIGENT DIGITAL ECOSYSTEMS</p>

        {/* Loading Status & Indeterminate Line */}
        <div className="preloader-status-block">
          <div className="preloader-status-text">
            <span className="preloader-dot-pulse" />
            <span>{statusMessage}</span>
          </div>

          <div className="preloader-line-track">
            <div className="preloader-line-indeterminate" />
          </div>
        </div>

        {/* Slow Connection Recovery Option */}
        {isSlow && !isExiting && (
          <div className="preloader-slow-notice">
            <span className="preloader-slow-text">Taking a little longer than expected...</span>
            <button type="button" onClick={handleRetry} className="preloader-retry-btn">
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
