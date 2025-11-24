const {  
    ButtonBuilder,  
    ButtonStyle,  
    ActionRowBuilder,  
    EmbedBuilder  
} = require('discord.js');  
  
module.exports = {  
    name: 'avatar',  
    aliases: ['av', 'icon'],  
    description: 'Mostra o avatar do usuário mencionado, por ID, ou do autor.',  
    category: 'Utilidades',  
  
    async execute(message, args) {  
        let user;  
  
        // Tenta pegar o usuário mencionado  
        if (message.mentions.users.first()) {  
            user = message.mentions.users.first();  
        }  
  
        // Tenta pegar por ID  
        else if (args[0]) {  
            try {  
                user = await message.client.users.fetch(args[0]);  
            } catch (err) {  
                // Se ID for inválido, ignora e cai no padrão abaixo  
                console.log(`ID inválido: ${args[0]}`);  
            }  
        }  
  
        // Padrão: autor  
        if (!user) {  
            user = message.author;  
        }  
  
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });  
  
        const embed = new EmbedBuilder()  
            .setColor(0x5865F2)  
            .setTitle(`🖼 Avatar de ${message.guild.members.cache.get(user.id)?.displayName || user.username}`)  
            .setImage(avatarURL)  
            .setFooter({ text: `Requisitado por ${message.author.username}` });  
  
        const row = new ActionRowBuilder().addComponents(  
            new ButtonBuilder()  
                .setLabel('Download')  
                .setStyle(ButtonStyle.Link)  
                .setURL(avatarURL)  
                .setEmoji('<:links:1329724255163781150>') // emoji personalizado  
        );  
  
        message.reply({ embeds: [embed], components: [row] });  
    }  
};