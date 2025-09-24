const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middlewares/authMiddleware');

// Connexion à PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Routes spécifiques d'abord ---

// Route pour récupérer la division de l'utilisateur connecté
router.get('/divisions/get_user_division', authMiddleware, async (req, res) => {
  try {
    const userIdentifiant = req.user.identifiant;
    console.log('userIdentifiant:', userIdentifiant); // Pour déboguer
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

// Route pour voir la liste des candidats
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

// Route pour accepter une candidature
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
    const publicUser = {
      id_user: updateResult.rows[0].id_user,
      prenom: updateResult.rows[0].prenom,
      nom: updateResult.rows[0].nom,
      division: updateResult.rows[0].division,
      rang: updateResult.rows[0].rang,
      niveau_accreditation: updateResult.rows[0].niveau_accreditation,
    };
    res.json(publicUser);
  } catch (err) {
    console.error('Erreur serveur lors de l\'acceptation du candidat :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ROUTE DES EFFECTIFS DE DIVISIONS - Regroupées pour une meilleure lisibilité
// Une meilleure pratique serait d'avoir une seule route générique ici
router.get('/divisions/effectifs/1ere', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 1`);
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
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 2`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 4ème division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 4ème division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Répéter le même modèle pour les autres divisions...
// Note : pour éviter la redondance, une seule route comme `/divisions/effectifs/:divisionId` serait idéale.
router.get('/divisions/effectifs/6e', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 3`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 6e division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 6e division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/9e', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 4`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 9e division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 9e division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/10e', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 5`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 10e division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 10e division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/11e', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 6`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 11e division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 11e division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/12e', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 7`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour la 12e division.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de la 12e division:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/souverain', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 8`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre souverain.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre souverain:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/medical', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 9`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre médical.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre médical:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/glaive', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 10`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre glaive.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre glaive:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/sentinelle', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 12`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre sentinelle.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre sentinelle:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/belliqueux', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 13`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre belliqueux.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre belliqueux:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/divisions/effectifs/savant', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.nom, u.prenom, u.age_actuel, u.rang, u.etat, u.niveau_accreditation FROM users u JOIN divisions d on u.division = d.id_div WHERE u.division = 14`);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: 'Aucun effectif trouvé pour l\'ordre savant.' });
    }
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des effectifs de l\'ordre savant:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// --- Routes génériques ensuite ---

// Route pour récupérer une actualité publique par ID de division
router.get('/divisions/get_actu_public/:id', authMiddleware, async (req, res) => {
  try {
    const divisionId = req.params.id;
    console.log('divisionId:', divisionId);
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

// Route pour la gestion de la division
router.put('/divisions/:id/gestion/update', authMiddleware, async (req, res) => {
  try {
    const divisionId = req.params.id;
    const { description_division, fonction_div, note_ecrit_min, note_zanjutsu_min } = req.body;
    const updateResult = await pool.query(
      `UPDATE divisions SET
      description_division = $1,
      fonction_div = $2,
      note_ecrit_min = $3,
      note_zanjutsu_min = $4
      WHERE id_div = $5 RETURNING *`,
      [description_division, fonction_div, note_ecrit_min, note_zanjutsu_min, divisionId]
    );
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Division non trouvée.' });
    }
    res.json("Mise à jour de la division réussie.");
  } catch (err) {
    console.error('Erreur serveur lors de la mise à jour de la division :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer la liste des divisions par faction (la plus générique)
router.get('/divisions/:faction', async (req, res) => {
  try {
    const { faction } = req.params;
    const result = await pool.query('SELECT id_div, labelle_division, description_division, nom_gerant FROM divisions WHERE type_division = $1 ORDER BY id_div ASC', [faction]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur serveur lors de la récupération des divisions:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


module.exports = router;