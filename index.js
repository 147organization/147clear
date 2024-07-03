const fs = require('fs');
const readlineSync = require('readline-sync');
const Discord = require('discord.js-selfbot-v13');
const fetch = require('node-fetch');
const client = new Discord.Client({ checkUpdate: false });
const config = (() => {
  const configPath = './config.json';
  if (!fs.existsSync(configPath)) {
    criarConfig();
  }
  return require(configPath);
})();;
const RPC = require('discord-rpc');
const path = require('path');
const AdmZip = require('adm-zip');
const child_process = require("child_process");
const { timeStamp } = require('console');

const clientId = '1257500388408692800';
const theme = {
  "state": "v1.10.2",
  "details": "No menu principal",
  "largeImageKey": "fotogrande",
  "largeImageText": "147 😎",
  "smallImageKey": "147",
  "smallImageText": "idle"
}

let cor = hex(config.cor_painel || '#A020F0');
const erro = hex('#ff0000');
const reset = hex('#ffffff');
const aviso = "\u001b[43";

const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const VERSAO_ATUAL = "1.0.2"
const rpc = new RPC.Client({ transport: 'ipc' });

try {
  RPC.register(clientId);
  rpc.on('ready', () => {
    updatePresence(theme);
  });
  
  rpc.login({ clientId }).catch(console.error);
} catch (error) {
  console.error('Erro ao inicializar o RPC:', error);
}

async function updatePresence(presence, tempo = false) {
  if (!rpc) {
    console.error('RPC não inicializado');
    return;
  }
  try {
    const activity = {
      pid: process.pid,
      state: presence.state || theme.state,
      details: presence.details || theme.details,
      largeImageKey: presence.largeImageKey || theme.largeImageKey,
      largeImageText: presence.largeImageText || theme.largeImageText,
      smallImageKey: presence.smallImageKey || theme.smallImageKey,
      smallImageText: presence.smallImageText || theme.smallImageText,
    };
    await rpc.setActivity(activity);
  } catch (error) {
    console.error('Erro ao atualizar a presença:', error);
  }
}

function hex(hex) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Código hex inválido. Deve ser no formato #RRGGBB.');
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b) || r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('Valores RGB fora do intervalo válido (0-255).');
  }

  return `\x1b[38;2;${r};${g};${b}m`;
}

async function fetchMsgs(canal) {
  const canall = client.channels.cache.get(canal);

  if (!canall) {
    return [];
  }

  let ultimoid;
  let messages = [];

  while (true) {
    const fetched = await canall.messages.fetch({
      limit: 100,
      ...(ultimoid && { before: ultimoid }),
    });

    if (fetched.size === 0) {
      return messages.filter(msg => msg.author.id === client.user.id && !msg.system);
    }

    messages = messages.concat(Array.from(fetched.values()));
    ultimoid = fetched.lastKey();
  }
}

async function titulo(username, userId) {
  console.log(`
        ${cor} ██╗██╗  ██╗███████╗ ${reset} ██████╗██╗     ███████╗ █████╗ ██████╗ 
        ${cor}███║██║  ██║╚════██║ ${reset}██╔════╝██║     ██╔════╝██╔══██╗██╔══██╗
        ${cor}╚██║███████║    ██╔╝ ${reset}██║     ██║     █████╗  ███████║██████╔╝
        ${cor} ██║╚════██║   ██╔╝  ${reset}██║     ██║     ██╔══╝  ██╔══██║██╔══██╗
        ${cor} ██║     ██║   ██║   ${reset}╚██████╗███████╗███████╗██║  ██║██║  ██║
        ${cor} ╚═╝     ╚═╝   ╚═╝   ${reset}╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝\n   
        ${cor}Usuário:${reset} ${username}
        ${cor}ID:${reset} ${userId}\n`);
}

function criarConfig() {
  const configData = {
    "token": "",
    "cor_painel": "#A020F0",
    "delay": "1",
    "kosame": {
      "ativado": false,
      "canal": "",
      "tokens": []
    }
  };

  if (!fs.existsSync('config.json')) {
    fs.writeFileSync('config.json', JSON.stringify(configData, null, 4));
  } else {
    const currentConfig = JSON.parse(fs.readFileSync('config.json'));
    if (!currentConfig.token || !currentConfig.delay) {
      fs.writeFileSync('config.json', JSON.stringify(configData, null, 4));
    }
  }
}

