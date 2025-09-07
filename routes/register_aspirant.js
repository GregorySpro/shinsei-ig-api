const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.post('/register_aspirant', async (req, res) => {
  const { identifiant, password, prenom, nom, age, division, motivations } = req.body;

  // Vérification des champs requis, en autorisant 'nom' à être null
  if (!identifiant || !password || !prenom || !age || !division || !motivations) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  const client = await pool.connect();

  try {
    // Démarre la transaction
    await client.query('BEGIN');

    // Vérifie que l'identifiant est unique
    const checkQuery = 'SELECT 1 FROM users WHERE identifiant = $1';
    const checkResult = await client.query(checkQuery, [identifiant]);

    if (checkResult.rows.length > 0) {
      // Annule la transaction si l'identifiant est déjà utilisé
      await client.query('ROLLBACK');
      client.release();
      return res.status(409).json({ message: 'Identifiant déjà utilisé.' });
    }

    // Hash du mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    // Insertion du nouvel utilisateur
    const insertUserQuery = `
      INSERT INTO users (
        prenom, nom, age_creation, age_actuel,
        choix_div, identifiant, password,
        motivations, status_choix, rang,
        premiere_co_div, niveau_accreditation,
        omnitsukido, etat
      ) VALUES (
        $1, $2, $3, $3,
        $4, $5, $6,
        $7, 'en attente', 'Aspirant',
        TRUE, NULL,
        FALSE, 'vivant'
      ) RETURNING id_user
    `;

    const userResult = await client.query(insertUserQuery, [
      prenom,
      nom || null,
      age,
      division,
      identifiant,
      hashedPassword,
      motivations
    ]);

    // Récupère l'ID du nouvel utilisateur
    const newUserId = userResult.rows[0].id_user;
    
    // Insertion dans la table "academie" en utilisant l'ID de l'utilisateur
    const insertAcademieQuery = `
      INSERT INTO academie (id_user, division)
      VALUES ($1, $2)
    `;
    await client.query(insertAcademieQuery, [newUserId, division]);

    // Valide la transaction
    await client.query('COMMIT');
    client.release();

    return res.status(201).json({
      message: 'Utilisateur et entrée Academie créés avec succès.',
      id_user: newUserId
    });

  } catch (err) {
    // En cas d'erreur, annule la transaction pour éviter les données incohérentes
    await client.query('ROLLBACK');
    client.release();
    console.error('Erreur serveur :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
