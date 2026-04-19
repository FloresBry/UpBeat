CREATE DATABASE upBeat;

SHOW DATABASES;

USE upBeat;

CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE exercises(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    muscle_group ENUM(
        'chest',
        'back',
        'legs',
        'shoulders',
        'biceps',
        'triceps',
        'core',
        'glutes',
        'full_body',
        'cardio'
    ) NOT NULL,
    description TEXT,
    duration_minutes INT UNSIGNED,
    difficulty ENUM(
        'EASY',
        'MEDIUM',
        'HARD'
    ) NOT NULL
);

CREATE TABLE routines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    difficulty ENUM(
        'EASY',
        'MEDIUM',
        'HARD'
    ) NOT NULL DEFAULT 'EASY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE routine_exercise (
    routine_id INT NOT NULL,
    exercise_id INT NOT NULL,
    PRIMARY KEY (routine_id, exercise_id),
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE timers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_seconds INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE active_routine (
    id INT AUTO_INCREMENT PRIMARY KEY,
    routine_id INT NOT NULL,
    timer_id INT NOT NULL,
    status ENUM('IN_PROGRESS', 'COMPLETED','PAUSED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (timer_id) REFERENCES timers(id) ON DELETE CASCADE
);

-- =========================
-- Seed data (idempotent)
-- =========================

-- Users
INSERT INTO users (name, email, password)
SELECT 'Demo User', 'demo@upbeat.app', '1234'
WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'demo@upbeat.app'
);

INSERT INTO users (name, email, password)
SELECT 'Ana Coach', 'ana@upbeat.app', '1234'
WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'ana@upbeat.app'
);

-- Exercises
INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Press de hombro en maquina', 'shoulders', 'Trabajo de hombro en maquina guiada', 2, 'HARD'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Press de hombro en maquina'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Kettlebell swing', 'full_body', 'Potencia de cadera y cardio', 1, 'EASY'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Kettlebell swing'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Deadlift', 'back', 'Levantamiento para cadena posterior', 2, 'MEDIUM'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Deadlift'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Hammer curl', 'biceps', 'Curl de biceps con mancuernas', 1, 'EASY'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Hammer curl'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Remo en cable sentado', 'back', 'Trabajo de espalda con cable', 2, 'MEDIUM'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Remo en cable sentado'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Sentadilla frontal', 'legs', 'Sentadilla enfocada en cuadriceps y core', 2, 'HARD'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Sentadilla frontal'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Push ups', 'chest', 'Flexiones de pecho', 1, 'EASY'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Push ups'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Hip thrust', 'glutes', 'Elevacion de cadera con barra', 2, 'MEDIUM'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Hip thrust'
);

INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
SELECT 'Burpees', 'cardio', 'Cardio de alta intensidad', 1, 'HARD'
WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name = 'Burpees'
);

-- Routines for demo user
INSERT INTO routines (user_id, name, difficulty)
SELECT u.id, 'Inicio Suave', 'EASY'
FROM users u
WHERE u.email = 'demo@upbeat.app'
    AND NOT EXISTS (
            SELECT 1 FROM routines r
            WHERE r.user_id = u.id AND r.name = 'Inicio Suave'
    );

INSERT INTO routines (user_id, name, difficulty)
SELECT u.id, 'Fuerza Total', 'MEDIUM'
FROM users u
WHERE u.email = 'demo@upbeat.app'
    AND NOT EXISTS (
            SELECT 1 FROM routines r
            WHERE r.user_id = u.id AND r.name = 'Fuerza Total'
    );

INSERT INTO routines (user_id, name, difficulty)
SELECT u.id, 'Reto Intenso', 'HARD'
FROM users u
WHERE u.email = 'demo@upbeat.app'
    AND NOT EXISTS (
            SELECT 1 FROM routines r
            WHERE r.user_id = u.id AND r.name = 'Reto Intenso'
    );

-- Routine / exercise mapping: Inicio Suave
INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Push ups'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Inicio Suave'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Kettlebell swing'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Inicio Suave'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Hammer curl'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Inicio Suave'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

-- Routine / exercise mapping: Fuerza Total
INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Deadlift'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Fuerza Total'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Remo en cable sentado'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Fuerza Total'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Hip thrust'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Fuerza Total'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

-- Routine / exercise mapping: Reto Intenso
INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Press de hombro en maquina'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Reto Intenso'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Sentadilla frontal'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Reto Intenso'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );

INSERT INTO routine_exercise (routine_id, exercise_id)
SELECT r.id, e.id
FROM routines r
JOIN users u ON u.id = r.user_id
JOIN exercises e ON e.name = 'Burpees'
WHERE u.email = 'demo@upbeat.app'
    AND r.name = 'Reto Intenso'
    AND NOT EXISTS (
            SELECT 1 FROM routine_exercise re
            WHERE re.routine_id = r.id AND re.exercise_id = e.id
    );


