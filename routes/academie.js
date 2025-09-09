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
          u.age_actuel,
          u.motivations,
          d.labelle_division,
          a.note_qcm,
          a.note_zanjutsu,
          a.date_inscription
      FROM academie a 
        JOIN users u ON a.id_user = u.id_user
        LEFT JOIN divisions d ON u.choix_div = d.id_div
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
      `UPDATE academie SET status_candid = 'Réussite' WHERE id_aspirant= $1 RETURNING *`,
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

router.put('/academie/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Récupère l'ID de l'aspirant depuis les paramètres de l'URL
    const { note_qcm, note_zanjutsu } = req.body; // Récupère les notes depuis le corps de la requête

    // 1. Vérifiez que les notes sont présentes et sont des nombres
    if (note_qcm === undefined || note_zanjutsu === undefined || isNaN(note_qcm) || isNaN(note_zanjutsu)) {
      return res.status(400).json({ message: 'Les notes de QCM et de Zanjutsu sont requises et doivent être des nombres.' });
    }

    // 2. Mettez à jour les notes dans la table "academie"
    const updateResult = await pool.query(
      `UPDATE academie SET note_qcm = $1, note_zanjutsu = $2 WHERE id_aspirant = $3 RETURNING *`,
      [note_qcm, note_zanjutsu, id]
    );

    // 3. Vérifiez si une ligne a été mise à jour
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aspirant non trouvé pour cet identifiant.' });
    }

    // 4. Renvoie l'enregistrement mis à jour
    res.json(updateResult.rows[0]);

  } catch (error) {
    console.error('Erreur DB lors de la mise à jour des notes :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});



module.exports = router;
