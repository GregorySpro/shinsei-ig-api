const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
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

router.get('/get_division_user', authMiddleware, async (req, res) => {
  const identifiant = req.user.identifiant;

  try {
    const result = await pool.query(
      `SELECT d.labelle_division
      FROM users u
      JOIN divisions d ON u.choix_div = d.id
      WHERE u.identifiant = $1`,
      [identifiant]
    );

    if (result.rows.length === 0) {
      // Si aucune division n'est trouvée pour cet utilisateur, on peut renvoyer une erreur 404
      // ou un message indiquant que l'utilisateur n'est associé à aucune division.
      return res.status(404).json({ message: 'Division non trouvée pour cet utilisateur' });
    }

    // On renvoie le premier (et unique) résultat, qui contient le labelle_division
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur DB /user/division:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
