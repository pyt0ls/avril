const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { loadCoins, saveCoins, formatAmount } = require('../utils/coinsUtils');
const { 
  loadTempData, 
  saveTempData, 
  setCooldown, 
  isCooldownOver, 
  getCooldownRemaining 
} = require("../utils/cooldownUtils");
const cooldowns = require("../utils/cooldownsConfig");
const { handleTicketInteraction } = require('./ticketCreate');
const { handleTicketButtonInteraction } = require('./ticketButtons');
const config = require("../config");

const checarManutencao = require('../utils/checarManutencao');
const maintenanceFile = './database/maintenance.json';


 // Pegar prefixo customizado ou fallback para padrão
    let prefix = config.PREFIX; 
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
    }

// Map temporário para canal definido na criação de embed
const canalDefinidoMap = new Map();
// Cooldown por usuário
const slashCooldown = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
  
  // VERIFICADOR DE MANUTENÇÃO DO BOT
const maintenance = fs.existsSync(maintenanceFile)
  ? JSON.parse(fs.readFileSync(maintenanceFile, 'utf8'))
  : { active: false, reason: '' };

if (interaction.isChatInputCommand() || interaction.isButton()) {
    if (checarManutencao(interaction, maintenance)) return;
}
  
     // ⛔ VERIFICAÇÃO DE BLACKLIST PARA SLASH COMMAND
  const blacklistPath = './database/blacklist.json';

    if (interaction.isChatInputCommand()) {
      if (fs.existsSync(blacklistPath)) {
        const blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
        const usuario = blacklist[interaction.user.id];
        
        if (usuario) {
          return interaction.reply({
            content: `<:lock:1382067121218912317> <@${interaction.user.id}>, **Você está banido!**\n<:z_whiteregra:1330271051082371188> Não pode utilizar comandos.\n-# <:redseta:1329724263070171197> Motivo: **${usuario.motivo}**`,
            ephemeral: false,
            allowedMentions: { repliedUser: true }
          });
        }
      }
    }


//Outros comandos abaixo

const armasDataPath = path.join(__dirname, '../database/armasData.json');

// Garante que o arquivo exista
if (!fs.existsSync(armasDataPath)) {
    fs.writeFileSync(armasDataPath, JSON.stringify({}, null, 4));
}

async function handleShopMenu(interaction) {
    if (!interaction.isStringSelectMenu()) return false;
    if (!interaction.customId.startsWith('shop-')) return false;

    const [action, userId] = interaction.values[0].split('-');
    if (interaction.user.id !== userId) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Esse menu não é seu.',
                ephemeral: true,
            }).catch(() => {});
        }
        return true;
    }

    // Itens disponíveis para compra
    const shopItems = {
        comprar_faca: { nome: "Facão Cego", preco: 300 },
        comprar_arma: { nome: "Pistola", preco: 500 },
        comprar_fuzil: { nome: "Fuzil AK47", preco: 1500 },
        comprar_vibrador: { nome: "Vibrador Antigo", preco: 2000 },
        comprar_rola: { nome: "Rola de Borracha", preco: 5000 },
    };

    const itemInfo = shopItems[action];
    if (!itemInfo) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Item inválido.',
                ephemeral: true,
            }).catch(() => {});
        }
        return true;
    }

    // Carregar dados do usuário
    const coins = loadCoins();
    if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };

    const armasData = JSON.parse(fs.readFileSync(armasDataPath, 'utf8'));
    if (!armasData[userId]) armasData[userId] = [];

    // Verifica se já possui o item
    if (armasData[userId].includes(itemInfo.nome)) {
        await interaction.reply({
            content: `❌ Você já possui **${itemInfo.nome}**!`,
            ephemeral: true,
        }).catch(() => {});
        return true;
    }

    // Verifica saldo no banco
    if (coins[userId].banco < itemInfo.preco) {
        await interaction.reply({
            content: `❌ Você não possui **${itemInfo.preco.toLocaleString()} coins** no banco para comprar **${itemInfo.nome}**!\n💰 Use \`${prefix}depositar\` para depositar.`,
            ephemeral: true,
        }).catch(() => {});
        return true;
    }

    // Realiza a compra
    coins[userId].banco -= itemInfo.preco;
    armasData[userId].push(itemInfo.nome);

    saveCoins(coins);
    fs.writeFileSync(armasDataPath, JSON.stringify(armasData, null, 4));

    const embed = new EmbedBuilder()
        .setColor("#00ffc3")
        .setTitle("🛒 Compra Realizada")
        .setDescription(`✅ Você comprou **${itemInfo.nome}** por **${itemInfo.preco.toLocaleString()} coins!**`)
        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    try {
        await interaction.update({ embeds: [embed], components: [] });
    } catch (err) {
        console.error('Erro ao atualizar embed do shop:', err);
    }

    return true;
}

