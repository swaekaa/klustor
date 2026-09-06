import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';

interface ScannerOverlayProps {
  imageSrc: string;
  clueZones: { id: string; x: number; y: number; width: number; height: number }[];
  onAnalyze: (normalizedRect: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export default function ScannerOverlay({ imageSrc, clueZones, onAnalyze, onCancel }: ScannerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // We need to know the actual rendered dimensions of the image (ignoring letterboxing)
  const [imgBounds, setImgBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  
  // Debug mode to show hitboxes
  const [showDebug, setShowDebug] = useState(false);

  const updateImageBounds = () => {
    if (imgRef.current && containerRef.current) {
      const imgRect = imgRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate image position relative to the container
      setImgBounds({
        left: imgRect.left - containerRect.left,
        top: imgRect.top - containerRect.top,
        width: imgRect.width,
        height: imgRect.height,
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImageBounds);
    // Give it a moment to render then update
    const timer = setTimeout(updateImageBounds, 100);
    return () => {
      window.removeEventListener('resize', updateImageBounds);
      clearTimeout(timer);
    };
  }, []);

  const handlePointerDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!imgBounds || e.button !== 0) return;
    
    const containerRect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    // Only start if clicking inside the actual image area
    if (x >= imgBounds.left && x <= imgBounds.left + imgBounds.width &&
        y >= imgBounds.top && y <= imgBounds.top + imgBounds.height) {
      setIsDragging(true);
      setStartPos({ x, y });
      setCurrentPos({ x, y });
      setSelectionRect(null);
    }
  };

  const handlePointerMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imgBounds) return;
    
    const containerRect = containerRef.current!.getBoundingClientRect();
    let x = e.clientX - containerRect.left;
    let y = e.clientY - containerRect.top;
    
    // Clamp to image bounds
    x = Math.max(imgBounds.left, Math.min(x, imgBounds.left + imgBounds.width));
    y = Math.max(imgBounds.top, Math.min(y, imgBounds.top + imgBounds.height));
    
    setCurrentPos({ x, y });
  };

  const handlePointerUp = () => {
    if (!isDragging || !imgBounds) return;
    setIsDragging(false);
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    if (width > 10 && height > 10) {
      setSelectionRect({ x, y, width, height });
    }
  };

  const handleAnalyze = () => {
    if (!selectionRect || !imgBounds) return;
    
    // Normalize to 0-100% relative to the actual image bounds
    const normalizedRect = {
      x: ((selectionRect.x - imgBounds.left) / imgBounds.width) * 100,
      y: ((selectionRect.y - imgBounds.top) / imgBounds.height) * 100,
      width: (selectionRect.width / imgBounds.width) * 100,
      height: (selectionRect.height / imgBounds.height) * 100,
    };
    
    onAnalyze(normalizedRect);
  };

