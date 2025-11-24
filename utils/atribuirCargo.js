// utils/atribuirCargo.js

async function atribuirCargoEmMassa(members, role, delay = 500) {
  let aplicados = 0;
  let falhas = 0;

  for (const member of members) {
    try {
      if (!member.roles.cache.has(role.id) && !member.user.bot) {
        await member.roles.add(role);
        aplicados++;
      }
    } catch (err) {
      console.warn(`Erro ao aplicar cargo em ${member.user.tag}: ${err.message}`);
      falhas++;
    }

    await new Promise(res => setTimeout(res, delay));
  }

  return { aplicados, falhas };
}

module.exports = { atribuirCargoEmMassa };