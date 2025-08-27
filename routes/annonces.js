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

router.get('/global', authMiddleware, async (req, res) => {
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
      WHERE a.type_annonce = 'global'
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
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
      ORDER BY a.date DESC, a.heure DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error); // <== ici
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/division', authMiddleware, async (req, res) => {
  try {
    const identifiant = req.user.identifiant; // ou req.user.user_id selon ce que ton middleware set

    // Récupérer la division de l'utilisateur
    const userDivisionResult = await pool.query(
      'SELECT division FROM users WHERE identifiant = $1',
      [identifiant]
    );

    if (userDivisionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userDivision = userDivisionResult.rows[0].division;

    // Récupérer les annonces de type 'division' qui correspondent à la division de l'utilisateur
    const annoncesResult = await pool.query(`
      SELECT 
        a.titre_annonce,
        a.content_annonce,
        a.date,
        a.heure,
        u.prenom,
        u.nom
      FROM annonces a
      JOIN users u ON a.userid = u.id_user
      WHERE a.type_annonce = 'division' AND a.division = $1
      ORDER BY a.date DESC, a.heure DESC
    `, [userDivision]);

    res.status(200).json(annoncesResult.rows);
  } catch (error) {
    console.error('Erreur DB complète:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


module.exports = router;
