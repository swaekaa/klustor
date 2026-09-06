import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { player, discoveredClues, reviewedEvidence, savedImages, decision, ending, resetGame } =
    useGameStore();

  const endingData = case017.endings.find((e) => e.id === ending);
  const decisionData = case017.decisions.find((d) => d.id === decision);
  const totalClues = case017.clues.length;
  const score = Math.round(
    (reviewedEvidence.length / 5) * 40 + (discoveredClues.length / totalClues) * 60
  );

  // Get saved images to show
  const investigatedEvidence = case017.evidence.filter((ev) => !!savedImages[ev.id]);

  const handleNewGame = () => {
    resetGame();
    navigate('/');
  };

  if (!endingData) {
    return (
      <div
        className="page"
        style={{
          paddingTop: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>
            NO DECISION MADE
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/decision')}
          >
            MAKE A DECISION
          </button>
        </div>
      </div>
    );
  }

  const endingColor =
    ending === 'good-investigator'
      ? 'var(--neon-cyan)'
      : ending === 'the-scoop'
      ? 'var(--neon-yellow)'
      : ending === 'the-fixer'
      ? 'var(--neon-red)'
      : 'var(--neon-pink)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{ paddingTop: '56px', minHeight: '100vh' }}
    >
      {/* Background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${endingColor}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        className="container"
        style={{
          paddingTop: '3rem',
          paddingBottom: '5rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Case Closed Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            style={{ marginBottom: '1rem' }}
          >
            <span
              className="badge"
              style={{
                color: endingColor,
                borderColor: endingColor + '50',
                background: endingColor + '10',
                fontSize: '0.7rem',
                padding: '0.4rem 1rem',
              }}
            >
              ◈ CASE CLOSED
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            {case017.title}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display"
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ color: endingColor, textShadow: `0 0 30px ${endingColor}60` }}>
              {endingData.headline}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-display"
            style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}
          >
            {endingData.title}
          </motion.div>
        </motion.div>

        {/* Scores Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {[
            { label: 'INVESTIGATION SCORE', value: `${score}%`, color: endingColor },
            {
              label: 'EVIDENCE REVIEWED',
              value: `${reviewedEvidence.length} / 5`,
              color: 'var(--neon-cyan)',
            },
            {
              label: 'CLUES FOUND',
              value: `${discoveredClues.length} / ${totalClues}`,
              color: 'var(--neon-yellow)',
            },
            { label: 'DECISION', value: decisionData?.label ?? '—', color: endingColor },
            {
              label: 'REPUTATION',
              value: `${player.reputation >= 50 ? '+' : ''}${endingData.reputationChange}`,
              color: endingData.reputationChange >= 0 ? 'var(--neon-cyan)' : 'var(--neon-red)',
            },
            {
              label: 'HEAT GAINED',
              value: `+${endingData.heatChange}`,
              color: endingData.heatChange > 10 ? 'var(--neon-red)' : 'var(--neon-green)',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="panel"
              style={{ textAlign: 'center', padding: '1rem' }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: '0.5rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.4rem',
                }}
              >
                {stat.label}
              </div>
              <div
                className="font-display"
                style={{ fontSize: '1.4rem', color: stat.color }}
              >
                {stat.value}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Ending Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="panel"
          style={{ marginBottom: '2.5rem' }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '0.55rem',
              color: endingColor,
              letterSpacing: '0.15em',
              marginBottom: '0.75rem',
            }}
          >
            CASE OUTCOME
          </div>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              borderLeft: `2px solid ${endingColor}40`,
              paddingLeft: '1rem',
            }}
          >
            {endingData.narrative}
          </p>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <span
              className="badge"
              style={{
                color: endingColor,
                borderColor: endingColor + '40',
                background: endingColor + '10',
                fontSize: '0.65rem',
                padding: '0.3rem 0.8rem',
              }}
            >
              ◈ {endingData.badge}
            </span>
            <span className="badge badge-cyan">
              RANK: {player.rank}
            </span>
          </div>
        </motion.div>

        {/* Investigated Evidence — THE KEY MOMENT: edited images persist here */}
        {investigatedEvidence.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <span
                className="font-display"
                style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
              >
                YOUR INVESTIGATION
              </span>
              <div className="divider" />
              <span
                className="font-mono"
                style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
              >
                EVIDENCE YOU MARKED
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {investigatedEvidence.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: `1px solid ${endingColor}30`,
                    position: 'relative',
                  }}
                >
                  <img
                    src={savedImages[ev.id]}
                    alt={ev.title}
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      padding: '1.5rem 0.75rem 0.5rem',
                    }}
                  >
                    <div
                      className="font-display"
                      style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}
                    >
                      {ev.title}
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}
                    >
                      {ev.timestamp} // INVESTIGATED
                    </div>
                  </div>

                  {/* Evidence verified badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                    }}
                  >
                    <span
                      className="badge badge-green"
                      style={{ fontSize: '0.55rem' }}
                    >
                      ✓ VERIFIED
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="font-mono"
              style={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '0.75rem',
                letterSpacing: '0.08em',
              }}
            >
              ↑ EVIDENCE EDITED USING UNLAYER REACT IMAGE EDITOR — YOUR ANNOTATIONS SURVIVED
            </motion.p>
          </motion.div>
        )}

        {/* Player stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="panel"
          style={{ marginBottom: '2rem' }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              marginBottom: '1rem',
            }}
          >
            INVESTIGATOR PROFILE
          </div>
          <div
            className="font-display"
            style={{
              fontSize: '1.2rem',
              color: 'var(--neon-cyan)',
              marginBottom: '1rem',
            }}
          >
            {player.rank}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Reputation bar */}
            <div className="stat-bar stat-bar--rep">
              <div className="stat-bar__label">
                <span>REPUTATION</span>
                <span style={{ color: 'var(--neon-cyan)' }}>{player.reputation} / 100</span>
              </div>
              <div className="stat-bar__track">
                <div
                  className="stat-bar__fill"
                  style={{ width: `${player.reputation}%` }}
                />
              </div>
            </div>

            {/* Heat bar */}
            <div className="stat-bar stat-bar--heat">
              <div className="stat-bar__label">
                <span>HEAT</span>
                <span style={{ color: 'var(--neon-red)' }}>{player.heat}%</span>
              </div>
              <div className="stat-bar__track">
                <div
                  className="stat-bar__fill"
                  style={{ width: `${player.heat}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleNewGame}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            ▶ NEW INVESTIGATION
          </motion.button>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/board')}
          >
            ◈ VIEW EVIDENCE BOARD
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
