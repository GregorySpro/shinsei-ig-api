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
        JOIN users u ON a.id_user = u.id_user
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur DB academie/aspirants:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/academie/valider', authMiddleware, async (req, res) => {
  try {
    const identifiant = req.user.identifiant;

    // 1. Récupérer l'id_user à partir de la table "users"
    const userResult = await pool.query(
      `SELECT id_user FROM users WHERE identifiant = $1`,
      [identifiant]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const id_user = userResult.rows[0].id_user;

    // 2. Mettre à jour le statut dans la table "academie"
    const updateResult = await pool.query(
      `UPDATE academie SET statut_candid = 'Réussite' WHERE id_user = $1 RETURNING *`,
      [id_user]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aspirant non trouvé pour cet utilisateur.' });
    }

    res.json(updateResult.rows[0]);

  } catch (error) {
    console.error('Erreur DB lors de la validation du candidat :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
