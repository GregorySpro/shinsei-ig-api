const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

// Connexion à la base via Pool (comme ta route /profile)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

router.get('/simple', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      WHERE a.type_annonce = 'simple'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/globale', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      WHERE a.type_annonce = 'globale'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


module.exports = router;