module.exports = { handleShopMenu };

//prefeitura trabalhos
const jobDataPath = path.join(__dirname, '../database/jobData.json');

// Garante que o arquivo existe
if (!fs.existsSync(jobDataPath)) {
    fs.writeFileSync(jobDataPath, JSON.stringify({}, null, 4));
}

async function handlePrefeituraMenu(interaction) {
    if (!interaction.isStringSelectMenu()) return false;
    if (!interaction.customId.startsWith('job-')) return false;

    const [jobId, userId] = interaction.values[0].split('-');
    if (interaction.user.id !== userId) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Esse menu não é seu.',
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    const jobs = {
        '1': { title: '👮 Policial', desc: 'Ganhe 500 moedas a cada 10 minutos de trabalho.' },
        '2': { title: '👷 Operário', desc: 'Ganhe 1k moedas a cada 30 minutos.' },
        '3': { title: '👩‍🔧 Mecânico', desc: 'Ganhe 2k moedas a cada 1 hora.' },
        '4': { title: '🕵️ Detetive', desc: 'Ganhe 3k moedas a cada 2 horas.' },
        '5': { title: '👩‍🌾 Fazendeiro', desc: 'Ganhe 4k moedas a cada 3 horas.' },
        '6': { title: '👩‍🚒 Bombeiro', desc: 'Ganhe 5k moedas a cada 4 horas.' },
        '7': { title: '⚖️ Juíz', desc: 'Ganhe 6k moedas a cada 5 horas.' }
    };

    const job = jobs[jobId];

    const embed = new EmbedBuilder()
        .setColor('#FA8072')
        .setTitle(job ? job.title : '❓ Emprego inválido')
        .setDescription(
            job
                ? `Você escolheu ser **${job.title.replace(/^[^\s]+\s/, '')}**!\n${job.desc}`
                : 'Selecione um emprego válido.'
        )
        .setFooter({
            text: `Escolhido por ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

    // ==== SALVAMENTO NO JSON ====
    const jobData = JSON.parse(fs.readFileSync(jobDataPath, 'utf8'));

    if (job) {
        jobData[interaction.user.id] = {
            jobId: Number(jobId),
            timestamp: Date.now()
        };

        fs.writeFileSync(jobDataPath, JSON.stringify(jobData, null, 4));
    }

    try {
        await interaction.update({ embeds: [embed], components: [] });
    } catch (err) {
        console.error('Erro ao atualizar embed de emprego:', err);
    }

    return true;
}

module.exports = { handlePrefeituraMenu };


    // ======== MENU DE AJUDA (Select Menu) ========
    
async function handleHelpMenu(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  if (!interaction.customId.startsWith('help')) return false;

  const [categoria, userId] = interaction.values[0].split('-');
  if (interaction.user.id !== userId) {
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content: '❌ Esse menu não é seu.', ephemeral: true }).catch(() => {});
  }
  return true;
}

  let embed;

  switch (categoria) {
    case 'home': {
      const serverIcon = interaction.guild.iconURL({ dynamic: true, size: 1024 }) || '';
      const authorAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

      embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setAuthor({ name: `Painel - ${interaction.guild.name}`, iconURL: serverIcon })
        .setThumbnail(serverIcon)
        .setFooter({ text: interaction.user.username, iconURL: authorAvatar })
        .setTimestamp()
        .setDescription(`
<:members:1382075056867381358> **Olá:** <@${interaction.user.id}>
\`${interaction.user.id}\`

<:relogio:1382896998700679230> **Expiração:**
<t:1893466800:D>

<:att:1330271050138783785> **Informações:**
[Servidor de Suporte](https://discord.gg/NmWy87RjFe)
        `);
      break;
    }

    case 'utilidade':
      embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setTitle('<:adicionar:1382068285054652539> Comandos de Utilidades')
        .setDescription(`
<:redseta:1329724263070171197> **Utilidades:**
\`\`\`
- ui
- lembrete
- botinfo
- serverinfo
- bug
- sug
- avatar
- bn
- emoji-info
- afk
- unafk
- ping
- gpt
- gemini
\`\`\``);
      break;

    case 'admin':
      embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('<:pureza_i:1382063941030776932> Comandos de Moderação')
        .setDescription(`
<:emoji99:1332805348947656885> **Administração:**
\`\`\`
- clear
- limpar
- ban
- unban
- addemoji
- lock
- unlock
- embed
- slowmode
- kick
- nuke
- excluir
- addcargo
- rmvcargo
- castigar
- rmvcastigo
- warn
- warns
- resetwarn
- config
- antilink
- clconfig
- setprefix
\`\`\``);
      break;

    case 'economia':
      embed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('<:cdw_whiteBR:1382063944042020885> Comandos de Economia')
        .setDescription(`
<:redseta:1329724263070171197> **Economia:**
\`\`\`
- atm
- ppt
- rank-coins
- top-coins
- coins
- daily
- work
- crime
- roubar
- semanal
- mensal
- slots
- sacar
- dep all
- recompensa
- apostar
- pay
- infovip
- prefeitura
- shop
\`\`\``);
      break;

    case 'diversão':
      embed = new EmbedBuilder()
        .setColor('#ff00c8')
        .setTitle('<:booster:1382068282147733586> Comandos de Diversão')
        .setDescription(`
<:redseta:1329724263070171197> **Para se divertir:**
\`\`\`
- amigo
- leite
- beijar
- avril
- tapa
- abraço
- matar
- cafune
- casal
- ship
- hackear
- rip
- emojiquiz
- calc
\`\`\``);
      break;

    case 'social':
      embed = new EmbedBuilder()
        .setColor('#47ff00')
        .setTitle('<:insta:1382065757319462953> Comandos Sociais')
        .setDescription(`
<:redseta:1329724263070171197> **Relacionamentos e Social:**
\`\`\`
- perfil
- marry
- divorce
- status
- bf
- unbf
- bfstatus
- tempo
- rep
- reps
- rankreps
\`\`\``);
      break;
      
      case 'jogos':
      embed = new EmbedBuilder()
        .setColor('#00ffaa')
        .setTitle('<:jogos:1418388139004923944> Comandos de jogos!')
        .setDescription(`
\`\`\`
- mines
- blackjack 
- mathquiz
- emojiquiz 
- jdv (jogo da velha)
- ppt (pedra, papel & tesoura)
\`\`\`
`);
      break;
      
      case 'dev':
      embed = new EmbedBuilder()
      .setColor('#00ffaa')
      .setTitle('<:lock:1382067121218912317> **Painel Developer**')
      .setDescription(`<:white_bloww:1382060155822149722> **Se acha o engraçado né, este menu não é pra você, além de que so pode ser acessado por __"devmenu"__ até mais..**`);
      break;
                
    default:
      embed = new EmbedBuilder()
        .setColor('#999999')
        .setTitle('❓ Categoria desconhecida')
        .setDescription('Essa categoria não está disponível.');
  }

  embed.setFooter({
    text: `Requisitado por ${interaction.user.username}`,
    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
  });

  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.update({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Erro ao atualizar o menu de ajuda:', err);
  }

  return true;
}

