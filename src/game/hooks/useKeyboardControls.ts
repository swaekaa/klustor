// ============================================================
// useKeyboardControls — Global key tracking for race controls
// Activates ONLY while the race is active (controlled via ref)
// ============================================================
import { useEffect, useRef, useCallback } from 'react';

export type KeyCode = string;

export function useKeyboardControls(isActive: boolean) {
  const pressedKeys = useRef<Set<KeyCode>>(new Set());
  const isActiveRef = useRef(isActive);

  // Keep ref in sync without re-registering listeners
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      pressedKeys.current.add(e.code);

      // Only prevent default for game keys while race is active
      if (isActiveRef.current) {
        const gameCodes = new Set([
          'KeyW', 'KeyA', 'KeyS', 'KeyD',
          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
          'Space', 'KeyR', 'Escape',
          'ShiftLeft', 'ShiftRight'
        ]);
        if (gameCodes.has(e.code)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.code);
    };

    const handleBlur = () => {
      pressedKeys.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      pressedKeys.current.clear();
    };
  }, []); // Empty deps: register once, use ref for isActive

  const isPressed = useCallback((code: KeyCode): boolean => {
    return pressedKeys.current.has(code);
  }, []);

  const isAnyPressed = useCallback((...codes: KeyCode[]): boolean => {
    return codes.some(c => pressedKeys.current.has(c));
  }, []);

  return { isPressed, isAnyPressed };
}
