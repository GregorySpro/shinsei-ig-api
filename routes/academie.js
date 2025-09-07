const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.get('/academie/aspirants', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
          u.prenom,
          u.nom,
          u.rang,
          a.note_qcm,
          a.note_zanjutsu,
          a.date_inscription
      FROM academie a 
        JOIN users u ON a.user_id = u.user_id
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur DB academie/aspirants:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