module.exports = { handleHelpMenu };    


    // ======== CRIAÇÃO DE EMBED (Botões) ========
    async function handleEmbedButtons(interaction) {
      if (!interaction.isButton()) return false;

      const userId = interaction.user.id;

      if (interaction.customId === 'embed_cancelar') {
        await interaction.reply({ content: '❌ Criação de embed cancelada.', ephemeral: true });
        return true;
      }

      if (interaction.customId === 'embed_definir_canal') {
        await interaction.reply({ content: '📨 Envie no chat o canal de destino (ex: #geral).', ephemeral: true });

        const filter = m => m.author.id === userId;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async msg => {
          const canal = msg.mentions.channels.first() || msg.guild.channels.cache.get(msg.content.replace(/<#|>/g, ""));

          if (!canal || canal.type !== ChannelType.GuildText) {
            return msg.reply("❌ Canal inválido. Use uma menção ou ID válida.");
          }

          canalDefinidoMap.set(userId, canal.id);
          await msg.reply(`✅ Canal definido: ${canal}. Agora você pode montar seu embed.`);

          // Painel de edição do embed
          const embedPreview = new EmbedBuilder()
            .setColor('#2f3136')
            .setFooter({ text: `Todos os direitos reservados para ${msg.guild.name}` });

          const botoesEditor = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("embed_set_titulo").setLabel("✏️ Título").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("embed_set_descricao").setLabel("📝 Descrição").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("embed_set_thumbnail").setLabel("🖼️ Thumbnail").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("embed_set_imagem").setLabel("📷 Imagem").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("embed_set_cor").setLabel("🎨 Cor").setStyle(ButtonStyle.Secondary)
          );

          await interaction.followUp({
            content: '🛠️ Visualização atual do embed. Use os botões abaixo para editar:',
            embeds: [embedPreview],
            components: [botoesEditor],
            ephemeral: true
          });
        });

        collector.on('end', collected => {
          if (collected.size === 0) {
            interaction.followUp({ content: "⏰ Tempo esgotado. Nenhum canal foi definido.", ephemeral: true });
          }
        });

        return true;
      }

      return false;
    }


