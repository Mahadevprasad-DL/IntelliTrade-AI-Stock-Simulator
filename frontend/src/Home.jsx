import React, { useState, useRef, useEffect } from "react";
import "./Home.css";
import homeImg from "./assets/home.jpeg";
import homeImg2 from "./assets/home2.jpeg";

function Home({ onRegister, onLogin }) {
  const [showGuideVideo, setShowGuideVideo] = useState(false);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  const handleGuideClick = () => {
    setShowGuideVideo(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const handleCloseVideo = () => {
    setShowGuideVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (videoContainerRef.current) {
      if (!isFullscreen) {
        if (videoContainerRef.current.requestFullscreen) {
          videoContainerRef.current.requestFullscreen();
        } else if (videoContainerRef.current.webkitRequestFullscreen) {
          videoContainerRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
          document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">IntelliTrade</div>
        <div className="nav-btns">
          <button className="login" onClick={onLogin}>Login</button>
          <button className="try" onClick={onRegister}>Register</button>
        </div>
      </nav>
      {/* HERO SECTION */}
      <div className="hero">
        {/* LEFT */}
        <div className="hero-left">
          <h1>
            AI-Driven Stock Trading Simulator with Sentiment-Based Market Insights <br /> Agent
          </h1>
          <p>
            The system must include AI-generated buy/sell signals, sentiment analysis from financial news, voice-based trading, and portfolio tracking.
          </p>
          <div className="button-group">
            <button className="try-now" onClick={onRegister}>
              Try Now →
            </button>
            <button className="guide-btn" onClick={handleGuideClick}>
              Guide
            </button>
          </div>
        </div>
        {/* RIGHT */}
        <div className="hero-right">
    
          <img src={homeImg2} className="img-top" alt="AI Top" />
        </div>
      </div>

      {/* VIDEO MODAL */}
      {showGuideVideo && (
        <div className="video-modal-overlay" onClick={handleCloseVideo}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h2>Platform Guide</h2>
              <button className="video-close-btn" onClick={handleCloseVideo}>✕</button>
            </div>
            <div className="video-wrapper" ref={videoContainerRef}>
              <video
                ref={videoRef}
                className="video-player"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error("Video playback error:", e);
                }}
              >
                <source src="/data/v.mp4" type="video/mp4" />
                <p>Your browser does not support the video tag or the video file could not be loaded.</p>
              </video>

              {/* CUSTOM CONTROLS AT BOTTOM */}
              <div className="video-controls-bar">
                {/* PROGRESS BAR */}
                <div className="progress-container">
                  <input
                    type="range"
                    className="progress-bar"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleProgressChange}
                  />
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="controls-bottom">
                  {/* LEFT CONTROLS */}
                  <div className="controls-left">
                    <button
                      className="control-btn play-pause-btn"
                      onClick={handlePlayPause}
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>

                    <div className="volume-control">
                      <button
                        className="control-btn volume-btn"
                        title="Mute"
                      >
                        {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                      </button>
                      <input
                        type="range"
                        className="volume-slider"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        title="Volume"
                      />
                    </div>

                    <span className="time-display">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* RIGHT CONTROLS */}
                  <div className="controls-right">
                    <button
                      className="control-btn fullscreen-btn"
                      onClick={handleFullscreen}
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? "⛶" : "⛶"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;