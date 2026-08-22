const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [tasks] = await db.query(
      `SELECT id, title, description, due_date, priority, completed, created_at
       FROM tasks
       WHERE user_id = ?
       ORDER BY due_date ASC`,
      [userId]
    );
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, due_date, priority, completed } = req.body;

    const [result] = await db.query(
      `UPDATE tasks SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        priority = COALESCE(?, priority),
        completed = COALESCE(?, completed),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [title, description, due_date, priority, completed, taskId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [updated] = await db.query(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, due_date, priority } = req.body;

    const [result] = await db.query(
      `INSERT INTO tasks (user_id, title, description, due_date, priority)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, description, due_date, priority || 'MEDIUM']
    );

    const [task] = await db.query(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(task[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

module.exports = router;