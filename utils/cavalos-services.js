const db = require('../models/'); // Adjust the path as needed

const { ColetaSite, PropriedadeCavalo } = db;

async function createPropriedadeCavaloRecord(registro, SIGLA) {
    try {
        // Step 1: Retrieve the cst_id from the coleta_site table based on the SIGLA
        const coletaSite = await ColetaSite.findOne({
            where: { cst_sigla: SIGLA }
        });

        if (!coletaSite) {
            throw new Error(`No record found in coleta_site with SIGLA: ${SIGLA}`);
        }

        const cst_id = coletaSite.dataValues.cst_id; // Extract cst_id from the query result

        // Step 2: Create a new PropriedadeCavalo record using the retrieved cst_id
        const newPropriedadeCavalo = await PropriedadeCavalo.create({
            ...registro, // All other fields passed in `registro`
            csc_coleta_site_id: cst_id // Foreign key
        });

        console.log('New PropriedadeCavalo record created:', newPropriedadeCavalo);
    } catch (error) {
        console.error('Error creating PropriedadeCavalo record:', error.message);
    }
}

// Usage example
// const registro = {
//     csc_registro_cavalo: 'ABC123',
//     csc_nome_cavalo: 'Thunder',
//     csc_nascimento_cavalo: '2015-06-21',
//     csc_sexo_cavalo: 'M',
//     csc_nome_proprietario_cavalo: 'John Doe',
//     csc_endereco_proprietario: '123 Ranch Road',
//     csc_nome_criador: 'Jane Smith',
//     csc_is_vivo: true,
//     csc_data_importacao: new Date()
// };

// const SIGLA = 'EXAMPLE_SIGLA';

// await createPropriedadeCavaloRecord(registro, SIGLA);
exports.createPropriedadeCavaloRecord = createPropriedadeCavaloRecord
