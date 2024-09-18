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

// Rota para obter a soma dos pagamentos por imóvel
app.get('/soma_pagamentos', (req, res) => {
    const sql = `
        SELECT 
            i.codigo_imovel, 
            p.valor_do_pagamento
        FROM pagamentos p
        JOIN imoveis i ON p.codigo_imovel = i.codigo_imovel;
    `;
    
    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send(`Erro ao consultar os pagamentos: ${error.message}`);
        }

        // Processamento funcional em memória com conversão de valor_do_pagamento para número
        const somaPagamentos = results.reduce((acc, pagamento) => {
            if (!acc[pagamento.codigo_imovel]) {
                acc[pagamento.codigo_imovel] = 0;
            }
            acc[pagamento.codigo_imovel] += parseFloat(pagamento.valor_do_pagamento);
            return acc;
        }, {});

        // Converte o resultado em um array de objetos
        const resultadoFinal = Object.keys(somaPagamentos).map(codigo_imovel => ({
            codigo_imovel,
            soma_pagamentos: somaPagamentos[codigo_imovel].toFixed(2)
        }));

        res.json(resultadoFinal);
    });
});


// Rota para obter a soma dos pagamentos por mês e ano
app.get('/vendas_por_mes', (req, res) => {
    const sql = `
        SELECT
            DATE_FORMAT(data_do_pagamento, '%Y-%m') AS periodo,
            valor_do_pagamento
        FROM pagamentos
    `;

    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send(`Erro ao consultar vendas por mês: ${error.message}`);
        }

        // Processar os resultados
        const vendasPorMes = results
            .map(row => ({
                periodo: row.periodo,
                valor: parseFloat(row.valor_do_pagamento)
            }))
            .reduce((acc, curr) => {
                if (!acc[curr.periodo]) {
                    acc[curr.periodo] = 0;
                }
                acc[curr.periodo] += curr.valor;
                return acc;
            }, {});

        // Transformar o resultado em um array ordenado por período
        const vendasPorMesArray = Object.keys(vendasPorMes)
            .map(periodo => ({ periodo, total_vendas: vendasPorMes[periodo] }))
            .sort((a, b) => a.periodo.localeCompare(b.periodo));

        res.json(vendasPorMesArray);
    });
});

// Percentual de vendas por tipo de imóvel
app.get('/percentual_imoveis', (req, res) => {
    const sql = `
        SELECT 
            i.tipo_imovel, 
            p.codigo_imovel
        FROM 
            pagamentos p
        JOIN imoveis i ON p.codigo_imovel = i.codigo_imovel;
    `;

    connection.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send(`Erro ao consultar dados de imóveis: ${error.message}`);
        }

        // Total de vendas (quantidade de registros)
        const totalVendas = results.length;

        // Processamento em memória para calcular o percentual
        const vendasPorImovel = results.reduce((acc, curr) => {
            if (!acc[curr.tipo_imovel]) {
                acc[curr.tipo_imovel] = 0;
            }
            acc[curr.tipo_imovel] += 1;
            return acc;
        }, {});

        // Transformar os resultados em um array e calcular o percentual
        const percentualImoveis = Object.keys(vendasPorImovel).map(tipo_imovel => ({
            tipo_imovel,
            total_vendas: vendasPorImovel[tipo_imovel],
            percentual: `${((vendasPorImovel[tipo_imovel] / totalVendas) * 100).toFixed(2)}%`
        }));

        res.json(percentualImoveis);
    });
});

// Rota de teste
app.get('/', (req, res) => {
    res.send('<h1 style="text-align:center">Servidor rodando com sucesso!</h1>');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});