function escreverToken(token) {
  criarConfig();
  const currentConfig = JSON.parse(fs.readFileSync('config.json'));
  currentConfig.token = token;
  fs.writeFileSync('config.json', JSON.stringify(currentConfig, null, 4));
}

async function pedirToken() {
  while (true) {
    const token = readlineSync.question('> ');
    if (await validarToken(token)) {
      escreverToken(token);
      break;
    } else {
      console.clear();
      console.log("Token inválida, insira outra.");
    }
  }
}

async function validarToken(token) {
  const response = await fetch('https://discord.com/api/v9/users/@me', {
    headers: {
      'Authorization': token.replace(/Bot|Bearer/ig, '').trim()
    }
  });
  const u = await response.json();
  return !!u.username;
}

async function verificarToken() {
  criarConfig();
  const config = JSON.parse(fs.readFileSync('config.json'));
  if (!config.token || !(await validarToken(config.token))) {
    console.clear();
    console.log("Você não inseriu uma token válida, insira.");
    await pedirToken();
  }
}

async function clearUnica() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Limpar com DM única';
  const config = require('./config.json');
  console.log("Insira o ID do usuário.");
  let id = readlineSync.question('> ');

  const canal = client.channels.cache.get(id);
  let contador = 0;

  if (!canal) {
    const user = await client.users.fetch(id).catch(() => { });
    if (!user) {
      console.clear();
      console.log(`${erro}[X]${reset} Este ID é inválido.`);
      await sleep(3.5);
      await clearUnica();
    }

    await user?.createDM().then(c => id = c.id).catch(async () => {
      console.clear();
      console.log(`${erro}[X]${reset} Não foi possível abrir DM com o usuário.`);
      await sleep(3.5);
      await clearUnica();
    });
  }

  const msgs = await fetchMsgs(id);

  if (!msgs.length) {
    console.clear();
    console.log(`${erro}[X]${reset} Você não tem mensagens ai.`);
    await sleep(3.5);
    menu(client);
  }

  for (const [index, msg] of msgs.entries()) {
    await sleep(parseFloat(config.delay) || 1);
    await msg.delete().then(async () => {
      contador++;
      process.title = `147Clear | Limpar com DM única | ${contador}/${msgs.length} mensagens apagadas`;
      const porcentagem = ((contador) / msgs.length) * 100;
      const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';

      await updatePresence({
        state: `${Math.round(porcentagem)}%`,
        details: `Apagando mensagens: ${contador}/${msgs.length}`
      });

      console.clear();
      await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
      console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${msgs.length} mensagens apagadas`);
    }).catch(() => { });
  }

  setTimeout(async () => {
    menu(client);
  }, 1000);
}

async function clearAbertas() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Limpar com DMs abertas';
  const config = require('./config.json');
  const dms = await client.channels.cache.filter(c => c.type == "DM").map(a => a);
  let contador = 0;

  if (!dms.length) {
    console.clear();
    console.log(`${erro}[X]${reset} Você não tem DMs abertas.`);
    await sleep(3.5);
    menu(client);
  }

  console.log("Fechar cada DM após apagar as mensagens? [s/sim]");
  const pergunta = readlineSync.question('> ');
  const fechar = pergunta.toLowerCase() === "s" || pergunta.toLowerCase() === "sim";

  for (const dm of dms) {
    contador++;
    process.title = `147Clear | Limpar com DMs abertas | ${contador}/${dms.length} DMs limpas`;
    let contador_msgs = 0;
    const msgs = await fetchMsgs(dm.id);

    if (!msgs.length) continue;
    for (const [index, msg] of msgs.entries()) {
      await sleep(parseFloat(config.delay) || 1);
      await msg.delete().then(async () => {
        contador_msgs++;

        const porcentagem = ((contador_msgs) / msgs.length) * 100;
        const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';
        await updatePresence({
          state: `Na dm com ${dm.recipient.globalName || dm.recipient.username}`,
          details: `Apagando ${contador_msgs}/${msgs.length} [${Math.round(porcentagem)}%]`,
          largeImageText: `${contador}/${dms.length} DMs limpas`
        });

        console.clear();
        await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
        console.log(`        ${cor}Apagando DM com:${reset} ${dm.recipient.globalName || dm.recipient.username}\n`)
        console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador_msgs}/${msgs.length} mensagens apagadas | ${contador}/${dms.length} DMs limpas`);
      }).catch(() => { })
    }
    if (fechar) await dm.delete().catch(() => { });
  }
  setTimeout(async () => {
    menu(client);
  }, 1000);
}

