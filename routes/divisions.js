const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middlewares/authMiddleware');

// Connexion à PostgreSQL avec la même configuration que celle de ton exemple
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Route pour récupérer la liste des divisions
router.get('/divisions', async (req, res) => {
  try {
    // Récupérer uniquement id_div, labelle_division et description_division
    const result = await pool.query('SELECT id_div, labelle_division, description_division, nom_gerant FROM divisions ORDER BY id_div ASC');

    // Renvoyer les résultats sous forme de JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des divisions:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/get_user_division', authMiddleware, async (req, res) => {
  try {
    const userIdentifiant = req.user.identifiant;
    const userResult = await pool.query('SELECT division FROM users WHERE identifiant = $1', [userIdentifiant]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    } 
    const userDivisionId = userResult.rows[0].division;
    if (!userDivisionId) {
      return res.status(200).json({ message: 'L\'utilisateur n\'appartient à aucune division.' });
    } 

    const divisionResult = await pool.query('SELECT id_div, labelle_division, description_division FROM divisions WHERE id_div = $1', [userDivisionId]);
    if (divisionResult.rowCount === 0) {
      return res.status(404).json({ message: 'Division non trouvée.' });
    }
    res.json(divisionResult.rows[0]);
  } catch (err) {
    console.error('Erreur serveur lors de la récupération de la division de l\'utilisateur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  } 
});


// ROUTE DES EFFECTIFS DE DIVISIONS

router.get('/divisions/effectifs/1ere', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 1
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/4e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 2
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/6e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 3
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/9e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 4
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/10e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 5
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/11e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 6
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/12e', authMiddleware, async (req, res) => {
  try {
    // Recup les effectifs de la 1ere division
    const result = await pool.query(`
      SELECT
        u.nom,
        u.prenom,
        u.age_actuel,
        u.rang,
        u.etat,
        u.niveau_accreditation
      FROM users u
        JOIN divisions d on u.division = d.id_div
      WHERE u.division = 7
    `);

    // S'assurer qu'il y a des résultats avant de répondre
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 1ère division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 1ere division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/// CANDIDATURES DE DIVISIONS
// Voir la liste des candidats
router.get('/divisions/candidatures', authMiddleware, async (req, res) => {
  try {
    const userIdentifiant = req.user.identifiant;
    const userResult = await pool.query('SELECT division FROM users WHERE identifiant = $1', [userIdentifiant]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const userDivisionId = userResult.rows[0].division;

    // Récupération des candidatures
    const result = await pool.query(`
        SELECT 
        a.id_aspirant,
        u.nom,
        u.prenom,
        u.age_actuel,
        u.motivations
        FROM users u
        JOIN divisions d ON u.choix_div = d.id_div
        JOIN academie a ON u.id_user = a.id_user
      WHERE 
        u.choix_div = $1 
        AND u.division IS NULL 
        AND a.status_candid = 'Réussite'
      `, [userDivisionId]);
      // Répondre avec les candidatures trouvées ou un tableau vide
      res.status(200).json(result.rows);
  } catch (err) {
      console.error('Erreur serveur lors de la récupération des candidatures de la division:', err);
      res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/divisions/candidatures/:id_aspirant/accept', authMiddleware, async (req, res) => {
  try {
    const { id_aspirant } = req.params;
    const userResult = await pool.query(
      `SELECT 
        u.choix_div,
        u.id_user
      FROM users u 
      JOIN academie a ON u.id_user = a.id_user
      WHERE a.id_aspirant = $1`, [id_aspirant]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    const id_user = userResult.rows[0].id_user;
    const userDivisionChoiceId = userResult.rows[0].choix_div;
    const updateResult = await pool.query(
      `UPDATE users SET 
      division = $1,
      rang = '3e classe',
      niveau_accreditation = $3
      WHERE id_user = $2 RETURNING *`,
      [userDivisionChoiceId, id_user, [2]]
    );
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Candidat non trouvé.' });
    }
    // A new object with only the public information
    const publicUser = {
      id_user: updateResult.rows[0].id_user,
      prenom: updateResult.rows[0].prenom,
      nom: updateResult.rows[0].nom,
      division: updateResult.rows[0].division,
      rang: updateResult.rows[0].rang,
      niveau_accreditation: updateResult.rows[0].niveau_accreditation,
      };

// Send the new, filtered object
res.json(publicUser);
  } catch (err) {
    console.error('Erreur serveur lors de l\'acceptation du candidat :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/get_actu_public/:id', authMiddleware, async (req, res) => {
    try {
        const divisionId = req.params.id;
        console.log('divisionId:', divisionId); // Pour déboguer
        const result = await pool.query(`
            SELECT 
                d.titre_actu_publique,
                d.contenu_actu_publique
            FROM divisions d
            WHERE d.id_div = $1
        `, [divisionId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Aucune actualité publique trouvée pour cette division.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur serveur lors de la récupération de l\'actualité publique de la division :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
