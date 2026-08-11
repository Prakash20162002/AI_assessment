import React, { useState, useEffect } from 'react';
import { Shield, Zap, CheckCircle2, Lock, ArrowRight, Eye, Sparkles } from 'lucide-react';
import './LoadingScreen.css';

export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Smooth progress counter animation
    const startTime = performance.now();
    const duration = 2200; // 2.2 seconds total duration

    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min((elapsed / duration) * 100, 100);

      // Ease out quad calculation for realistic natural slowing near 100%
      const easedProgress = Math.floor(
        rawProgress === 100 ? 100 : 100 * (1 - Math.pow(1 - rawProgress / 100, 2))
      );

      setProgress(easedProgress);

      if (rawProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Hold at 100% briefly before curtain fade out
        setTimeout(() => {
          triggerExit();
        }, 200);
      }
    };

    const animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, []);

  const triggerExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 600); // match transition duration in CSS
  };

  // Determine current live status phrase based on progress milestone
  const getStatusMessage = () => {
    if (progress < 25) return "Initializing AI Proctoring Engine...";
    if (progress < 50) return "Loading Security Protocols & Face Detection...";
    if (progress < 75) return "Syncing Real-Time Assessment Modules...";
    if (progress < 95) return "Configuring Anti-Cheating Sandbox...";
    return "System Ready! Launching Platform...";
  };

  return (
    <div className={`preloader-overlay ${isExiting ? 'preloader-exiting' : ''}`}>
      {/* Background Animated Grids & Ambient Glows */}
      <div className="preloader-bg">
        <div className="preloader-grid" />
        <div className="preloader-glow-1" />
        <div className="preloader-glow-2" />
      </div>

      {/* Top Bar Navigation & Live Status */}
      <header className="preloader-header">
        <div className="preloader-live-badge">
          <span className="preloader-dot-pulse" />
          <span>DEVPHOENIX SECURE CORE v2.4</span>
        </div>
      </header>

      {/* Main Center Animation Stage */}
      <main className="preloader-center">
        {/* Pulsing Orbit & Brand Logo */}
        <div className="preloader-logo-stage">
          <div className="preloader-orbit-ring">
            <div className="preloader-orbit-dot" />
          </div>
          <div className="preloader-orbit-ring-outer" />

          <div className="preloader-logo-card">
            <img 
              src="/logo.png" 
              alt="DevPhoenix AI" 
              className="preloader-logo-img"
              onError={(e) => {
                // Fallback to mascot if logo is missing
                e.target.src = '/mascot.jpeg';
              }}
            />
          </div>
        </div>

        {/* Brand Header & Tagline */}
        <h1 className="preloader-title">DEVPHOENIX</h1>
        <p className="preloader-subtitle">AI-POWERED PROCTORING PLATFORM</p>

        {/* Dynamic Progress Indicator & Bar */}
        <div className="preloader-progress-block">
          <div className="preloader-percent-row">
            <span className="preloader-status-text">
              <Sparkles size={14} style={{ color: '#fcbf49' }} />
              {getStatusMessage()}
            </span>
            <span className="preloader-percent-num">{progress}%</span>
          </div>

          <div className="preloader-track">
            <div 
              className="preloader-fill" 
              style={{ width: `${progress}%` }}
            >
              <div className="preloader-fill-shimmer" />
            </div>
          </div>

          {/* Milestones */}
          <div className="preloader-milestones">
            <div className={`preloader-milestone ${progress >= 25 ? 'active' : ''}`}>
              <div className="preloader-milestone-dot" />
              <span>Core</span>
            </div>
            <div className={`preloader-milestone ${progress >= 50 ? 'active' : ''}`}>
              <div className="preloader-milestone-dot" />
              <span>AI Engine</span>
            </div>
            <div className={`preloader-milestone ${progress >= 75 ? 'active' : ''}`}>
              <div className="preloader-milestone-dot" />
              <span>Security</span>
            </div>
            <div className={`preloader-milestone ${progress >= 100 ? 'active' : ''}`}>
              <div className="preloader-milestone-dot" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Feature Badges */}
      <footer className="preloader-footer">
        <div className="preloader-feature-pill">
          <CheckCircle2 size={13} className="preloader-feature-icon" />
          <span>AI Face Detection</span>
        </div>
        <div className="preloader-feature-pill">
          <CheckCircle2 size={13} className="preloader-feature-icon" />
          <span>Gaze & Eye Tracking</span>
        </div>
        <div className="preloader-feature-pill">
          <CheckCircle2 size={13} className="preloader-feature-icon" />
          <span>Fullscreen Freeze Lock</span>
        </div>
      </footer>
    </div>
  );
}
