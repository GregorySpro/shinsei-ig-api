const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Route protégée qui renvoie la division choisie
router.get('/division', authMiddleware, async (req, res) => {
  const identifiant = req.user.identifiant;

  try {
    const result = await pool.query(
      'SELECT choix_div FROM users WHERE identifiant = $1',
      [identifiant]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const division = result.rows[0].choix_div;

    res.json({ division });
  } catch (error) {
    console.error('Erreur DB:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
