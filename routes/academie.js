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
    // On ne prend plus l'identifiant du token (req.user.identifiant)
    // On récupère l'id_aspirant depuis le corps de la requête
    const { id_aspirant } = req.body;

    // Vérification de la présence du paramètre id_aspirant
    if (!id_aspirant) {
      return res.status(400).json({ message: 'Le paramètre id_aspirant est manquant.' });
    }

    // 1. Mettre à jour le statut dans la table "academie" en utilisant id_aspirant
    // Attention : J'ai supposé que id_aspirant correspond à id_academie dans la table academie.
    // Si id_aspirant est en réalité l'id_user, la requête SQL doit être ajustée.
    const updateResult = await pool.query(
      `UPDATE academie SET status_candid = 'Réussite' WHERE id_academie = $1 RETURNING *`,
      [id_aspirant]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aspirant non trouvé pour cet identifiant.' });
    }

    res.json(updateResult.rows[0]);

  } catch (error) {
    console.error('Erreur DB lors de la validation du candidat :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});



module.exports = router;
