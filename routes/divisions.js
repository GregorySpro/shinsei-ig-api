const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Connexion à PostgreSQL avec la même configuration que celle de ton exemple
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Route pour récupérer la liste des divisions
router.get('/divisions', async (req, res) => {
  try {
    // Récupérer uniquement id_div, labelle_division et description_division
    const result = await pool.query('SELECT id_div, labelle_division, description_division FROM divisions');

    // Renvoyer les résultats sous forme de JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des divisions:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
