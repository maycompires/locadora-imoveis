const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

//Criando conexão com Banco de Dados
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'locadora_imoveis'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL!');
});

// Rota para obter os dados de imóveis
app.get('/imoveis', (req, res) => {
    const sql = 'SELECT * FROM imoveis ORDER BY codigo_imovel;';
    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao consultar imóveis');
        }
        res.json(results);
    });
});

// Rota para obter os dados de tipos de imóveis
app.get('/tipo_imoveis', (req, res) => {
    const sql = 'SELECT * FROM tipo_imoveis ORDER BY id_tipo;';
    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao consultar tipos de imóveis');
        }
        res.json(results);
    });
});

// Rota para obter os dados de pagamentos
app.get('/pagamentos', (req, res) => {
    const sql = 'SELECT * FROM pagamentos ORDER BY data_do_pagamento;';
    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao consultar pagamentos');
        }
        res.json(results);
    });
});

// Rota para obter os dados com JOIN
app.get('/dados', (req, res) => {
    const sql = `
        SELECT 
            p.id_venda,
            p.data_do_pagamento,
            p.valor_do_pagamento,
            i.codigo_imovel,
            i.descricao_imovel,
            ti.descricao_tipo AS tipo_imovel
        FROM pagamentos p
        JOIN imoveis i ON p.codigo_imovel = i.codigo_imovel
        JOIN tipo_imoveis ti ON i.id_tipo = ti.id_tipo
        ORDER BY p.data_do_pagamento;
    `;
    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Erro ao consultar dados');
        }
        res.json(results);
    });
});

// Rota de teste
app.get('/', (req, res) => {
    res.send('<h1 style="text-align:center">Servidor rodando com sucesso!</h1>');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