// ======== APOSTAS (Botão) ========

async function handleApostaButtons(interaction) {
  if (!interaction.isButton()) return false;

  const customId = interaction.customId;

  // Botão de recusar aposta
  if (customId.startsWith('recusar-')) {
    const [_, targetId, amountStr, challengerId] = customId.split('-');

    // Apenas o desafiado pode recusar
    if (interaction.user.id !== targetId) {
      await interaction.reply({ content: "Apenas o desafiado pode recusar esta aposta.", ephemeral: true });
      return true;
    }

    // Busca membros para embed (pode falhar, mas sem grandes problemas)
    const challenger = await interaction.guild.members.fetch(challengerId).catch(() => null);
    const target = await interaction.guild.members.fetch(targetId).catch(() => null);

    const embedRecusado = new EmbedBuilder()
      .setTitle("🚫 Aposta Recusada")
      .setDescription(`❌ <@${targetId}> recusou o pedido de aposta.`)
      .setColor(0xff0000);

    await interaction.deferUpdate().catch(() => {});
    await interaction.message.edit({ embeds: [embedRecusado], components: [] });

    return true;
  }

  // Botão de aceitar aposta
  if (!customId.startsWith('apostar-')) return false;

  // Cancela timeout da aposta, se houver
  if (interaction.message.apostaTimeout) {
    clearTimeout(interaction.message.apostaTimeout);
    interaction.message.apostaTimeout = null;
  }

  const [_, targetId, amountStr, challengerId] = customId.split('-');
  const amount = parseInt(amountStr);

  const coins = loadCoins();

  // Busca os membros na guilda (obrigatório existir para continuar)
  const challenger = await interaction.guild.members.fetch(challengerId).catch(() => null);
  const target = await interaction.guild.members.fetch(targetId).catch(() => null);

  if (!target || !challenger) {
    await interaction.reply({ content: "Usuários não encontrados.", ephemeral: true });
    return true;
  }

  // Apenas o desafiado pode aceitar a aposta
  if (interaction.user.id !== targetId) {
    await interaction.reply({ content: "Apenas o usuário desafiado pode aceitar essa aposta.", ephemeral: true });
    return true;
  }

  // Inicializa conta caso não exista
  if (!coins[challengerId]) coins[challengerId] = { carteira: 0, banco: 0 };
  if (!coins[targetId]) coins[targetId] = { carteira: 0, banco: 0 };

  // Verifica saldo no banco para ambos
  if (coins[challengerId].banco < amount || coins[targetId].banco < amount) {
    await interaction.reply({ content: "Um dos jogadores não tem saldo suficiente no banco.", ephemeral: true });
    return true;
  }

  // Sorteia vencedor
  const winner = Math.random() < 0.5 ? challenger : target;
  const loser = winner.id === challenger.id ? target : challenger;

  // Atualiza moedas no banco
  coins[winner.id].banco += amount;
  coins[loser.id].banco -= amount;
  saveCoins(coins);

  const resultadoEmbed = new EmbedBuilder()
  .setAuthor({
    name: challenger.user.username,
    iconURL: challenger.user.displayAvatarURL({ dynamic: true })
  })
  .setDescription(`Aposta de **${formatAmount(amount)}** coins!\nEntre ${challenger} e ${target}\n\n<@${winner.id}> foi o ganhador!\nO dinheiro já está no banco!`)
  .setColor(0x11e1db)
  .setThumbnail('https://cdn.discordapp.com/attachments/1362642722275594330/1386600656860872755/png-transparent-slot-machine-with-handle-casino-addiction-gambling-big-win-concept-thumbnail.png');

  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [resultadoEmbed], components: [] });
  } catch (err) {
    console.error("Erro ao processar aposta:", err);
  }

  return true;
}

