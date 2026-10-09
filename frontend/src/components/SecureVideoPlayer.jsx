import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Settings, 
  Shield, 
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { videoService, progressService } from '../services/lmsServices';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SecureVideoPlayer({ 
  lessonId, 
  initialTime = 0, 
  onEnded, 
  onProgressUpdate,
  courseId 
}) {
  const { user } = useAuth();
  const { platformSettings } = useTheme();

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isCompletedState, setIsCompletedState] = useState(false);

  // Dynamic forensic watermark coordinates
  const [watermarkPos, setWatermarkPos] = useState({ x: 20, y: 30 });

  // 1. Fetch ephemeral video token and stream URL
  useEffect(() => {
    let isMounted = true;
    async function loadVideo() {
      setLoading(true);
      setError(null);
      setIsCompletedState(false);
      try {
        const tokenData = await videoService.getVideoToken(lessonId);
        if (!isMounted) return;
        setStreamUrl(tokenData.streamUrl);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Unable to authorize video playback. Please ensure your enrollment is active.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (lessonId) {
      loadVideo();
    }

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  // 2. Set initial resume timestamp once video metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      if (initialTime > 0 && initialTime < dur - 5) {
        videoRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
    }
  };

  // 3. Dynamic Canvas Forensic Watermark Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !platformSettings.watermark_enabled) return;
    const ctx = canvas.getContext('2d');

    const updateWatermarkCanvas = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const watermarkText = `${user?.email || 'authenticated-student'} • ID:${user?.id || 0} • SECURE STREAM`;
      ctx.font = '500 13px Inter, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${platformSettings.watermark_opacity || 0.22})`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;

      // Draw primary rotating position
      ctx.fillText(watermarkText, watermarkPos.x, watermarkPos.y);

      // Subtle second faint watermark in opposite quadrant
      const oppositeX = (watermarkPos.x + width / 2) % (width - 150);
      const oppositeY = (watermarkPos.y + height / 2) % (height - 40) + 20;
      ctx.fillText(`PROTECTED LMS ASSET`, oppositeX, oppositeY);
    };

    updateWatermarkCanvas();

    // Randomize position every N seconds to frustrate screen recoders
    const intervalSec = (platformSettings.watermark_interval_seconds || 12) * 1000;
    const intervalId = setInterval(() => {
      if (canvas) {
        const maxX = Math.max(50, canvas.width - 250);
        const maxY = Math.max(50, canvas.height - 50);
        setWatermarkPos({
          x: Math.floor(Math.random() * maxX) + 20,
          y: Math.floor(Math.random() * maxY) + 30
        });
      }
    }, intervalSec);

    return () => clearInterval(intervalId);
  }, [watermarkPos, user, platformSettings]);

  // Synchronize canvas dimensions with video container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Progress Heartbeat & Auto-Save (Every 8 seconds)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        if (dur > 0) {
          progressService.saveProgress(lessonId, {
            currentTime: time,
            duration: dur,
            isCompleted: (time / dur) >= 0.9
          }).then((res) => {
            if (onProgressUpdate) onProgressUpdate(res);
            if (res?.isCompleted && !isCompletedState) {
              setIsCompletedState(true);
            }
          }).catch((err) => {
            console.warn('Progress heartbeat failed:', err);
          });
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isPlaying, lessonId, duration, onProgressUpdate, isCompletedState]);

  // Video time update event
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      const dur = videoRef.current.duration || duration;
      if (dur > 0 && (cur / dur) >= 0.9 && !isCompletedState) {
        setIsCompletedState(true);
      }
    }
  };

  // Video ended event
  const handleEnded = () => {
    setIsPlaying(false);
    setIsCompletedState(true);
    if (videoRef.current) {
      progressService.saveProgress(lessonId, {
        currentTime: videoRef.current.duration,
        duration: videoRef.current.duration,
        isCompleted: true
      });
    }
    if (onEnded) onEnded();
  };

  // Video controls functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const changeSpeed = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setIsSpeedMenuOpen(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Keyboard shortcuts (Space to toggle, prevent save/inspect shortcuts)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return;
    }
    if (e.code === 'Space' && (e.target === containerRef.current || e.target === videoRef.current)) {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={() => setShowControls(true)}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#020617',
        borderRadius: isFullscreen ? '0px' : 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        outline: 'none',
        userSelect: 'none'
      }}
    >
      {/* 1. Loading State */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: '#090d16',
          color: 'var(--color-text-secondary)',
          zIndex: 20
        }}>
          <Loader2 className="pulse-active" size={40} color="var(--color-primary)" />
          <div style={{ fontSize: '0.925rem' }}>Verifying Ephemeral Playback Signature...</div>
        </div>
      )}

      {/* 2. Error State */}
      {error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: '#090d16',
          color: 'var(--color-text-primary)',
          zIndex: 20
        }}>
          <AlertTriangle size={42} color="var(--color-danger)" style={{ marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Protected Stream Access Denied</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
            {error}
          </p>
        </div>
      )}

      {/* 3. HTML5 Video Tag with Anti-Download Attributes */}
      {streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          controlsList="nodownload nofullscreen nopictureinpicture"
          disablePictureInPicture={true}
          playsInline={true}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            cursor: 'pointer'
          }}
        />
      )}

      {/* 4. Canvas Forensic Watermark Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      {/* Top Banner: Protected badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        fontSize: '0.75rem',
        color: '#94a3b8',
        zIndex: 15,
        opacity: showControls ? 1 : 0,
        transition: 'opacity var(--transition-fast)'
      }}>
        <Shield size={13} color="var(--color-primary)" />
        <span>Encrypted Stream • User ID: {user?.id}</span>
      </div>

      {/* Completion Pill */}
      {isCompletedState && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.25)',
          border: '1px solid var(--color-success)',
          backdropFilter: 'blur(8px)',
          fontSize: '0.75rem',
          color: 'var(--color-success)',
          fontWeight: 600,
          zIndex: 15
        }}>
          <CheckCircle2 size={14} />
          <span>Completed</span>
        </div>
      )}

      {/* Big Center Play Button when paused */}
      {!isPlaying && !loading && !error && (
        <button
          onClick={togglePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(var(--color-primary-rgb), 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.6)',
            zIndex: 15,
            transition: 'transform var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
        >
          <Play size={28} style={{ marginLeft: '4px' }} />
        </button>
      )}

      {/* 5. Custom Sleek Player Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
        padding: '1.5rem 1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 15,
        opacity: showControls || !isPlaying ? 1 : 0,
        transition: 'opacity var(--transition-normal)'
      }}>
        {/* Timeline Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              height: '5px',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-full)'
            }}
          />
        </div>

        {/* Lower Row Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
          
          {/* Left: Play/Pause, Rewind, FastForward, Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={togglePlay} style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button onClick={() => seekRelative(-10)} title="Rewind 10s" style={{ color: '#94a3b8' }}>
              <RotateCcw size={17} />
            </button>

            <button onClick={() => seekRelative(10)} title="Forward 10s" style={{ color: '#94a3b8' }}>
              <RotateCw size={17} />
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
              <button onClick={toggleMute} style={{ color: '#ffffff' }}>
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '60px',
                  height: '4px',
                  accentColor: 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Time readout */}
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Speed selector, Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            
            {/* Speed Button & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSpeedMenuOpen(prev => !prev)}
                style={{
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {playbackRate}x
              </button>

              {isSpeedMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '2.25rem',
                  right: 0,
                  background: '#111827',
                  border: '1px solid #334155',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 30
                }}>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      style={{
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: playbackRate === rate ? 'var(--color-primary)' : '#cbd5e1',
                        background: playbackRate === rate ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        textAlign: 'left'
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button onClick={toggleFullscreen} style={{ color: '#ffffff' }}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
