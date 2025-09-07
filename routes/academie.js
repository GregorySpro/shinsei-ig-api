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
          u.nom, 
          u.prenom, 
          u.age_actuel, 
          u.rang, 
          d.labelle_division, 
          u.status_choix, 
          u.motivations
      FROM users u
      JOIN divisions d ON u.choix_div = d.id_div
      ORDER BY u.rang ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur DB academie/aspirants:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
