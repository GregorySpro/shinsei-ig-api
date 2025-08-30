const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.post('/register_acre', async (req, res) => {
  const { identifiant, password, prenom, nom, age, division } = req.body;

  // Vérification des champs requis, en autorisant 'nom' à être null
  if (!identifiant || !password || !prenom || !age || !division) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  try {
    const client = await pool.connect();

    const checkQuery = 'SELECT 1 FROM users WHERE identifiant = $1';
    const checkResult = await client.query(checkQuery, [identifiant]);

    if (checkResult.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: 'Identifiant déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion avec 'nom' pouvant être null si non envoyé
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
        TRUE, NULL,
        FALSE, 'vivant'
      ) RETURNING id_user, identifiant
    `;

    const result = await client.query(insertQuery, [
      prenom,
      nom || null,  // Si 'nom' est absent, on envoie null
      age,
      division,
      identifiant,
      hashedPassword
    ]);

    client.release();

    const newUser = result.rows[0];

    // Création du token JWT
    const payload = {
      userId: newUser.id_user,
      identifiant: identifiant,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    return res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      id_user: newUser.id_user,
      token,  // <-- ici on envoie le token
    });
  } catch (err) {
    console.error('Erreur serveur :', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
