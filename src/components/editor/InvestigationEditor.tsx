// ============================================================
// InvestigationEditor — Official Unlayer React Image Editor Wrapper
// Using the REAL API from @unlayer/react-image-editor v1.x
//
// Actual prop API (from dist/index.d.ts):
//   image: string          — URL or data URL to edit
//   onSave: (result: { dataUrl: string; blob: Blob }) => void
//   onCancel?: () => void
//   onLoad?: (editor: ImageEditorInstance) => void
//   onError?: (error: Error) => void
//   onLoadError?: () => void
//   options?: { theme, locale, projectId, features, offline, ... }
//   style?: CSSProperties
//   minHeight?: number | string
//   editorId?: string
//
// https://github.com/unlayer/react-image-editor
// ============================================================
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Official Unlayer React Image Editor
import ImageEditor, { type ImageEditorSaveResult, type ImageEditorInstance } from '@unlayer/react-image-editor';

interface InvestigationEditorProps {
  /** Source image URL or data URL */
  imageSrc: string;
  /** Job ID for context */
  evidenceId: string;
  /** Called when user saves their edit — receives the dataUrl */
  onSave: (dataUrl: string) => void;
  /** Called when editor encounters an error */
  onError?: (error: Error) => void;
}

export default function InvestigationEditor({
  imageSrc,
  evidenceId,
  onSave,
  onError,
}: InvestigationEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Handle save from the Unlayer editor's built-in save button
  // The result object contains { dataUrl: string, blob: Blob }
  const handleSave = useCallback(
    (result: ImageEditorSaveResult) => {
      setSaveStatus('saving');

      try {
        // dataUrl is the full base64 data URL of the edited image
        onSave(result.dataUrl);

        setTimeout(() => {
          setSaveStatus('saved');
        }, 400);

        // Reset after a moment
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } catch (err) {
        setSaveStatus('idle');
        onError?.(err instanceof Error ? err : new Error('Save failed'));
      }
    },
    [onSave, onError]
  );

  const handleEditorLoad = useCallback((editor: ImageEditorInstance) => {
    console.log('[FIXER LAB] Unlayer Image Editor mounted:', editor);
  }, []);

  const handleEditorError = useCallback(
    (error: Error) => {
      console.error('[FIXER LAB] Editor error:', error);
      onError?.(error);
    },
    [onError]
  );

  return (
    <div
      className="investigation-editor-wrapper"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Save Status Overlay */}
      {saveStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            padding: '0.5rem 1rem',
            background:
              saveStatus === 'saved'
                ? 'rgba(57, 217, 138, 0.15)'
                : 'rgba(0, 212, 212, 0.1)',
            border: '1px solid ' + (
              saveStatus === 'saved'
                ? 'rgba(57, 217, 138, 0.4)'
                : 'rgba(0, 212, 212, 0.3)'
            ),
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color:
              saveStatus === 'saved' ? 'var(--neon-green)' : 'var(--neon-cyan)',
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}
        >
          {saveStatus === 'saving' && '● PROCESSING IMAGE DATA...'}
          {saveStatus === 'saved' && '✓ EDITS SAVED TO LOCAL WORKSTATION'}
        </motion.div>
      )}

      {/* 
        THE OFFICIAL UNLAYER REACT IMAGE EDITOR
      */}
      <ImageEditor
        image={imageSrc}
        onSave={handleSave}
        onLoad={handleEditorLoad}
        onError={handleEditorError}
        onLoadError={() => console.warn('[FIXER LAB] Client asset failed to load into editor canvas')}
        options={{
          theme: 'dark',
          offline: false,
        }}
        minHeight="100%"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}
        editorId={'fixer-editor-' + evidenceId}
      />
    </div>
  );
}
