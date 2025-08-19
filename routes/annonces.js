// 📁 routes/annonces.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // ton fichier de connexion PG
const auth = require('../middleware/auth'); // ton middleware de sécurité

// GET /annonces/simple - récupérer les annonces de type "simple"
router.get('/simple', auth, async (req, res) => {
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
      JOIN users u ON a.userid = u.id
      WHERE a.type_annonce = 'simple'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des annonces simples :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
