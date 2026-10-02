CREATE TABLE leaderboard_entries (
    entry_id VARCHAR(100) PRIMARY KEY,
    player_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10),
    best_time INTEGER NOT NULL,
    top_speed DOUBLE PRECISION NOT NULL,
    design_score DOUBLE PRECISION NOT NULL,
    races_completed INTEGER DEFAULT 1,
    livery_thumb TEXT,
    last_updated BIGINT NOT NULL
);

CREATE INDEX idx_leaderboard_best_time ON leaderboard_entries(best_time ASC, top_speed DESC, last_updated ASC);
CREATE INDEX idx_leaderboard_player_id ON leaderboard_entries(player_id);