module.exports = { handleApostaButtons };

// ======== PAGAMENTO (Botões) ========
async function handlePayButtons(interaction) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith('pay_accept_') && !interaction.customId.startsWith('pay_decline_')) return false;

  // customId exemplo: pay_accept_authorId_targetId_amount
  const parts = interaction.customId.split('_');
  const action = parts[1]; // 'accept' ou 'decline'
  const authorId = parts[2];
  const targetId = parts[3];
  const amount = parseInt(parts[4]);

  if (interaction.user.id !== authorId) {
    await interaction.reply({ content: '❌ Apenas quem iniciou a transferência pode confirmar ou cancelar.', ephemeral: true });
    return true;
  }

  const coins = loadCoins();

  const guild = interaction.guild;
  const remetente = await guild.members.fetch(authorId).catch(() => null);
  const destinatario = await guild.members.fetch(targetId).catch(() => null);

  if (!remetente || !destinatario) {
    await interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });
    return true;
  }

  if (action === 'accept') {
    if (!coins[authorId] || (coins[authorId].banco || 0) < amount) {
      await interaction.reply({ content: '❌ Você não tem coins suficientes para realizar a transferência.', ephemeral: true });
      return true;
    }

    coins[authorId].banco -= amount;
    if (!coins[targetId]) coins[targetId] = { banco: 0 };
    coins[targetId].banco += amount;
    saveCoins(coins);

    const confirmEmbed = new EmbedBuilder()
      .setColor('#8C52FF')
      .setTitle('✅ Pagamento efetuado!')
      .setDescription(`💸 ${remetente} transferiu **${formatAmount(amount)}** coins para ${destinatario}.`)
      .setTimestamp();

    await interaction.update({ embeds: [confirmEmbed], components: [] });
  } else if (action === 'decline') {
    await interaction.update({
      content: '❌ Transferência cancelada.',
      components: [],
    });
  }

  return true;
}

    // ======== ICON E BANNER DO SERVIDOR (Select Menu) ========
    async function handleServerIconBanner(interaction) {
      if (!interaction.isStringSelectMenu()) return false;
      if (interaction.customId !== 'iconserver') return false;

      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: '❌ Este comando só funciona em servidores.', ephemeral: true });
        return true;
      }

      await interaction.deferUpdate();

      if (interaction.values[0] === 'icsv') {
        const iconURL = guild.iconURL({ size: 4096, dynamic: true });
        if (!iconURL) {
          await interaction.followUp({
            embeds: [{
              title: 'Olá, calma aí...',
              description: 'Desculpe, mas o servidor não tem um ícone definido, peço desculpas!',
              color: 0xff0000,
              footer: { text: 'Verificador!' },
              image: { url: 'https://cdn.discordapp.com/emojis/1332805357885722636.png?v=1&size=48&quality=lossless' },
            }],
            ephemeral: true,
          });
          return true;
        }

        const embed = new EmbedBuilder()
          .setTitle('Ícone do Servidor')
          .setDescription('Aqui está!')
          .setColor(0xffb075)
          .setImage(iconURL)
          .setTimestamp();

        await interaction.followUp({ embeds: [embed], ephemeral: true });
        return true;
      }

      if (interaction.values[0] === 'bnsv') {
        const bannerURL = guild.bannerURL({ size: 1024, dynamic: true });
        if (!bannerURL) {
          await interaction.followUp({
            embeds: [{
              title: 'Olá, calma aí...',
              description: 'Desculpe, mas o servidor não tem um banner definido, peço desculpas!',
              color: 0xff0000,
              footer: { text: 'Verificador!' },
              image: { url: 'https://cdn.discordapp.com/emojis/1332805357885722636.png?v=1&size=48&quality=lossless' },
            }],
            ephemeral: true,
          });
          return true;
        }

        const embed = new EmbedBuilder()
          .setTitle('Banner do Servidor')
          .setDescription('Aqui está!')
          .setColor(0x47ff00)
          .setImage(bannerURL)
          .setTimestamp();

        await interaction.followUp({ embeds: [embed], ephemeral: true });
        return true;
      }

      return false;
    }