async function removerAmigos() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Remover amigos';
  const amigos = client.relationships.cache.filter(value => value === 1).map((value, key) => key);
  let contador = 0;

  if (!amigos.length) {
    console.clear();
    console.log(`${erro}[X]${reset} Você não tem amigos :(`);
    await sleep(3.5);
    menu(client);
  }

  for (const amigo of amigos) {
    await sleep(parseFloat(config.delay) || 1);
    const user = await client.users.fetch(amigo).catch(() => { });
    await client.relationships.deleteRelationship(user).then(async () => {
      contador++;
      process.title = `147Clear | Remover amigos | ${contador}/${amigos.length} amigos removidos`;
      const porcentagem = ((contador) / amigos.length) * 100;
      const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';

      console.clear();
      await updatePresence({
        details: `Removendo amigos ${contador}/${amigos.length} [${Math.round(porcentagem)}%]`,
      });
      await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
      console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${amigos.length} amigos removidos`);
    }).catch(() => { });
  }

  menu(client);
}

async function removerServidores() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Remover servidores';
  const servers = client.guilds.cache.map(a => a);
  let contador = 0;

  if (!servers.length) {
    console.clear();
    console.log(`${erro}[X]${reset} Você não está em nenhum servidor.`);
    await sleep(3.5);
    menu(client);
  }

  for (const server of servers) {
    await sleep(parseFloat(config.delay) || 1);
    await server.leave().then(async () => {
      contador++;
      process.title = `147Clear | Remover servidores | ${contador}/${servers.length} servidores removidos`;
      const porcentagem = ((contador) / servers.length) * 100;
      const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';
      await updatePresence({
        details: `Removendo servidores ${contador}/${servers.length} [${Math.round(porcentagem)}%]`,
      });
      console.clear();
      await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
      console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${servers.length} servidores removidos`);
    }).catch(() => { });
  }

  menu(client);
}

