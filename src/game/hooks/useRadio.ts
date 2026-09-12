import { useEffect, useRef, useState } from 'react';

// Using a reliable test MP3 stream to verify playback, as the previous stream may have been dead
const RADIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export function useRadio(isActive: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  // Initialize the audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.src = RADIO_URL;
    audio.loop = false;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
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
        const audio = audioRef.current;
        if (!audio) return;

        // Perform audio logic DIRECTLY in the event listener (critical for browser autoplay policies)
        if (!isPlayingRef.current) {
          // Play
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              isPlayingRef.current = true;
              setIsPlaying(true);
            }).catch(err => {
              console.error('[KLUSTOR] Radio play blocked by browser:', err);
              setIsPlaying(false);
            });
          }
        } else {
          // Pause
          audio.pause();
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Pause if game is paused/not active
  useEffect(() => {
    if (!isActive && isPlayingRef.current && audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [isActive]);

  return { isPlaying };
}
