const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <- ajout
const router = express.Router();
const { Pool } = require('pg');

// Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { identifiant, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE identifiant = $1 LIMIT 1', [identifiant]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // ✅ Création du token
    const payload = {
      userId: user.id,
      identifiant: user.identifiant,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '2h', // tu peux ajuster la durée ici
    });

    // 🔁 Envoie du token au client
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, identifiant: user.identifiant }, // infos utiles côté client
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
