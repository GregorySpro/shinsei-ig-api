const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Exemple de pool, adapte en fonction de ta config
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Handler pour récupérer les infos du profil aspirant
router.get('/aspirant/profil', authMiddleware, async (req, res) => {
  try {
    // On récupère l'ID de l'aspirant depuis le token si tu l'as mis dans req.user par exemple
    // Sinon tu peux récupérer via query, params, etc.
    const aspirantId = req.user.id; 

    // Adaptation selon ta table et ta structure
    const query = `
      SELECT nom, prenom, grade, choix_div, status_choix, motivations
      FROM aspirants
      WHERE id = $1
    `;
    const result = await pool.query(query, [aspirantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aspirant non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
