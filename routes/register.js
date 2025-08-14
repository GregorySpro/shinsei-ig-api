const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.post('/register_acre', async (req, res) => {
  const { identifiant, password, prenom, nom, age, division } = req.body;

  // Vérification des champs requis
  if (!identifiant || !password || !prenom || !nom || !age || !division) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  try {
    const client = await pool.connect();

    // Vérifie que l'identifiant est unique
    const checkQuery = 'SELECT 1 FROM users WHERE identifiant = $1';
    const checkResult = await client.query(checkQuery, [identifiant]);

    if (checkResult.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: 'Identifiant déjà utilisé.' });
    }

    // Hash du mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    // Insertion avec les valeurs par défaut pour les champs non envoyés
    const insertQuery = `
      INSERT INTO users (
        prenom, nom, age_creation, age_actuel,
        choix_div, identifiant, password,
        motivations, status_choix, rang,
        premiere_co_div, niveau_accreditation,
        omnitsukido, etat
      ) VALUES (
        $1, $2, $3, $3,
        $4, $5, $6,
        NULL, 'en attente', '3e classe',
        TRUE, 1,
        FALSE, 'vivant'
      ) RETURNING id_user
    `;

    const result = await client.query(insertQuery, [
      prenom,
      nom,
      age,
      division,
      identifiant,
      hashedPassword
    ]);

    client.release();

    return res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      id_user: result.rows[0].id_user
    });
  } catch (err) {
    console.error('Erreur serveur :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