// ======== CRIME (Botão) ========

async function handleCrimeButton(interaction) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith("crime-confirm-")) return false;

  const userId = interaction.customId.split("-")[2];
  if (interaction.user.id !== userId) {
    await interaction.reply({ content: "❌ Este botão não é seu.", ephemeral: true });
    return true;
  }

  const cooldownTime = cooldowns.temp_crime;
  const coins = loadCoins();
  if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };

  if (!isCooldownOver(userId, "temp_crime", cooldownTime)) {
    const remaining = getCooldownRemaining(userId, "temp_crime", cooldownTime);
    const availableAt = Math.floor(Date.now() / 1000) + remaining;

    const embedCooldown = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("🚨 Você está preso!")
      .setDescription(`Você só poderá cometer um crime novamente <t:${availableAt}:R>!`)
      .setFooter({ text: interaction.user.username })
      .setTimestamp();

    await interaction.reply({ embeds: [embedCooldown], ephemeral: true });
    return true;
  }

  // Resolve o resultado do crime
  const sucesso = Math.random() < 0.5;
  const valor = Math.floor(Math.random() * 4000) + 1000;
  let resultado;

  if (sucesso) {
    coins[userId].carteira += valor;
    resultado = `🟢 Você cometeu um crime e ganhou **${formatAmount(valor)}** coins!`;
  } else {
    coins[userId].carteira = Math.max(0, coins[userId].carteira - valor);
    resultado = `🔴 Você falhou no crime e perdeu **${formatAmount(valor)}** coins!`;
  }

  saveCoins(coins);
  setCooldown(userId, "temp_crime");

  await interaction.update({
    content: resultado,
    embeds: [],
    components: [],
  });

  return true;
}

module.exports = { handleCrimeButton };

// ======== EMOJI QUIZ (Botão) ========

async function handleEmojiQuizButton(interaction, client) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith("emoji-")) return false;

  const [, chosenEmoji, userId] = interaction.customId.split("-");

  if (interaction.user.id !== userId) {
    await interaction.reply({ content: "❌ Este botão não é seu.", ephemeral: true });
    return true;
  }

  const correctEmoji = client.emojiQuizData?.get(userId);
  if (!correctEmoji) {
    await interaction.reply({ content: "❌ Nenhum quiz ativo para você.", ephemeral: true });
    return true;
  }

  // Atualiza a mensagem removendo botões e embed, mostrando só o resultado no conteúdo
  await interaction.update({
    content:
      chosenEmoji === correctEmoji
        ? "**✅ Bom trabalho! Você acertou e ganhou 100 moedas!**"
        : "**❌ Que pena! Você errou o emoji.**",
    components: [],  // remove todos os botões
    embeds: []       // remove a embed
  });

  client.emojiQuizData.delete(userId);
  return true;
}

module.exports = { handleEmojiQuizButton };

// botão de ROUBAR

async function handleRoubarButton(interaction) {
    if (!interaction.isButton()) return false;
    if (!interaction.customId.startsWith('roubar-confirm-')) return false;

    const parts = interaction.customId.split('-');
    if (parts.length !== 4) return false;

    const targetId = parts[2];
    const userId = parts[3];

    if (interaction.user.id !== userId) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Este botão não é seu.",
                ephemeral: true,
            }).catch(() => {});
        }
        return true;
    }

    // Carregar dados
    const coins = loadCoins();
    const armasData = JSON.parse(fs.readFileSync(armasDataPath, 'utf8'));

    if (!coins[targetId] || coins[targetId].carteira < 100) {
        await interaction.update({
            content: "❌ O alvo não tem dinheiro suficiente para ser roubado.",
            embeds: [],
            components: [],
        });
        return true;
    }

    if (!armasData[userId] || armasData[userId].length === 0) {
        await interaction.update({
            content: "❌ Você não possui uma arma para roubar.",
            embeds: [],
            components: [],
        });
        return true;
    }

    // Simular roubo (100~500 coins)
    const valorRoubo = Math.floor(Math.random() * 400) + 100;

    if (coins[targetId].carteira < valorRoubo) {
        await interaction.update({
            content: `❌ O alvo não tem moedas suficientes para roubo, possui apenas ${coins[targetId].carteira}.`,
            embeds: [],
            components: [],
        });
        return true;
    }

    // Realizar roubo
    coins[targetId].carteira -= valorRoubo;
    if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };
    coins[userId].carteira += valorRoubo;

    saveCoins(coins);

    // Setar cooldown
    setCooldown(userId, "temp_roubar", cooldowns.temp_roubar);

    const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🏴‍☠️ Roubo realizado com sucesso!")
        .setDescription(
            `${interaction.user} roubou **${valorRoubo.toLocaleString()} coins** da carteira de <@${targetId}>!`
        )
        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    await interaction.update({
        embeds: [embed],
        components: [],
    });

    return true;
}

