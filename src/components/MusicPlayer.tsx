"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const tracks = [
  {
    title: "Awesome Song Title",
    artist: "Amazing Artist",
    src: "/track-1.mp3",
  },
  {
    title: "Safe and Sound",
    artist: "Free Music Lab",
    src: "/track-2.mp3",
  },
  {
    title: "Purple Echoes",
    artist: "Luna Fields",
    src: "/track-3.mp3",
  },
];

export function MusicPlayer() {
  const defaultDurationSeconds = 225;
  const [playerState, setPlayerState] = useState<
    "playing" | "paused" | "loading"
  >("paused");
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(
    defaultDurationSeconds,
  );
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingState = useRef<"playing" | "paused" | null>(null);
  const shuffleHistoryRef = useRef<number[]>([]);

  const isLoading = playerState === "loading";
  const isPlaying = playerState === "playing";
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);
  const activeTrack = tracks[trackIndex];
  const progress =
    durationSeconds > 0 ? Math.min(currentTime / durationSeconds, 1) : 0;

  const getResolvedDuration = (audio: HTMLAudioElement) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      return audio.duration;
    }

    if (audio.seekable.length > 0) {
      const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
      if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
        return seekableEnd;
      }
    }

    return defaultDurationSeconds;
  };

  const getRandomTrackIndex = useCallback((excludedIndex: number) => {
    if (tracks.length <= 1) return excludedIndex;

    let nextIndex = excludedIndex;
    while (nextIndex === excludedIndex) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    }
    return nextIndex;
  }, []);

  const resolveSkipIndex = useCallback(
    (direction: -1 | 1, currentIndex: number) => {
      if (!isShuffleEnabled) {
        return (currentIndex + direction + tracks.length) % tracks.length;
      }

      if (direction === 1) {
        shuffleHistoryRef.current.push(currentIndex);
        return getRandomTrackIndex(currentIndex);
      }

      if (shuffleHistoryRef.current.length > 0) {
        return shuffleHistoryRef.current.pop() ?? currentIndex;
      }

      return getRandomTrackIndex(currentIndex);
    },
    [getRandomTrackIndex, isShuffleEnabled],
  );

  const scheduleTrackChange = useCallback(
    (nextIndex: number, shouldPlay: boolean) => {
      if (!audioRef.current) return;

      // Control State Change Sequence step 1 (enter loading).
      pendingState.current = shouldPlay ? "playing" : "paused";
      setPlayerState("loading");

      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }

      setCurrentTime(0);
      setDurationSeconds(defaultDurationSeconds);
      setTrackIndex(nextIndex);

      // Control State Change Sequence step 2 (500ms async simulation).
      loadingTimeout.current = setTimeout(async () => {
        try {
          if (shouldPlay) {
            await audioRef.current?.play();
          } else {
            audioRef.current?.pause();
          }
        } catch (error) {
          console.error("Audio playback failed:", error);
          pendingState.current = null;
          setPlayerState("paused");
        }
      }, 500);
    },
    [defaultDurationSeconds],
  );

  const handleToggle = () => {
    if (isLoading || !audioRef.current) return;

    // NOTE: Requirement - Control State Change Sequence step 1 (enter loading).
    const shouldPlay = !isPlaying;
    pendingState.current = shouldPlay ? "playing" : "paused";
    setPlayerState("loading");

    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }

    // NOTE: Requirement - Control State Change Sequence step 2 (500ms async simulation).
    loadingTimeout.current = setTimeout(async () => {
      try {
        if (shouldPlay) {
          await audioRef.current?.play();
        } else {
          audioRef.current?.pause();
        }
      } catch (error) {
        console.error("Audio playback failed:", error);
        pendingState.current = null;
        setPlayerState("paused");
      }
    }, 500);
  };

  const handleSkip = (direction: -1 | 1) => {
    if (isLoading || !audioRef.current) return;

    const nextIndex = resolveSkipIndex(direction, trackIndex);
    scheduleTrackChange(nextIndex, isPlaying);
  };

  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = effectiveVolume;
    audioRef.current.muted = effectiveVolume === 0;
  }, [effectiveVolume]);

  // Container Animations + Background & Shadow Transitions
  const containerVariants = {
    playing: {
      backgroundColor: "#1A1A1A",
      boxShadow: "0px 0px 40px 0px #8B5CF64D",
    },
    paused: {
      backgroundColor: "#0F0F0F",
      boxShadow: "0px 4px 20px 0px rgba(0, 0, 0, 0.5)",
    },
    loading: {
      backgroundColor: "#0F0F0F",
      boxShadow: "0px 4px 20px 0px rgba(0, 0, 0, 0.5)",
    },
  };

  // Album Artwork Animations
  const artworkVariants = {
    playing: {
      scale: 1,
      rotate: 360,
      transition: {
        scale: { type: "spring", stiffness: 160, damping: 18 },
        rotate: { duration: 20, ease: "linear", repeat: Infinity },
      },
    },
    paused: {
      scale: 0.95,
      rotate: 0,
      transition: {
        scale: { type: "spring", stiffness: 160, damping: 18 },
        rotate: { duration: 0.3, ease: "easeOut" },
      },
    },
    loading: {
      scale: 0.9,
      rotate: 0,
      transition: {
        scale: { type: "spring", stiffness: 160, damping: 18 },
      },
    },
  };

  // Equalizer Bars Animation
  const barVariants = {
    playing: (index: number) => ({
      scaleY: [0.2, 1],
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: index * 0.1,
      },
    }),
    paused: {
      scaleY: 0.2,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    loading: {
      scaleY: 0.5,
      opacity: 0.5,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remaining = Math.floor(safeSeconds % 60);
    return `${minutes}:${remaining.toString().padStart(2, "0")}`;
  };

  const handleSeek = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!audioRef.current || isLoading) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickRatio = (event.clientX - rect.left) / rect.width;
    const clampedRatio = Math.min(1, Math.max(0, clickRatio));
    const resolvedDuration = getResolvedDuration(audioRef.current);
    const nextTime = clampedRatio * resolvedDuration;

    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    setDurationSeconds(resolvedDuration);
  };

  const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

  const setResolvedVolume = useCallback((nextVolume: number) => {
    const clampedVolume = clampVolume(nextVolume);
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setResolvedVolume(Number(event.currentTarget.value) / 100);
  };

  const handleVolumeStep = useCallback(
    (step: number) => {
      const baseVolume = isMuted ? 0 : volume;
      setResolvedVolume(baseVolume + step);
    },
    [isMuted, setResolvedVolume, volume],
  );

  const handleVolumeToggle = useCallback(() => {
    if (isMuted || volume === 0) {
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.6);
      }
      return;
    }

    setIsMuted(true);
  }, [isMuted, volume]);

  const handleShuffleToggle = () => {
    setIsShuffleEnabled((previous) => {
      if (!previous) {
        shuffleHistoryRef.current = [];
      }
      return !previous;
    });
  };

  const handleRepeatToggle = () => {
    setRepeatMode((previous) => {
      if (previous === "off") return "all";
      if (previous === "all") return "one";
      return "off";
    });
  };

  const handleTrackEnded = useCallback(() => {
    pendingState.current = null;

    if (!audioRef.current) {
      setPlayerState("paused");
      return;
    }

    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      scheduleTrackChange(trackIndex, true);
      return;
    }

    if (isShuffleEnabled) {
      const nextIndex = resolveSkipIndex(1, trackIndex);
      scheduleTrackChange(nextIndex, true);
      return;
    }

    const isLastTrack = trackIndex >= tracks.length - 1;
    if (isLastTrack) {
      if (repeatMode === "all") {
        scheduleTrackChange(0, true);
      } else {
        setPlayerState("paused");
      }
      return;
    }

    scheduleTrackChange(trackIndex + 1, true);
  }, [
    isShuffleEnabled,
    repeatMode,
    resolveSkipIndex,
    scheduleTrackChange,
    trackIndex,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const isTypingTarget =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable;

        if (isTypingTarget) return;
      }

      if (event.key === "ArrowUp" || event.key === "AudioVolumeUp") {
        event.preventDefault();
        handleVolumeStep(0.05);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "AudioVolumeDown") {
        event.preventDefault();
        handleVolumeStep(-0.05);
        return;
      }

      if (event.key.toLowerCase() === "m" || event.key === "AudioVolumeMute") {
        event.preventDefault();
        handleVolumeToggle();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleVolumeStep, handleVolumeToggle]);

  const actionButtonClasses = isLoading
    ? "player-primary-button is-loading cursor-not-allowed"
    : "player-primary-button";

  // State Change Sequence step 4
  return (
    <motion.div
      className="main-container mx-auto"
      variants={containerVariants}
      initial="paused"
      animate={playerState}
      transition={{ duration: 0.3 }}
    >
      <div className="player-header">
        <motion.div
          className="will-change-transform"
          variants={artworkVariants}
          animate={playerState}
          initial={false}
        >
          <div className="album-cover shadow-[0_18px_35px_rgba(0,0,0,0.35)]">
            <Image
              src="/album-art.png"
              alt="Album art"
              width={48}
              height={60}
              className="album-cover-image"
              priority
            />
          </div>
        </motion.div>

        <div className="player-meta">
          <h2 className="player-title truncate">{activeTrack.title}</h2>
          <p className="player-artist truncate">{activeTrack.artist}</p>
        </div>
      </div>

      <div className="player-equalizer-row">
        <div className="player-equalizer">
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.span
              key={index}
              className="player-equalizer-dot origin-bottom will-change-transform"
              variants={barVariants}
              custom={index}
              animate={playerState}
              initial={false}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar Animation */}
      <div className="player-progress-section">
        <div className="player-progress-track" onPointerDown={handleSeek}>
          <motion.div
            className="player-progress-fill"
            animate={{
              scaleX: progress,
              backgroundColor: isPlaying ? "#8B5CF6" : "#717680",
            }}
            initial={false}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <div className="player-time-row type-text-xs">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(durationSeconds)}</span>
        </div>
      </div>

      {/* Control Button Interactions */}
      <div className="player-controls">
        <motion.button
          type="button"
          onClick={handleShuffleToggle}
          className={`player-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
            isShuffleEnabled ? "bg-white/10 text-white" : ""
          }`}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label={isShuffleEnabled ? "Shuffle enabled" : "Shuffle disabled"}
        >
          <Shuffle className="player-icon" />
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleSkip(-1)}
          disabled={isLoading}
          className={`player-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
            !isLoading ? "" : "cursor-not-allowed opacity-50"
          }`}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label="Previous"
        >
          <SkipBack className="player-icon" />
        </motion.button>

        {/* Play/Pause Button Interactions */}
        <motion.button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          className={`transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 ${actionButtonClasses}`}
          whileHover={!isLoading ? { scale: 1.05 } : undefined}
          whileTap={!isLoading ? { scale: 0.95 } : undefined}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.span
                key="loading"
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="player-primary-icon animate-spin" />
              </motion.span>
            ) : isPlaying ? (
              <motion.span
                key="pause"
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Pause className="player-primary-icon" />
              </motion.span>
            ) : (
              <motion.span
                key="play"
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Play className="player-primary-icon translate-x-px" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleSkip(1)}
          disabled={isLoading}
          className={`player-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
            !isLoading ? "" : "cursor-not-allowed opacity-50"
          }`}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label="Next"
        >
          <SkipForward className="player-icon" />
        </motion.button>

        <motion.button
          type="button"
          onClick={handleRepeatToggle}
          className={`relative player-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
            repeatMode !== "off" ? "bg-white/10 text-white" : ""
          }`}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label={`Repeat ${repeatMode}`}
        >
          <Repeat className="player-icon" />
          {repeatMode === "one" ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-white/20 px-1 text-[10px] leading-none text-white">
              1
            </span>
          ) : null}
        </motion.button>
      </div>

      <div className="player-volume-section">
        <button
          type="button"
          onClick={handleVolumeToggle}
          className="player-volume-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
          aria-label={effectiveVolume === 0 ? "Unmute" : "Mute"}
        >
          {effectiveVolume === 0 ? (
            <VolumeX className="player-volume-icon" />
          ) : effectiveVolume < 0.5 ? (
            <Volume1 className="player-volume-icon" />
          ) : (
            <Volume2 className="player-volume-icon" />
          )}
        </button>

        {/* Volume Slider Hover Effects implemented via CSS on .player-volume-track:hover .player-volume-fill */}
        <div className="player-volume-track">
          <motion.div
            className="player-volume-fill"
            animate={{ scaleX: effectiveVolume }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volumePercent}
            onChange={handleVolumeChange}
            className="player-volume-slider"
            aria-label="Volume"
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={activeTrack.src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDurationSeconds(getResolvedDuration(event.currentTarget));
        }}
        onDurationChange={(event) => {
          setDurationSeconds(getResolvedDuration(event.currentTarget));
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrentTime(audio.currentTime);
          const nextDuration = getResolvedDuration(audio);
          setDurationSeconds((previousDuration) =>
            Math.abs(previousDuration - nextDuration) > 0.25
              ? nextDuration
              : previousDuration,
          );
        }}
        onPlaying={() => {
          pendingState.current = null;
          setPlayerState("playing");
        }}
        onPause={() => {
          if (pendingState.current === "playing") return;
          pendingState.current = null;
          setPlayerState("paused");
        }}
        onWaiting={() => setPlayerState("loading")}
        onEnded={handleTrackEnded}
      />
    </motion.div>
  );
}
