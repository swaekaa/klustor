// ============================================================
// LiveryEditor — Unlayer Image Editor wrapper for car customization
// Official API: @unlayer/react-image-editor v1.x
// ============================================================
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ImageEditor, {
  type ImageEditorSaveResult,
  type ImageEditorInstance,
} from '@unlayer/react-image-editor';

interface LiveryEditorProps {
  /** The car template image URL to load as the base */
  templateSrc: string;
  /** Called when the user saves — receives the full dataUrl */
  onSave: (dataUrl: string) => void;
  /** Optional error handler */
  onError?: (error: Error) => void;
  /** Unique editor ID (prevents stale canvas issues) */
  editorId?: string;
}

export default function LiveryEditor({
  templateSrc,
  onSave,
  onError,
  editorId = 'livery-editor',
}: LiveryEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = useCallback(
    (result: ImageEditorSaveResult) => {
      setSaveStatus('saving');
      try {
        onSave(result.dataUrl);
        setTimeout(() => setSaveStatus('saved'), 300);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        setSaveStatus('idle');
        onError?.(err instanceof Error ? err : new Error('Save failed'));
      }
    },
    [onSave, onError]
  );

  const handleLoad = useCallback((_editor: ImageEditorInstance) => {
    console.log('[KLUSTOR] Livery editor mounted');
  }, []);

  const handleEditorError = useCallback(
    (error: Error) => {
      console.error('[KLUSTOR] Livery editor error:', error);
      onError?.(error);
    },
    [onError]
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Save status toast */}
      {saveStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 50,
            padding: '0.5rem 1.25rem',
            background: saveStatus === 'saved' ? 'rgba(168, 201, 155, 0.9)' : 'rgba(143, 213, 209, 0.9)',
            border: `1px solid ${saveStatus === 'saved' ? '#78A85B' : '#5BB8B4'}`,
            borderRadius: '8px',
            fontFamily: 'Consolas, monospace',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: '#1E2933',
            letterSpacing: '0.08em',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(30,41,51,0.15)',
          }}
        >
          {saveStatus === 'saving' && '● ANALYZING DESIGN...'}
          {saveStatus === 'saved' && '✓ LIVERY SAVED — CAR UPDATED'}
        </motion.div>
      )}

      {/* Unlayer Image Editor */}
      <ImageEditor
        image={templateSrc}
        onSave={handleSave}
        onLoad={handleLoad}
        onError={handleEditorError}
        onLoadError={() => console.warn('[KLUSTOR] Car template image failed to load')}
        options={{
          theme: 'light',
          offline: false,
        }}
        minHeight="100%"
        style={{ flex: 1, width: '100%', height: '100%' }}
        editorId={editorId}
      />
    </div>
  );
}