module.exports = { handleRoubarButton };

//BOTÃO CASAMENTO

const marryDataPath = path.join(__dirname, '../database/marry.json');

function loadJson(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

async function handleMarryInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const customId = interaction.customId;

  // **Filtro para só processar botões casar- ou recusar-**
  if (!customId.startsWith('casar-') && !customId.startsWith('recusar-')) {
    return false; // não é botão do marry, deixa passar
  }

  const parts = customId.split('-');
  const action = parts[0]; // casar ou recusar
  const targetId = parts[1]; // ID do usuário que deve clicar para aceitar/recusar
  const proposerId = parts[2]; // ID do usuário que enviou a proposta (autor)

  if (interaction.user.id !== targetId) {
    await interaction.reply({ content: '❌ Esse botão não é para você.', ephemeral: true });
    return true;
  }

  const marryData = loadJson(marryDataPath);

  if (action === 'casar') {
    marryData.casamentos = marryData.casamentos || {};
    marryData.casamentos[targetId] = proposerId;
    marryData.casamentos[proposerId] = targetId;

    marryData.tempos = marryData.tempos || {};
    marryData.tempos[targetId] = Date.now();
    marryData.tempos[proposerId] = Date.now();

    if (marryData.propostas) {
      delete marryData.propostas[targetId];
    }

    saveJson(marryDataPath, marryData);

    const embed = new EmbedBuilder()
      .setDescription(`💍 <@${targetId}>, você **aceitou** o pedido de casamento de <@${proposerId}>! Espero que sejam felizes no relacionamento.`)
      .setColor('#ffffff');

    await interaction.update({ embeds: [embed], components: [] });
    return true;

  } else if (action === 'recusar') {
    if (marryData.propostas) {
      delete marryData.propostas[targetId];
      saveJson(marryDataPath, marryData);
    }

    const embed = new EmbedBuilder()
      .setDescription(`❌ <@${targetId}>, você **recusou** o pedido de casamento de <@${proposerId}>.`)
      .setColor('#ff0000');

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  return false;
}

module.exports = { handleMarryInteraction };

//BOTÃO MELHOR AMIGO

const bfPath = path.join(__dirname, '../database/bf.json');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

async function handleBfInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const customId = interaction.customId;

  // **Filtro para só processar botões amizade- ou recusaramizade-**
  if (!customId.startsWith('amizade-') && !customId.startsWith('recusaramizade-')) {
    return false; // não é botão do bf, deixa passar
  }

  const [_, targetId, proposerId] = customId.split('-');

  if (interaction.user.id !== targetId) {
    await interaction.reply({ content: '❌ Esse botão não é pra você, vacilão.', ephemeral: true });
    return true;
  }

  const bfData = loadJson(bfPath);
  bfData.amizades = bfData.amizades || {};
  bfData.pedidos = bfData.pedidos || {};
  bfData.tempos = bfData.tempos || {};

  if (customId.startsWith('amizade-')) {
    bfData.amizades[targetId] = proposerId;
    bfData.amizades[proposerId] = targetId;

    // Salva o tempo da amizade para ambos
    const now = Date.now();
    bfData.tempos[targetId] = now;
    bfData.tempos[proposerId] = now;

    delete bfData.pedidos[targetId];
    saveJson(bfPath, bfData);

    const embed = new EmbedBuilder()
      .setDescription(`🫂 <@${targetId}> agora é **melhor amigo(a)** de <@${proposerId}>! Que fofura. 🤝`)
      .setColor('#ffffff');

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  if (customId.startsWith('recusaramizade-')) {
    delete bfData.pedidos[targetId];
    saveJson(bfPath, bfData);

    const embed = new EmbedBuilder()
      .setDescription(`❌ <@${targetId}> **recusou** o pedido de melhor amizade de <@${proposerId}>.`)
      .setColor('#ff0000');

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  return false;
}

module.exports = { handleBfInteraction };

// BOTÕES GERENCIAMENTO DE SERVIDORES

async function handleManageInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const customId = interaction.customId;

  // Botão: sair do servidor
  if (customId.startsWith('leave_')) {
    const guildId = customId.split('_')[1];
    const userId = interaction.user.id;

    if (!config.OWNERS.includes(userId)) {
      await interaction.reply({
        content: '❌ Apenas os donos do bot podem usar este botão.',
        ephemeral: true
      });
      return true;
    }

    const guild = interaction.client.guilds.cache.get(guildId);
    if (!guild) {
      await interaction.deferUpdate();
      await interaction.editReply({
        content: '⚠️ O bot já não está mais nesse servidor.',
        embeds: [],
        components: []
      });
      return true;
    }

    try {
      await interaction.deferUpdate(); // responde imediatamente para evitar timeout

      // Mostra mensagem antes de sair
      await interaction.editReply({
        content: `✅ Saindo do servidor **${guild.name}**...`,
        embeds: [],
        components: []
      });

      setTimeout(async () => {
        try {
          await guild.leave();
        } catch (err) {
          console.error(`Erro ao sair do servidor ${guildId}:`, err);
        }
      }, 2000); // espera 2s antes de sair
    } catch (err) {
      console.error(`Erro geral ao processar saída do servidor ${guildId}:`, err);
      try {
        await interaction.followUp({ content: '❌ Erro ao sair do servidor.', ephemeral: true });
      } catch (_) {}
    }

    return true;
  }

  // Botão: fechar embed
  if (customId.startsWith('fechar_')) {
    const userId = customId.split('_')[1];

    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: '❌ Apenas quem executou o comando pode fechar esta embed.',
        ephemeral: true
      });
      return true;
    }

    try {
      await interaction.deferUpdate(); // evita timeout
      await interaction.editReply({
        content: '✅ Operação cancelada.',
        embeds: [],
        components: []
      });
    } catch (err) {
      console.error('Erro ao fechar a embed:', err);
      try {
        await interaction.followUp({ content: '❌ Erro ao tentar fechar.', ephemeral: true });
      } catch (_) {}
    }

    return true;
  }

  return false; // não era botão de gerenciamento
}

