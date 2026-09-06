import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import type { Clue } from '../types';

interface NodeConfig {
  id: string;
  label: string;
  sublabel?: string;
  type: 'evidence' | 'clue' | 'vehicle' | 'person' | 'location' | 'event';
  x: number;
  y: number;
  isVisible: boolean;
  connections: string[];
  color: string;
}

export default function BoardPage() {
  const navigate = useNavigate();
  const { discoveredClues, savedImages } = useGameStore();

  // Build the board nodes from discovered clues
  const buildNodes = (): NodeConfig[] => {
    const nodes: NodeConfig[] = [];

    // Always show evidence nodes
    case017.evidence.forEach((ev, i) => {
      const hasSaved = !!savedImages[ev.id];
      const hasClues = ev.clueIds.some((cId) => discoveredClues.includes(cId));
      nodes.push({
        id: ev.id,
        label: ev.title,
        sublabel: ev.timestamp,
        type: 'evidence',
        x: 100 + i * 220,
        y: 60,
        isVisible: hasSaved || hasClues || ['evidence-01', 'evidence-02'].includes(ev.id),
        connections: ev.clueIds.filter((cId) => discoveredClues.includes(cId)),
        color: 'var(--neon-yellow)',
      });
    });

    // Clue nodes from discovered clues only
    case017.clues.forEach((clue) => {
      if (!discoveredClues.includes(clue.id)) return;

      // Position based on clue type
      const typeOffsets: Record<string, { dx: number; dy: number }> = {
        vehicle: { dx: -80, dy: 160 },
        person: { dx: 0, dy: 160 },
        object: { dx: 80, dy: 160 },
        location: { dx: -40, dy: 260 },
        text: { dx: 40, dy: 260 },
        timestamp: { dx: 120, dy: 260 },
      };

      // Find parent evidence node position
      const parentNode = nodes.find((n) => n.id === clue.evidenceId);
      const baseX = parentNode?.x ?? 300;
      const offset = typeOffsets[clue.type] ?? { dx: 0, dy: 160 };

      nodes.push({
        id: clue.id,
        label: clue.title,
        sublabel: clue.type.toUpperCase(),
        type: clue.type === 'vehicle' ? 'vehicle' : clue.type === 'person' ? 'person' : 'clue',
        x: baseX + offset.dx,
        y: 160 + (offset.dy - 160),
        isVisible: true,
        connections: clue.linkedEntities.filter((eId) => discoveredClues.includes(eId)),
        color:
          clue.type === 'vehicle'
            ? 'var(--neon-cyan)'
            : clue.type === 'person'
            ? 'var(--neon-pink)'
            : clue.type === 'location'
            ? 'var(--neon-green)'
            : 'var(--text-secondary)',
      });
    });

    return nodes;
  };

  const nodes = buildNodes();
  const visibleNodes = nodes.filter((n) => n.isVisible);

  const totalClues = case017.clues.length;
  const discovered = discoveredClues.length;

  // Get the clue object for a node
  const getClue = (nodeId: string): Clue | undefined =>
    case017.clues.find((c) => c.id === nodeId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{ paddingTop: '56px', minHeight: '100vh' }}
    >
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                marginBottom: '0.3rem',
              }}
            >
              VCI // CASE 017
            </div>
            <h1
              className="font-display"
              style={{ fontSize: '2.5rem', color: 'var(--text-bright)' }}
            >
              EVIDENCE BOARD
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="badge badge-cyan">
              {discovered} / {totalClues} CLUES
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/case')}>
              ← CASE
            </button>
          </div>
        </motion.div>

        {/* Board SVG */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
            overflowX: 'auto',
            position: 'relative',
          }}
        >
          {/* Grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }}
          />

          <svg
            width="1100"
            height="400"
            viewBox="0 0 1100 400"
            style={{ display: 'block', minWidth: '800px' }}
          >
            {/* Connection lines */}
            {visibleNodes.map((node) =>
              node.connections
                .map((targetId) => {
                  const target = visibleNodes.find((n) => n.id === targetId);
                  if (!target) return null;
                  return (
                    <motion.line
                      key={`${node.id}-${targetId}`}
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 0.4, pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      x1={node.x + 60}
                      y1={node.y + 30}
                      x2={target.x + 60}
                      y2={target.y + 30}
                      stroke="rgba(0, 212, 212, 0.35)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })
                .filter(Boolean)
            )}

            {/* Evidence → Clue lines */}
            {visibleNodes
              .filter((n) => n.type === 'evidence')
              .map((evidenceNode) => {
                const relatedClueNodes = visibleNodes.filter(
                  (n) =>
                    n.type !== 'evidence' &&
                    case017.clues.find((c) => c.id === n.id)?.evidenceId === evidenceNode.id
                );
                return relatedClueNodes.map((clueNode) => (
                  <motion.line
                    key={`ev-${evidenceNode.id}-${clueNode.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ delay: 0.4 }}
                    x1={evidenceNode.x + 60}
                    y1={evidenceNode.y + 30}
                    x2={clueNode.x + 60}
                    y2={clueNode.y + 30}
                    stroke="rgba(245, 200, 66, 0.3)"
                    strokeWidth="1"
                  />
                ));
              })}

            {/* Nodes */}
            {visibleNodes.map((node, i) => {
              const clue = getClue(node.id);
              const isEvidence = node.type === 'evidence';
              const nodeWidth = isEvidence ? 120 : 110;
              const nodeHeight = isEvidence ? 50 : 44;

              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (isEvidence) navigate(`/evidence/${node.id}`);
                  }}
                >
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="3"
                    fill={isEvidence ? 'rgba(15, 19, 24, 0.95)' : 'rgba(22, 28, 36, 0.9)'}
                    stroke={node.color}
                    strokeWidth={isEvidence ? '1.5' : '1'}
                    strokeOpacity={isEvidence ? '0.6' : '0.3'}
                  />

                  {/* Top color bar */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={nodeWidth}
                    height="3"
                    rx="2"
                    fill={node.color}
                    opacity="0.6"
                  />

                  {/* Node label */}
                  <text
                    x={node.x + nodeWidth / 2}
                    y={node.y + 20}
                    textAnchor="middle"
                    fill={node.color}
                    fontSize={isEvidence ? '11' : '10'}
                    fontFamily="'Bebas Neue', sans-serif"
                    letterSpacing="1"
                  >
                    {node.label.substring(0, 14)}
                  </text>

                  {/* Sublabel */}
                  {node.sublabel && (
                    <text
                      x={node.x + nodeWidth / 2}
                      y={node.y + 35}
                      textAnchor="middle"
                      fill="rgba(138, 125, 107, 0.8)"
                      fontSize="8"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {node.sublabel}
                    </text>
                  )}

                  {/* Clue XP badge */}
                  {!isEvidence && clue && (
                    <text
                      x={node.x + nodeWidth - 6}
                      y={node.y + 8}
                      textAnchor="end"
                      fill="rgba(245, 200, 66, 0.5)"
                      fontSize="7"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      +{clue.xp}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>

          {/* Empty state */}
          {visibleNodes.filter((n) => n.type !== 'evidence').length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                NO CONNECTIONS YET
              </div>
              <div
                className="font-mono"
                style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}
              >
                Investigate evidence to discover connections
              </div>
            </div>
          )}
        </motion.div>

        {/* Discovered Clues List */}
        {discovered > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span
                className="font-display"
                style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
              >
                DISCOVERED CONNECTIONS
              </span>
              <div className="divider" />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {case017.clues
                .filter((c) => discoveredClues.includes(c.id))
                .map((clue, i) => (
                  <motion.div
                    key={clue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span
                        className="font-display"
                        style={{ fontSize: '0.95rem', color: 'var(--text-bright)' }}
                      >
                        {clue.title}
                      </span>
                      <span
                        className="badge badge-yellow"
                        style={{ fontSize: '0.55rem' }}
                      >
                        {clue.type}
                      </span>
                    </div>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: '0.5rem',
                      }}
                    >
                      {clue.detail}
                    </p>
                    {clue.linkedEntities.length > 0 && (
                      <div
                        className="font-mono"
                        style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}
                      >
                        LINKED:{' '}
                        {clue.linkedEntities
                          .filter((id) => discoveredClues.includes(id))
                          .map((id) => {
                            const linked = case017.clues.find((c) => c.id === id);
                            return linked?.title;
                          })
                          .filter(Boolean)
                          .join(' → ')}
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
        >
          <button className="btn btn-ghost" onClick={() => navigate('/case')}>
            ← BACK TO CASE
          </button>
          <button className="btn btn-evidence" onClick={() => navigate('/decision')}>
            MAKE DECISION →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
