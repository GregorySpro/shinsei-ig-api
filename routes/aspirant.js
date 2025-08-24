const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.get('/aspirant/profil', authMiddleware, async (req, res) => {
  try {
    const aspirantId = req.user.id; // 👈 clé à adapter selon le contenu du token

    const query = `
      SELECT nom, prenom, rang, choix_div, status_choix, motivations
      FROM users
      WHERE id_user = $1
    `;
    const result = await pool.query(query, [aspirantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aspirant non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