async function fecharDMs() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Fechar DMs';
  const dms = await client.channels.cache.filter(c => c.type == "DM").map(a => a);
  let contador = 0;

  if (!dms.length) {
    console.clear();
    console.log(`${erro}[X]${reset} Você não tem DMs abertas.`);
    await sleep(3.5);
    menu(client);
  }

  for (const dm of dms) {
    await sleep(1.3);
    await dm.delete().then(async () => {
      contador++;
      process.title = `147Clear | Fechar DMs | ${contador}/${dms.length} DMs fechadas`;
      const porcentagem = ((contador) / dms.length) * 100;
      const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';
      await updatePresence({
        details: `Fechando DMs ${contador}/${dms.length} [${Math.round(porcentagem)}%]`,
      });
      console.clear();
      await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
      console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${dms.length} DMs fechadas`);
    }).catch(() => { });
  }

  menu(client);
}

async function configurar() {
  console.clear();
  criarConfig();

  process.title = '147Clear | Configuração';
  await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');

  console.log(`
        ${cor}[ 1 ]${reset} Mudar delay
        ${cor}[ 2 ]${reset} Mudar cor do painel
        
        ${cor}[ 3 ]${reset} Voltar
  `);

  const opcoes = {
    "1": async () => {
      console.clear();
      console.log("Insira o delay em segundos. (ex: 1.5 para 1 segundo e meio)");
      const delayInput = readlineSync.question('> ');

      const delayInSeconds = parseFloat(delayInput);
      if (isNaN(delayInSeconds) || delayInSeconds <= 0) {
        console.clear();
        console.log(`${erro}[X]${reset} Isso não é um delay válido.`);
        await sleep(3.5);
      } else {
        const currentConfig = JSON.parse(fs.readFileSync('config.json'));
        currentConfig.delay = delayInSeconds.toString();
        fs.writeFileSync('config.json', JSON.stringify(currentConfig, null, 4));
        await sleep(1.5);
      }
    },
    "2": async () => {
      console.clear();
      console.log("Insira a cor em formato HEX (ex: #ffffff)");
      const cor = readlineSync.question('> ');

      try {
        const cor_convertida = hex(cor);
        const currentConfig = JSON.parse(fs.readFileSync('config.json'));
        currentConfig.cor_painel = cor;
        fs.writeFileSync('config.json', JSON.stringify(currentConfig, null, 4));
        console.clear();
        console.log("Cor trocada com sucesso, inicie o programa novamente.")
        await sleep(7);
        process.exit(0);
      } catch {
        console.clear();
        console.log(`${erro}[X]${reset} Isso não é uma cor HEX válida.`);
        await sleep(3.5);
      }
    },
    "3": async () => {
      menu(client);
    },
    "default": async () => {
      console.clear();
      console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
      await sleep(1.5);
    }
  };

  const opcao = readlineSync.question('> ');
  await (opcoes[opcao] || opcoes["default"])();
  await configurar();
}

async function kosameFarm() {
  console.clear();
  criarConfig();

  console.log("Implementar depois.");
  await sleep(3.5);
  menu(client);
}

async function processarCanais(zipEntries, whitelist) {
  criarConfig();
  const config = require('./config.json');

  let totalDMs = await contarDMs(zipEntries);
  let contador = 0;

  for (const entry of zipEntries) {
    if (!canalValido(entry)) continue;

    const channelData = dadosCanal(entry);
    if (!ehDMGrupo(channelData)) continue;

    for (const recipientId of pegarRecipients(channelData.recipients)) {
      if (whitelist.includes(recipientId)) continue;

      const user = await fetchUser(recipientId);
      await sleep(parseFloat(config.delay) || 1);

      const dmChannel = await user?.createDM().catch(() => {});
      if (dmChannel) {
        await cleanMessagesFromDM(dmChannel, totalDMs);
        contador++;
        process.title = `147Clear | Apagar package | ${contador}/${totalDMs} DMs limpas`
        const porcentagem = ((contador) / totalDMs) * 100;
        const progresso = '[' + '█'.repeat(Math.floor(porcentagem / 2)) + '░'.repeat(50 - Math.floor(porcentagem / 2)) + ']';
        console.clear();
        await updatePresence({
          details: `Usando CL all`,
          state: `Apagando ${contador}/${totalDMs} DMs [${Math.round(porcentagem)}%]`,
          largeImageText: `Na dm com ${dmChannel.recipient.globalName || dmChannel.recipient.username}`
        });
        await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
        console.log(`${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${totalDMs} DMs limpas`);
      }
    }
  }
}

function canalValido(entry) {
  return /^(?:messages\/c)[0-9]+(?:\/channel\.json)$/.test(entry.entryName);
}

function dadosCanal(entry) {
  try {
    return JSON.parse(entry.getData().toString());
  } catch {
    return null;
  }
}

function ehDMGrupo(data) {
  return data?.recipients && Array.isArray(data.recipients) && data.type === 1 && data.recipients.length > 1;
}

function pegarRecipients(recipients) {
  return recipients.filter(r => r !== client.user.id);
}

async function contarDMs(zipEntries) {
  let count = 0;
  for (const entry of zipEntries) {
    if (canalValido(entry)) {
      count++;
    }
  }
  return count;
}

async function fetchUser(userId) {
  try {
    return await client.users.fetch(userId);
  } catch {
    return null;
  }
}

async function cleanMessagesFromDM(dmChannel, totalDMs) {
  criarConfig();
  const config = require('./config.json');
  const messages = await fetchMsgs(dmChannel.id);

  for (const msg of messages) {
    await sleep(parseFloat(config.delay) || 1);

    try {
      await msg.delete();
    } catch (e) {
      if (e.message.includes("Could not find the channel")) {
        break;
      }
    }
  }

  await dmChannel.delete().catch(() => { });
}

async function userInfo() {
  console.clear();
  process.title = "147Clear | Informações do Usuário";

  await titulo(client.user.username, client.user.id);
  const impulsionamento = await client.api.users[client.user.id]['profile'].get();
  const dmsAbertas = await client.api.users['@me']['channels'].get();

  let nivelImpulsionamento = {};

  if (impulsionamento.premium_guild_since) {
    const dataImpulsionamento = new Date(impulsionamento.premium_guild_since);
    const agora = new Date();
    const diferencaMeses = (agora.getFullYear() - dataImpulsionamento.getFullYear()) * 12 + (agora.getMonth() - dataImpulsionamento.getMonth());

    const formatarDuracao = (inicio, fim) => {
      let duracao = '';
      
      let anos = fim.getFullYear() - inicio.getFullYear();
      let meses = fim.getMonth() - inicio.getMonth();
      let dias = fim.getDate() - inicio.getDate();
      let horas = fim.getHours() - inicio.getHours();
      let minutos = fim.getMinutes() - inicio.getMinutes();

      if (minutos < 0) {
        minutos += 60;
        horas--;
      }
      if (horas < 0) {
        horas += 24;
        dias--;
      }
      if (dias < 0) {
        dias += new Date(fim.getFullYear(), fim.getMonth(), 0).getDate();
        meses--;
      }
      if (meses < 0) {
        meses += 12;
        anos--;
      }

      if (anos > 0) duracao += `${anos} ano${anos > 1 ? 's' : ''}, `;
      if (meses > 0) duracao += `${meses} mês${meses > 1 ? 'es' : ''}, `;
      if (dias > 0) duracao += `${dias} dia${dias > 1 ? 's' : ''}, `;
      if (horas > 0) duracao += `${horas} hora${horas > 1 ? 's' : ''}, `;
      if (minutos > 0) duracao += `${minutos} minuto${minutos > 1 ? 's' : ''}, `;

      return duracao.slice(0, -2);
    };

    const niveisMeses = [2, 3, 6, 9, 12, 15, 18, 24];
    const proximoNivelMes = niveisMeses.find(nivel => diferencaMeses < nivel) || null;

    if (proximoNivelMes !== null) {
      const dataProxima = new Date(dataImpulsionamento);
      dataProxima.setMonth(dataImpulsionamento.getMonth() + proximoNivelMes);
      nivelImpulsionamento = {
        dataImpulsionamento: `${dataImpulsionamento.toLocaleString()} (Há ${formatarDuracao(dataImpulsionamento, agora)})`,
        dataProxima: `${dataProxima.toLocaleString()} (Em ${formatarDuracao(agora, dataProxima)})`
      };
    } else {
      nivelImpulsionamento = {
        dataImpulsionamento: `${dataImpulsionamento.toLocaleString()} (Há ${formatarDuracao(dataImpulsionamento, agora)})`,
        dataProxima: 'Não sobe mais de nível'
      };
    }
  } else {
    nivelImpulsionamento = {};
  }

  console.log(`
    ${reset}├─>${cor} Usuário:${reset} ${client.user.globalName ? `${reset} ${client.user.username} (\`${client.user.globalName}\`) > ${cor} ${client.user.id}` : `${client.user.username} | ${cor} ${client.user.id}`}
    ${reset}├─>${cor} Duas etapas:${impulsionamento.mfa_enabled ? `${hex('#00ff00')} Sim` : `${hex('#ff0000')} Não`}
    ${reset}├─>${cor} Dms abertas:${reset} ${dmsAbertas.length}
    ${nivelImpulsionamento.dataImpulsionamento ? `${reset}└─>${cor}Impulsionamento:
    ${reset}  ├─> ${cor} Data início: ${reset} ${nivelImpulsionamento.dataImpulsionamento}
    ${reset}  └─> ${cor} Data próxima: ${reset} ${nivelImpulsionamento.dataProxima}` : ``}
  `);
  readlineSync.question(`${cor}>${reset} Aperte ${cor}ENTER${reset} para voltar`);
  menu(client);
}

async function clearPackage() {
  console.clear();
  criarConfig();
  process.title = "147Clear | Apagar package"

  const psScript = `
  Function Select-ZipFileDialog {
      param([string]$Description="Selecione o ZIP do Discord", [string]$Filter="ZIP files (*.zip)|*.zip")

      [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null

      $objForm = New-Object System.Windows.Forms.OpenFileDialog
      $objForm.Filter = $Filter
      $objForm.Title = $Description
      $Show = $objForm.ShowDialog()
      If ($Show -eq "OK") {
          Return $objForm.FileName
      }
  }

  $zipFile = Select-ZipFileDialog
  Write-Output $zipFile
  `;

  console.log(`
  ${cor}Você precisa ter o pacote de dados do Discord em mãos, você o tem?
  
  [!] ${reset}Como pegá-lo: Configurações > Privacidade & Segurança > Solicitar dados (marque Mensagens). O .ZIP chegará no e-mail, prazo varia conforme a idade da conta.
  
  ${cor}[ 1 ]${reset} Tenho
  ${cor}[ 2 ]${reset} Não tenho
  `)
  
  const tem = readlineSync.question('> ');
  if (tem !== "1") return menu(client);
  
  if (process.platform === "win32") {
    const child = child_process.spawnSync('powershell.exe', ["-Command", psScript], { encoding: 'utf8' });
    const path = child.stdout.toString().trim();
    if (!path) {
      console.clear();
      console.log(`${erro}[X]${reset} Você não selecionou o ZIP.`)
      await sleep(5);
      await menu(client);
    }

    const buffer_zip = fs.readFileSync(path);
    const zipEntries = new AdmZip(buffer_zip).getEntries();

    console.clear();
    console.log("Insira os IDs que você não deseja apagar (id, id, id). caso não tenha nenhum aperte ENTER.");
    const whitelist = readlineSync.question('> ');
    const ids_whitelist = whitelist.split(/,\s*/);

    await processarCanais(zipEntries, ids_whitelist);
  } else {
    if (!fs.existsSync('package.zip')) {
      console.clear();
      console.log(`${erro}[X]${reset} Não achei o arquivo "package.zip", coloque-o na mesma pasta que eu(${path.basename(__filename)}) e tente novamente.`)
      await sleep(8);
      await menu(client);
    }

    console.clear();
    console.log("Insira os IDs que você não deseja apagar (id, id, id). caso não tenha nenhum aperte ENTER.")
    const whitelist = readlineSync.question('> ');
    const ids_whitelist = whitelist.split(/,\s*/);

    const buffer_zip = fs.readFileSync('package.zip');
    const zipEntries = new AdmZip(buffer_zip).getEntries();
    await processarCanais(zipEntries, ids_whitelist);
  }

  menu(client);
}

async function menu(client) {
  await updatePresence(theme);
  process.title = `147Clear | Menu | v${VERSAO_ATUAL}`;
  console.clear();

  await titulo(client?.user?.username || 'a', client?.user?.id || 'ww');
  if (await checarUpdates()) {
    console.log(`        ${cor}[!]${reset} Há uma atualização disponível, vá em https://github.com/147organization/147clear`);
  }

  console.log(`                                                  
      ${cor}[ 1 ]${reset} Apagar DM única
      ${cor}[ 2 ]${reset} Apagar DMs abertas
      ${cor}[ 3 ]${reset} Apagar package
      ${cor}[ 4 ]${reset} Remover amigos
      ${cor}[ 5 ]${reset} Remover servidores
      ${cor}[ 6 ]${reset} Fechar DMs
      ${cor}[ 7 ]${reset} Kosame Farm
      ${cor}[ 8 ]${reset} Userinfo
    
      ${cor}[ 9 ]${reset} Customizar
      ${cor}[ 10 ]${reset} Sair
`);


  const opcao = readlineSync.question('> ');
  switch (opcao) {
    case '1':
      await clearUnica();
      break;
    case '2':
      await clearAbertas();
      break;
    case '3':
      await clearPackage();
      break;
    case '4':
      await removerAmigos();
      break;
    case '5':
      await removerServidores();
      break;
    case '6':
      await fecharDMs();
      break;
    case '7':
      await kosameFarm();
      break;
    case '8':
      await userInfo();
      break;
    case '9':
      await configurar();
      break;
    case '10':
    case 'sair':
      console.clear();
      process.exit(0);
      break;
    default:
      console.clear();
      console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
      await sleep(1.5);
      await menu(client);
      break;
  }
}

async function checarUpdates() {
  if ((await (await fetch("https://api.github.com/repos/147organization/147clear/releases/latest")).json()).tag_name !== VERSAO_ATUAL) {
    return true;
  };
  return false;
}

async function iniciarCliente() {
  try {
    const config = JSON.parse(fs.readFileSync('config.json'));
    await client.login(config.token);
    menu(client);
  } catch {
    console.log("Falha ao fazer login, verifique seu token.");
    await pedirToken();
    await iniciarCliente();
  }
}

verificarToken().then(() => {
  iniciarCliente();
});
