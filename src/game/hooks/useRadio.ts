import { useEffect, useRef, useState } from 'react';

// Using Nightride FM - an ad-free 24/7 synthwave internet radio (perfect for a Miami racing game)
const RADIO_URL = 'https://stream.nightride.fm/nightride.m4a';

export function useRadio(isActive: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize the audio element once
  useEffect(() => {
    const audio = new Audio(RADIO_URL);
    audio.crossOrigin = "anonymous";
    audio.loop = false; // Internet radio stream doesn't need to loop
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Handle keyboard toggle
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === 'b') {
        setIsPlaying(prev => {
          const next = !prev;
          if (next && audioRef.current) {
            // When turning back on, it's best to reload the stream so it doesn't play old buffered audio
            audioRef.current.load();
            audioRef.current.play().catch(err => console.warn('[KLUSTOR] Radio play failed', err));
          } else if (audioRef.current) {
            audioRef.current.pause();
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Pause if game is paused/not active
  useEffect(() => {
    if (!isActive && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  return { isPlaying };
}
