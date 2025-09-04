const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Pool } = require('pg');

// Connexion à la base via Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Route POST pour la création d'un nouveau rapport
router.post('/rapports', authMiddleware, async (req, res) => {
    try {
        // Récupération de l'identifiant via le middleware d'authentification
        const userIdentifiant = req.user.identifiant;
        console.log('Identifiant utilisateur authentifié:', userIdentifiant);
        console.log('Corps de la requête:', req.user);

        // Récupération des données du corps de la requête
        const { titre, contenu, categorie, type, accreditations } = req.body;

        // Validation des champs obligatoires
        if (!titre || !contenu || !categorie || !type) {
            return res.status(400).json({ message: 'Données de rapport incomplètes.' });
        }

        // Étape 1: Récupérer l'id_user ET la division de l'utilisateur avec l'identifiant
        const userResult = await pool.query('SELECT id_user, division FROM users WHERE identifiant = $1', [userIdentifiant]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const userId = userResult.rows[0].id_user;
        const userDivisionId = userResult.rows[0].division;

        console.log('ID utilisateur pour DB:', userId);
        console.log('ID de la division:', userDivisionId);

        // Logique conditionnelle pour les données de la base de données
        let reportDivision = null;
        let reportAccreditations = null;

        switch (categorie) {
            case 'division':
                reportDivision = userDivisionId;
                break;
            case 'accreditations':
                if (!accreditations || !Array.isArray(accreditations)) {
                    return res.status(400).json({ message: 'Les accréditations doivent être fournies sous forme de tableau.' });
                }
                reportDivision = userDivisionId
                reportAccreditations = accreditations;
                break;
            case 'publique':
                break;
            default:
                return res.status(400).json({ message: 'Catégorie de rapport invalide.' });
        }

        // Ajout de la date de création
        const date_creation = new Date();

        // Insertion des données dans la base de données avec l'id_user
        const query = `
            INSERT INTO rapports (
                titre,
                contenu,
                categorie,
                type,
                id_createur,
                division,
                destinataires,
                brouillon,
                date_creation
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const values = [
            titre,
            contenu,
            categorie,
            type,
            userId, // Correction ici : On utilise l'id_user
            reportDivision,
            reportAccreditations,
            false,
            date_creation // Ajout de la date de création
        ];

        const newReport = await pool.query(query, values);

        // Réponse de succès
        res.status(201).json({
            message: 'Rapport créé avec succès.',
            report: newReport.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création du rapport:', error);
        res.status(500).json({ message: 'Erreur serveur interne.' });
    }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Nouvelle route GET pour récupérer les rapports publics
router.get('/publics', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT
                r.id_rapport,
                r.titre,
                r.contenu,
                r.type,
                r.id_createur,
                r.date_creation,
                u.prenom,
                u.nom
            FROM
                rapports AS r
            LEFT JOIN
                users AS u ON r.id_createur = u.id_user
            WHERE
                r.categorie = 'publique';
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rapports publics :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération des rapports.',
            error: error.message
        });
    }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Nouvelle route GET pour récupérer les rapports de la division de l'utilisateur
// Utilisation du middleware d'authentification pour obtenir l'ID utilisateur
router.get('/division', authMiddleware, async (req, res) => {
    try {
        const userIdentifiant = req.user.identifiant;

        // Étape 1: Récupérer la division et les accréditations de l'utilisateur
        const userResult = await pool.query('SELECT division, niveau_accreditation FROM users WHERE identifiant = $1', [userIdentifiant]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Division de l\'utilisateur non trouvée.' });
        }
        const userDivision = userResult.rows[0].division;
        const userAcreds = userResult.rows[0].niveau_accreditation || []; // S'assurer que c'est un tableau, même s'il est null

        // Étape 2: Récupérer le nom de la table d'accréditation en fonction de la division
        const divisionResult = await pool.query('SELECT table_acre FROM divisions WHERE id_div = $1', [userDivision]);
        if (divisionResult.rowCount === 0) {
            return res.status(404).json({ message: 'Division de l\'utilisateur non trouvée.' });
        }
        const tableName = divisionResult.rows[0].table_acre;

        // Étape 3: Créer la requête pour récupérer les rapports de 'division' et 'accreditation'
        let query;
        let queryParams;

        // Si l'utilisateur a des accréditations, inclure les rapports d'accréditation dans la requête
        if (userAcreds.length > 0) {
            query = `
                SELECT
                    r.id_rapport,
                    r.titre,
                    r.contenu,
                    r.type,
                    r.id_createur,
                    r.categorie,
                    r.division,
                    r.date_creation,
                    u.prenom,
                    u.nom,
                    d.labelle_division,
                    CASE
                        WHEN r.categorie = 'accreditations' THEN acre.labelle_accre
                        ELSE NULL
                    END AS labelle_accre
                FROM
                    rapports AS r
                LEFT JOIN
                    users AS u ON r.id_createur = u.id_user
                INNER JOIN 
                    divisions AS d ON r.division = d.id_div
                LEFT JOIN 
                    ${tableName} AS acre ON acre.id_accre = ANY(r.destinataires)
                WHERE
                    (r.categorie = 'division' AND r.division = $1)
                OR
                    (r.categorie = 'acreditation' AND r.destinataires && $2);
            `;
            queryParams = [userDivision, userAcreds];
        } else {
            // Si l'utilisateur n'a pas d'accréditations, ne récupérer que les rapports de division
            query = `
                SELECT
                    r.id_rapport,
                    r.titre,
                    r.contenu,
                    r.type,
                    r.id_createur,
                    r.categorie,
                    r.division,
                    r.date_creation,
                    u.prenom,
                    u.nom,
                    d.labelle_division,
                    NULL AS labelle_accre
                FROM
                    rapports AS r
                LEFT JOIN
                    users AS u ON r.id_createur = u.id_user
                INNER JOIN 
                    divisions AS d ON r.division = d.id_div
                WHERE
                    r.categorie = 'division' AND r.division = $1;
            `;
            queryParams = [userDivision];
        }
        
        const { rows } = await pool.query(query, queryParams);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Erreur lors de la récupération des rapports :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération des rapports.',
            error: error.message
        });
    }
});


router.get('/mes-rapports', authMiddleware, async (req, res) => {
    try {
        // L'ID de l'utilisateur est récupéré du middleware d'authentification
        const userIdentifiant = req.user.identifiant;
        console.log('Récupération des rapports pour l\'utilisateur ID:', userIdentifiant);

        // Étape 1: Récupérer l'id_user
        const userResult = await pool.query('SELECT id_user FROM users WHERE identifiant = $1', [userIdentifiant]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const userId = userResult.rows[0].id_user;

        // Requête pour récupérer tous les rapports de l'utilisateur avec le labelle_division
        const query = `
            SELECT
                r.id_rapport,
                r.titre,
                r.contenu,
                r.type,
                r.categorie,
                r.division,
                r.date_creation,
                d.labelle_division,  -- On ajoute la colonne labelle_division ici
                u.prenom,
                u.nom
            FROM
                rapports AS r
            LEFT JOIN
                users AS u ON r.id_createur = u.id_user
            LEFT JOIN
                divisions AS d ON r.division = d.id_div  -- Jointure avec la table divisions
            WHERE
                r.id_createur = $1;
        `;

        const { rows } = await pool.query(query, [userId]);
        
        // Si aucun rapport n'est trouvé, renvoyer un tableau vide avec un message
        if (rows.length === 0) {
            return res.status(200).json({
                message: "L'utilisateur n'a créé aucun rapport.",
                reports: []
            });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des rapports de l\'utilisateur :', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la récupération de vos rapports.',
            error: error.message
        });
    }
});


module.exports = router;

