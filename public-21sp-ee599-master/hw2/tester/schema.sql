DROP DATABASE IF EXISTS hw2;

CREATE DATABASE hw2;
USE hw2;

CREATE TABLE player (
  player_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fname VARCHAR(20) NOT NULL CHECK (fname <> ''),
  lname VARCHAR(20),
  is_active BOOLEAN,
  balance_usd DECIMAL(10,2) DEFAULT 0 CHECK (balance_usd >= 0),
  handed ENUM('L', 'R', 'AMBI'),
  PRIMARY KEY (player_id)
);

CREATE TABLE clash (
  clash_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  player1_id INT UNSIGNED NOT NULL,
  player2_id INT UNSIGNED NOT NULL,
  attendance INT UNSIGNED DEFAULT 0,
  entry_fee_usd DECIMAL(10,2) NOT NULL CHECK (entry_fee_usd >= 0),
  prize_usd DECIMAL(10,2) NOT NULL CHECK (prize_usd >= 0),
  create_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at DATETIME DEFAULT NULL,
  PRIMARY KEY (clash_id),
  CONSTRAINT pid1_fk FOREIGN KEY (player1_id) REFERENCES player(player_id) ON
  DELETE CASCADE,
  CONSTRAINT pid2_fk FOREIGN KEY (player2_id) REFERENCES player(player_id) ON
  DELETE CASCADE,
  CHECK (player1_id <> player2_id)
);

CREATE TABLE clash_point (
  event_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id INT UNSIGNED NOT NULL,
  clash_id INT UNSIGNED,
  points INT UNSIGNED,
  is_dq BOOLEAN,
  event_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  CONSTRAINT cid_fk FOREIGN KEY (clash_id) REFERENCES clash(clash_id) ON DELETE
  CASCADE,
  CONSTRAINT pid_fk FOREIGN KEY (player_id) REFERENCES player(player_id) ON
  DELETE CASCADE
);