module.exports = { handleManageInteraction };


    // ======== EXECUÇÃO CENTRAL DO EVENTO ========
    if (await handleShopMenu(interaction)) return;
    if (await handlePrefeituraMenu(interaction)) return;
    if (await handleHelpMenu(interaction)) return;
    if (await handleEmbedButtons(interaction)) return;
    if (await handleApostaButtons(interaction)) return;
    if (await handlePayButtons(interaction)) return;
    if (await handleServerIconBanner(interaction)) return;
    if (await handleCrimeButton(interaction)) return;
    if (await handleEmojiQuizButton(interaction, client)) return;
    if (await handleRoubarButton(interaction)) return;
    if (await handleMarryInteraction(interaction)) return;
    if (await handleBfInteraction(interaction)) return;
    if (await handleTicketInteraction(interaction)) return;
    if (await handleTicketButtonInteraction(interaction)) return;
    if (await handleManageInteraction(interaction)) return;

      //CARREGA COMANDOS POR SLASH 
 
// CARREGA COMANDOS POR SLASH
if (!interaction.isChatInputCommand()) return;

const userId = interaction.user.id;
const now = Date.now();
const cooldown = 3000; // 3 segundos

if (slashCooldown.has(userId)) {
  const lastTime = slashCooldown.get(userId);
  const diff = now - lastTime;

  if (diff < cooldown) {
    return interaction.reply({
      content: `<@${userId}>, você deve aguardar alguns **segundos** para usar outro comando em barra.`,
      ephemeral: true
    });
  }
}

slashCooldown.set(userId, now);
setTimeout(() => slashCooldown.delete(userId), cooldown);

const command = client.slashCommands.get(interaction.commandName);
if (!command) {
  console.warn(`⚠️ Comando /${interaction.commandName} não encontrado.`);
  return;
}

try {
  await command.execute(interaction);
} catch (error) {
  console.error(`❌ Erro no comando /${interaction.commandName}:`, error);

  const friendlyMessage = '❌ Ocorreu um erro ao executar esse comando. Tente novamente em instantes.';

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: friendlyMessage });
  } else {
    await interaction.reply({ content: friendlyMessage, ephemeral: true });
  }
}
    
    // Se não for nenhuma interação tratada, pode ignorar
  }
};