const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/coins.json');

function loadCoins() {
    if (!fs.existsSync(dbPath)) return {};
    const data = fs.readFileSync(dbPath, 'utf8') || '{}';
    try {
        const parsed = JSON.parse(data);
        for (const userId in parsed) {
            if (typeof parsed[userId].carteira !== 'number') parsed[userId].carteira = 0;
            if (typeof parsed[userId].banco !== 'number') parsed[userId].banco = 0;
        }
        return parsed;
    } catch {
        return {};
    }
}

function saveCoins(coins) {
    fs.writeFileSync(dbPath, JSON.stringify(coins, null, 4), 'utf8');
}

function parseAmount(input) {
    const suffixes = {
        k: 1_000,
        m: 1_000_000,
        b: 1_000_000_000
    };
    const match = input.toLowerCase().match(/^(\d+(\.\d+)?)([kmb])?$/);
    if (!match) return null;
    const [, num, , suffix] = match;
    return parseFloat(num) * (suffix ? suffixes[suffix] : 1);
}

function formatAmount(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0';

    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}b`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toLocaleString("pt-BR");
}

module.exports = {
    loadCoins,
    saveCoins,
    parseAmount,
    formatAmount
};