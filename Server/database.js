import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .promise();

const DEFAULT_EXERCISES = [
  {
    name: 'Press de hombro en maquina',
    muscle_group: 'shoulders',
    description: 'Trabajo de hombros en maquina guiada',
    duration_minutes: 1,
    difficulty: 'HARD',
  },
  {
    name: 'Kettlebell swing',
    muscle_group: 'full_body',
    description: 'Ejercicio dinamico para potencia y cardio',
    duration_minutes: 1,
    difficulty: 'EASY',
  },
  {
    name: 'Deadlift',
    muscle_group: 'back',
    description: 'Levantamiento para cadena posterior',
    duration_minutes: 2,
    difficulty: 'MEDIUM',
  },
  {
    name: 'Hammer curl',
    muscle_group: 'biceps',
    description: 'Curl de biceps con mancuernas',
    duration_minutes: 1,
    difficulty: 'EASY',
  },
  {
    name: 'Remo en cable sentado',
    muscle_group: 'back',
    description: 'Trabajo de espalda con cable',
    duration_minutes: 1,
    difficulty: 'MEDIUM',
  },
  {
    name: 'Sentadilla frontal',
    muscle_group: 'legs',
    description: 'Sentadilla enfocada en cuadriceps',
    duration_minutes: 2,
    difficulty: 'HARD',
  },
];

function resolveRoutineDifficultyFromCounts(counts) {
  const hardCount = Number(counts?.hardCount ?? 0);
  const mediumCount = Number(counts?.mediumCount ?? 0);
  const easyCount = Number(counts?.easyCount ?? 0);

  if (hardCount >= mediumCount && hardCount >= easyCount) {
    return 'HARD';
  }

  if (mediumCount >= easyCount) {
    return 'MEDIUM';
  }

  return 'EASY';
}

export async function getUserById(id) {
  const [row] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
  return row[0];
}

export async function getUserByEmail(email) {
  const [row] = await pool.query(`SELECT * FROM users WHERE email = ?`, [email]);
  return row[0];
}

export async function addUser(name, email, password) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, password]
  );
  return result.insertId;
}

export async function deleteUser(id) {
  const [result] = await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
  return result;
}

export async function updateUser(id, name, password) {
  const [result] = await pool.query(
    `UPDATE users SET name = ?, password = ? WHERE id = ?`,
    [name, password, id]
  );
  return result;
}

export async function ensureExercisesSeeded() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM exercises`);
  if (rows[0].total > 0) {
    return;
  }

  for (const exercise of DEFAULT_EXERCISES) {
    await pool.query(
      `INSERT INTO exercises (name, muscle_group, description, duration_minutes, difficulty)
       VALUES (?, ?, ?, ?, ?)`,
      [
        exercise.name,
        exercise.muscle_group,
        exercise.description,
        exercise.duration_minutes,
        exercise.difficulty,
      ]
    );
  }
}

export async function ensureRoutineDifficultyColumn() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'routines'
       AND COLUMN_NAME = 'difficulty'`
  );

  if (rows[0].total === 0) {
    await pool.query(
      `ALTER TABLE routines
       ADD COLUMN difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'EASY' AFTER name`
    );
  }
}

export async function refreshRoutineDifficulty(routineId, connection = pool) {
  const [counts] = await connection.query(
    `SELECT
       COALESCE(SUM(CASE WHEN e.difficulty = 'HARD' THEN 1 ELSE 0 END), 0) AS hardCount,
       COALESCE(SUM(CASE WHEN e.difficulty = 'MEDIUM' THEN 1 ELSE 0 END), 0) AS mediumCount,
       COALESCE(SUM(CASE WHEN e.difficulty = 'EASY' THEN 1 ELSE 0 END), 0) AS easyCount
     FROM routine_exercise re
     INNER JOIN exercises e ON e.id = re.exercise_id
     WHERE re.routine_id = ?`,
    [routineId]
  );

  const difficulty = resolveRoutineDifficultyFromCounts(counts[0]);
  await connection.query(`UPDATE routines SET difficulty = ? WHERE id = ?`, [difficulty, routineId]);
  return difficulty;
}

export async function syncAllRoutineDifficulties() {
  const [routineRows] = await pool.query(`SELECT id FROM routines`);

  for (const routine of routineRows) {
    await refreshRoutineDifficulty(routine.id);
  }
}

export async function getExercises() {
  const [rows] = await pool.query(
    `SELECT id, name, muscle_group AS muscleGroup, description, duration_minutes AS durationMinutes, difficulty
     FROM exercises
     ORDER BY id ASC`
  );
  return rows;
}

export async function createRoutineWithExercises(userId, name, exerciseIds) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO routines (user_id, name, difficulty) VALUES (?, ?, 'EASY')`,
      [userId, name]
    );

    const routineId = result.insertId;

    for (const exerciseId of exerciseIds) {
      await connection.query(
        `INSERT INTO routine_exercise (routine_id, exercise_id) VALUES (?, ?)`,
        [routineId, exerciseId]
      );
    }

    await refreshRoutineDifficulty(routineId, connection);
    await connection.commit();
    return routineId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getRoutinesByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.name, r.difficulty, COALESCE(COUNT(re.exercise_id), 0) AS exerciseCount
     FROM routines r
     LEFT JOIN routine_exercise re ON re.routine_id = r.id
     WHERE r.user_id = ?
     GROUP BY r.id, r.name, r.difficulty
     ORDER BY r.id DESC`,
    [userId]
  );
  return rows;
}

export async function getRoutineById(routineId) {
  const [routineRows] = await pool.query(
    `SELECT id, user_id AS userId, name, difficulty FROM routines WHERE id = ?`,
    [routineId]
  );

  if (routineRows.length === 0) {
    return null;
  }

  const [exerciseRows] = await pool.query(
    `SELECT e.id, e.name, e.muscle_group AS muscleGroup, e.description, e.duration_minutes AS durationMinutes, e.difficulty
     FROM routine_exercise re
     INNER JOIN exercises e ON e.id = re.exercise_id
     WHERE re.routine_id = ?
     ORDER BY e.id ASC`,
    [routineId]
  );

  return {
    ...routineRows[0],
    exercises: exerciseRows,
  };
}

export async function deleteRoutineById(routineId) {
  const [result] = await pool.query(`DELETE FROM routines WHERE id = ?`, [routineId]);
  return result.affectedRows > 0;
}

export async function removeExerciseFromRoutine(routineId, exerciseId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `DELETE FROM routine_exercise WHERE routine_id = ? AND exercise_id = ?`,
      [routineId, exerciseId]
    );

    if (result.affectedRows > 0) {
      await refreshRoutineDifficulty(routineId, connection);
    }

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addExerciseToRoutine(routineId, exerciseId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT IGNORE INTO routine_exercise (routine_id, exercise_id) VALUES (?, ?)`,
      [routineId, exerciseId]
    );
    await refreshRoutineDifficulty(routineId, connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