  const currentSelection = isDragging ? {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y)
  } : selectionRect;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        overflow: 'hidden'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img 
        ref={imgRef}
        src={imageSrc} 
        alt="Scanner Target" 
        onLoad={updateImageBounds}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          opacity: 0.8
        }}
      />
      
      {/* Darken area outside selection */}
      {imgBounds && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.4)',
          clipPath: currentSelection ? `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
            ${currentSelection.x}px ${currentSelection.y}px, 
            ${currentSelection.x + currentSelection.width}px ${currentSelection.y}px, 
            ${currentSelection.x + currentSelection.width}px ${currentSelection.y + currentSelection.height}px, 
            ${currentSelection.x}px ${currentSelection.y + currentSelection.height}px, 
            ${currentSelection.x}px ${currentSelection.y}px
          )` : 'none'
        }} />
      )}

      {/* Draw selection box */}
      {currentSelection && (
        <div style={{
          position: 'absolute',
          left: currentSelection.x,
          top: currentSelection.y,
          width: currentSelection.width,
          height: currentSelection.height,
          border: '2px solid var(--neon-cyan)',
          backgroundColor: 'rgba(0, 212, 212, 0.1)',
          pointerEvents: 'none',
          boxShadow: '0 0 15px rgba(0,212,212,0.3), inset 0 0 15px rgba(0,212,212,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!isDragging && (
            <span className="font-mono" style={{
              color: 'var(--neon-cyan)',
              fontSize: '0.6rem',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '0.2rem 0.4rem',
              borderRadius: '2px'
            }}>TARGET ACQUIRED</span>
          )}
        </div>
      )}
      
      {/* Scanner UI Controls */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        display: 'flex',
        gap: '1rem',
        zIndex: 60
      }}>
        <button 
          className="btn btn-ghost" 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          CANCEL SCAN
        </button>
        {selectionRect && (
          <button 
            className="btn btn-primary animate-fade-in" 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
          >
            ANALYZE REGION →
          </button>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: '2rem',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>SCAN MODE ACTIVE</div>
        <div className="font-mono" style={{ color: 'var(--text-bright)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Drag over an area you believe contains a clue.
        </div>
      </div>
      
      {/* Scanner grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(rgba(0, 212, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 212, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.5
      }} />

      {/* DEBUG TOGGLE & COORDINATE HELPER */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem'
      }}>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }}
          style={{
            background: showDebug ? 'var(--neon-red)' : 'rgba(0,0,0,0.5)',
            color: showDebug ? '#000' : 'var(--text-muted)',
            border: `1px solid ${showDebug ? 'var(--neon-red)' : 'var(--border-default)'}`,
            padding: '0.4rem 0.8rem',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            borderRadius: '2px'
          }}
        >
          COORDINATE HELPER: {showDebug ? 'ON' : 'OFF'}
        </button>

        {showDebug && selectionRect && imgBounds && (
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid var(--neon-cyan)',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--neon-cyan)',
            width: '280px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            <div style={{ marginBottom: '0.5rem', color: '#fff' }}>CLUE ZONE JSON:</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`{
  id: "clue-id",
  label: "Clue Label",
  x: ${(((selectionRect.x - imgBounds.left) / imgBounds.width) * 100).toFixed(2)},
  y: ${(((selectionRect.y - imgBounds.top) / imgBounds.height) * 100).toFixed(2)},
  width: ${((selectionRect.width / imgBounds.width) * 100).toFixed(2)},
  height: ${((selectionRect.height / imgBounds.height) * 100).toFixed(2)}
}`}
            </pre>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const jsonStr = `{
  id: "clue-id",
  label: "Clue Label",
  x: ${(((selectionRect.x - imgBounds.left) / imgBounds.width) * 100).toFixed(2)},
  y: ${(((selectionRect.y - imgBounds.top) / imgBounds.height) * 100).toFixed(2)},
  width: ${((selectionRect.width / imgBounds.width) * 100).toFixed(2)},
  height: ${((selectionRect.height / imgBounds.height) * 100).toFixed(2)}
}`;
                navigator.clipboard.writeText(jsonStr);
                // Optionally could add a quick toast or state change here, but standard button is fine for dev
              }}
              style={{
                marginTop: '1rem',
                width: '100%',
                background: 'var(--neon-cyan)',
                color: '#000',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold'
              }}
            >
              COPY JSON
            </button>
          </div>
        )}
      </div>

      {/* DEBUG HITBOXES */}
      {showDebug && imgBounds && clueZones.map((zone, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: imgBounds.left + (zone.x / 100) * imgBounds.width,
          top: imgBounds.top + (zone.y / 100) * imgBounds.height,
          width: (zone.width / 100) * imgBounds.width,
          height: (zone.height / 100) * imgBounds.height,
          border: '2px dashed var(--neon-red)',
          backgroundColor: 'rgba(230, 57, 70, 0.2)',
          pointerEvents: 'none',
          zIndex: 90,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '2px'
        }}>
          <span style={{ 
            color: '#fff', 
            background: 'var(--neon-red)', 
            fontSize: '10px', 
            fontFamily: 'var(--font-mono)',
            padding: '1px 3px'
          }}>
            {zone.id}
          </span>
        </div>
      ))}
    </div>
  );
}
