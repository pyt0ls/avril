const fs = require("fs");
const path = require("path");

// Caminho padrão do arquivo de cooldowns
const tempPath = path.join(__dirname, "../database/tempEconomia.json");

// ⚙️ Carrega os dados do arquivo
function loadTempData() {
  if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");
  try {
    const data = fs.readFileSync(tempPath, "utf8");
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}

// 💾 Salva os dados no arquivo
function saveTempData(data) {
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
}

// 🔥 Atualiza um cooldown específico de um usuário
function setCooldown(userId, cooldownKey) {
  const tempData = loadTempData();
  const now = Math.floor(Date.now() / 1000); // Tempo em segundos

  if (!tempData[userId]) tempData[userId] = {};
  tempData[userId][cooldownKey] = now;

  saveTempData(tempData);
}

// ⌛ Verifica se o cooldown já acabou
function isCooldownOver(userId, cooldownKey, cooldownSeconds) {
  const tempData = loadTempData();
  const now = Math.floor(Date.now() / 1000);

  const last = tempData[userId]?.[cooldownKey] || 0;
  return now >= last + cooldownSeconds;
}

// 🕑 Retorna quanto tempo falta pro cooldown acabar
function getCooldownRemaining(userId, cooldownKey, cooldownSeconds) {
  const tempData = loadTempData();
  const now = Math.floor(Date.now() / 1000);

  const last = tempData[userId]?.[cooldownKey] || 0;
  const availableAt = last + cooldownSeconds;

  return Math.max(0, availableAt - now);
}

module.exports = {
  loadTempData,
  saveTempData,
  setCooldown,
  isCooldownOver,
  getCooldownRemaining,
};