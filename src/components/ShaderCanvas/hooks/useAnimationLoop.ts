import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import type * as THREE from 'three';

interface UseAnimationLoopOptions {
  autoPlay: boolean;
  initialTime: number;
  playbackSpeed: number;
  onFrame?: (time: number, deltaTime: number) => void;
}

interface UseAnimationLoopResult {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  isPlaying: boolean;
  currentTime: number;
}

export function useAnimationLoop(
  rendererRef: RefObject<THREE.WebGLRenderer | null>,
  sceneRef: RefObject<THREE.Scene | null>,
  cameraRef: RefObject<THREE.OrthographicCamera | null>,
  isReady: boolean,
  options: UseAnimationLoopOptions
): UseAnimationLoopResult {
  const { autoPlay, initialTime, playbackSpeed: initialPlaybackSpeed, onFrame } = options;

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(initialTime);

  const rafIdRef = useRef<number | null>(null);
  const playbackSpeedRef = useRef(initialPlaybackSpeed);
  const timeRef = useRef(initialTime);
  const lastTimestampRef = useRef<number | null>(null);
  const isPlayingRef = useRef(autoPlay);

  const render = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimestampRef.current;
      const deltaTime = (deltaMs / 1000) * playbackSpeedRef.current;
      lastTimestampRef.current = timestamp;

      timeRef.current += deltaTime;
      setCurrentTime(timeRef.current);

      onFrame?.(timeRef.current, deltaTime);
      render();

      rafIdRef.current = requestAnimationFrame(animate);
    },
    [onFrame, render]
  );

  const play = useCallback(() => {
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTimestampRef.current = null;
    rafIdRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    timeRef.current = initialTime;
    setCurrentTime(initialTime);
    lastTimestampRef.current = null;
    render();
  }, [initialTime, render]);

  const setTime = useCallback(
    (time: number) => {
      timeRef.current = time;
      setCurrentTime(time);
      render();
    },
    [render]
  );

  const setPlaybackSpeed = useCallback((speed: number) => {
    playbackSpeedRef.current = speed;
  }, []);

  // Start/stop animation based on isReady and autoPlay
  useEffect(() => {
    if (!isReady) return;

    if (autoPlay) {
      play();
    } else {
      render();
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isReady, autoPlay, play, render]);

  return {
    play,
    pause,
    reset,
    setTime,
    setPlaybackSpeed,
    isPlaying,
    currentTime,
  };
}
