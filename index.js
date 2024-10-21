const fs = require("fs");
const readlineSync = require("readline-sync");
const Discord = require("discord.js-selfbot-v13");
const fetch = require("node-fetch");
const client = new Discord.Client({ checkUpdate: false });
const moment = require("moment");
const path = require("path");

const clientId = "1257500388408692800";
const VERSAO_ATUAL = "1.1.2";

const config = (() => {
	if (!fs.existsSync("./config.json")) {
		criarConfig();
	}
	return JSON.parse(
		fs.readFileSync(path.join(process.cwd(), "config.json"), "utf8"),
	);
})();

const RPC = require("discord-rpc");
const AdmZip = require("adm-zip");
const child_process = require("child_process");
const { timeStamp } = require("console");

const menuOptions = [
	{ id: "1", description: "Apagar DM única", action: clearUnica },
	{ id: "2", description: "Apagar com Trigger", action: triggerClear },
	{ id: "3", description: "Apagar DMs abertas", action: clearAbertas },
	{ id: "4", description: "Apagar package", action: clearPackage },
	{ id: "5", description: "Remover amigos", action: removerAmigos },
	{ id: "6", description: "Remover servidores", action: removerServidores },
	{ id: "7", description: "Fechar DMs", action: fecharDMs },
	{ id: "8", description: "Kosame Farm", action: kosameFarm },
	{ id: "9", description: "Userinfo", action: userInfo },
	{ id: "10", description: "Abrir DMs", action: abrirDMs },
	{ id: "11", description: "Utilidades de call", action: utilidadesCall },
	{ id: "12", description: "Customizar", action: configurar },
	{ id: "13", description: "Sair", action: () => process.exit(0) },
];

const theme = {
	state: `v${VERSAO_ATUAL}`,
	details: "No menu principal",
	largeImageKey: "fotogrande",
	largeImageText: "147 😎",
	smallImageKey: "147",
	smallImageText: "idle",
};

const cor = hex(config.cor_painel || "#A020F0");
const erro = hex("#ff0000");
const ativo = hex("#19e356");
const reset = hex("#ffffff");
const aviso = "\u001b[43";

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const rpc = new RPC.Client({ transport: "ipc" });
moment.locale("pt-BR");

try {
	RPC.register(clientId);
	rpc.on("ready", () => {
		updatePresence(theme);
	});

	rpc.login({ clientId }).catch(() => { });
} catch { }

async function updatePresence(presence, tempo = false) {
	if (!rpc) return;

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
	} catch { }
}

function hex(hex) {
	if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
		throw new Error("Código hex inválido. Deve ser no formato #RRGGBB.");
	}

	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);

	if (
		isNaN(r) ||
		isNaN(g) ||
		isNaN(b) ||
		r < 0 ||
		r > 255 ||
		g < 0 ||
		g > 255 ||
		b < 0 ||
		b > 255
	) {
		throw new Error("Valores RGB fora do intervalo válido (0-255).");
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
	let totalMessages = 0;

	while (true) {
		const fetched = await canall.messages.fetch({
			limit: 100,
			...(ultimoid && { before: ultimoid }),
		});

		if (fetched.size === 0) {
			return messages.filter(
				(msg) => msg.author.id === client.user.id && !msg.system,
			);
		}

		totalMessages += fetched.size;
		console.clear();
		await titulo(client?.user?.username || "a", client?.user?.id || "ww");
		console.log(
			`${reset}- [${cor}!${reset}] ${cor}Dando fetch nas mensagens com ${reset}${canall?.recipient?.globalName || canall?.recipient?.username || canall?.name}.\n- [${cor}@${reset}] ${cor}Encontradas ${reset}${totalMessages} mensagens ${cor}totais até agora.`,
		);

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
		tokens: [],
		cor_painel: "#A020F0",
		delay: "1",
		esperar_fetch: false,
		kosame: {
			ativado: false,
			canal: "",
			tokens: [],
		},
	};

	if (!fs.existsSync("config.json")) {
		fs.writeFileSync("config.json", JSON.stringify(configData, null, 4));
	} else {
		try {
			const currentConfig = JSON.parse(fs.readFileSync("config.json"));
			if (!currentConfig.tokens || !Array.isArray(currentConfig.tokens)) {
				throw new Error();
			}
		} catch (error) {
			fs.writeFileSync("config.json", JSON.stringify(configData, null, 4));
		}
	}
}

function escreverToken(nome, token) {
	criarConfig();
	const currentConfig = JSON.parse(fs.readFileSync("config.json"));
	currentConfig.tokens.push({ nome, token });
	fs.writeFileSync("config.json", JSON.stringify(currentConfig, null, 4));
}

async function pedirToken() {
	process.title = "147Clear | Adicionar token";
	while (true) {
		const token = readlineSync.question("Token: ").replace(/"/g, "").trim();
		const nome = readlineSync.question("Nome para representar a token: ");

		const nomeExistente = config.tokens.find((t) => t.nome === nome);
		if (nomeExistente) {
			console.clear();
			console.log(
				`${erro}[X]${reset} Já existe uma token com esse nome. Insira um nome novo.\n`,
			);
			await sleep(5);
			return;
		}

		if (await validarToken(token)) {
			const tokenExistente = config.tokens.find((t) => t.token === token);
			if (tokenExistente) {
				console.clear();
				console.log(`${erro}[X]${reset} Essa token já está na config.`);
				await sleep(5);
				return;
			}
			escreverToken(nome, token);
			break;
		} else {
			console.clear();
			console.log(`${erro}[X]${reset} Token inválida, insira outra.\n`);
		}
	}
}

async function validarToken(token) {
	const response = await fetch("https://discord.com/api/v9/users/@me", {
		headers: {
			Authorization: token.replace(/Bot|Bearer/gi, "").trim(),
		},
	});
	const u = await response.json();
	return !!u.username;
}

async function exibirBarraDeProgresso(
	contador,
	total,
	tituloTexto = "Progresso",
	textoProgress,
	textoComp = "",
	client,
) {
	const porcentagem = (contador / total) * 100;
	const progresso =
		"[" +
		"█".repeat(Math.floor(porcentagem / 2)) +
		"░".repeat(50 - Math.floor(porcentagem / 2)) +
		"]";

	process.title = `${tituloTexto} | ${contador}/${total} ${textoProgress}`;

	console.clear();
	await titulo(client?.user?.username || "a", client?.user?.id || "ww");

	console.log(
		`${textoComp ? `${textoComp}` : ""}${cor}${progresso}${reset} | ${porcentagem.toFixed(2)}% | ${contador}/${total} ${textoProgress}`,
	);
}

async function clearUnica() {
	console.clear();

	process.title = "147Clear | Limpar com DM única";
	console.log("Insira o ID do usuário.");
	let id = readlineSync.question("> ");
	let nome;
	let canal = client.channels.cache.get(id);
	let contador = 0;

	if (!canal) {
		const user = await client.users.fetch(id).catch(() => {});
		if (!user) {
			console.clear();
			console.log(`${erro}[X]${reset} Este ID é inválido.`);
			await sleep(3.5);
			await clearUnica();
		}
		nome = user?.globalName || user?.username;
		await user
			?.createDM()
			.then((c) => (id = c.id, canal = c))
			.catch(async () => {
				console.clear();
				console.log(
					`${erro}[X]${reset} Não foi possível abrir DM com o usuário.`,
				);
				await sleep(3.5);
				await clearUnica();
			});
	} else {
	  nome = canal.name;
	}

	let totalFiltrados = 0;
	if (config.esperar_fetch === false) {
		let ultimoid;
		while (true) {
			const fetched = await canal.messages.fetch({
				limit: 100,
				...(ultimoid && { before: ultimoid }),
			});

			if (fetched.size === 0) break;

			const msgsFiltradas = Array.from(fetched.values()).filter(
				(msg) => msg.author.id === client.user.id && !msg.system
			);

			totalFiltrados += msgsFiltradas.length;

			for (const [index, msg] of msgsFiltradas.entries()) {
				await sleep(Number.parseFloat(config.delay) || 1);
				await msg
					.delete()
					.then(async () => {
						contador++;
						await exibirBarraDeProgresso(
							contador,
							totalFiltrados,
							"147Clear | Limpar com DM única",
							"mensagens removidas",
							`        ${cor}Apagando com${reset} ${nome}\n`,
							client,
						);

						await updatePresence({
							state: `${Math.round((contador / totalFiltrados) * 100)}%`,
							details: `Apagando mensagens: ${contador}/${totalFiltrados}`,
						});
					})
					.catch(() => {});
			}
			ultimoid = fetched.lastKey();
		}
	} else {
		const msgs = await fetchMsgs(id);
		totalFiltrados = msgs.length;
		for (const [index, msg] of msgs.entries()) {
			await sleep(Number.parseFloat(config.delay) || 1);
			await msg
				.delete()
				.then(async () => {
					contador++;
					await exibirBarraDeProgresso(
						contador,
						totalFiltrados,
						"147Clear | Limpar com DM única",
						"mensagens removidas",
						`        ${cor}Apagando com${reset} ${nome}\n`,
						client,
					);

					await updatePresence({
						state: `${Math.round((contador / totalFiltrados) * 100)}%`,
						details: `Apagando mensagens: ${contador}/${totalFiltrados}`,
					});
				})
				.catch(() => {});
		}
	}

	if (!totalFiltrados) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem mensagens ai.`);
		await sleep(3.5);
		menu(client);
	}

	setTimeout(async () => {
		menu(client);
	}, 1000);
}

async function clearAbertas() {
	console.clear();

	process.title = "147Clear | Limpar com DMs abertas";
	const dms = await client.channels.cache
		.filter((c) => c.type == "DM")
		.map((a) => a);
	let contador = 0;

	if (!dms.length) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem DMs abertas.`);
		await sleep(3.5);
		return menu(client);
	}

	console.log("Fechar cada DM após apagar as mensagens? [s/sim]");
	const pergunta = readlineSync.question("> ");
	const fechar =
		pergunta.toLowerCase() === "s" || pergunta.toLowerCase() === "sim";

	for (const dm of dms) {
		contador++;
		let contador_msgs = 0;
		let totalFiltrados = 0;

		if (config.esperar_fetch === false) {
			let ultimoid;
			while (true) {
				const fetched = await dm.messages.fetch({
					limit: 100,
					...(ultimoid && { before: ultimoid }),
				});

				if (fetched.size === 0) break;

				const msgsFiltradas = Array.from(fetched.values()).filter(
					(msg) => msg.author.id === client.user.id && !msg.system
				);

				totalFiltrados += msgsFiltradas.length;

				for (const [index, msg] of msgsFiltradas.entries()) {
					await sleep(Number.parseFloat(config.delay) || 1);
					await msg
						.delete()
						.then(async () => {
							contador_msgs++;
							await exibirBarraDeProgresso(
								contador_msgs,
								totalFiltrados,
								"147Clear | Limpar com DMs abertas",
								"mensagens removidas",
								`        ${cor}Apagando com${reset} ${
									dm.recipient.globalName || dm.recipient.username
								}\n`,
								client,
							);

							await updatePresence({
								state: `${contador_msgs}/${totalFiltrados}`,
								details: `Apagando ${contador_msgs}/${totalFiltrados} [${Math.round(
									(contador_msgs / totalFiltrados) * 100,
								)}%]`,
								largeImageText: `${contador}/${dms.length} DMs limpas`,
							});
						})
						.catch(() => {});
				}

				ultimoid = fetched.lastKey();
			}
		} else {
			const msgs = await fetchMsgs(dm.id);
			totalFiltrados = msgs.length;

			if (!msgs.length) continue;

			for (const [index, msg] of msgs.entries()) {
				await sleep(Number.parseFloat(config.delay) || 1);
				await msg
					.delete()
					.then(async () => {
						contador_msgs++;
						await exibirBarraDeProgresso(
							contador_msgs,
							totalFiltrados,
							"147Clear | Limpar com DMs abertas",
							"mensagens removidas",
							`        ${cor}Apagando com${reset} ${
								dm.recipient.globalName || dm.recipient.username
							}\n`,
							client,
						);

						await updatePresence({
							state: `${contador_msgs}/${totalFiltrados}`,
							details: `Apagando ${contador_msgs}/${totalFiltrados} [${Math.round(
								(contador_msgs / totalFiltrados) * 100,
							)}%]`,
							largeImageText: `${contador}/${dms.length} DMs limpas`,
						});
					})
					.catch(() => {});
			}
		}

		if (fechar) await dm.delete().catch(() => {});
	}

	setTimeout(async () => {
		menu(client);
	}, 1000);
}

async function removerAmigos() {
	console.clear();

	process.title = "147Clear | Remover amigos";
	const amigos = client.relationships.cache
		.filter((value) => value === 1)
		.map((value, key) => key);
	let contador = 0;

	if (!amigos.length) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem amigos :(`);
		await sleep(3.5);
		menu(client);
	}

	for (const amigo of amigos) {
		await sleep(Number.parseFloat(config.delay) || 1);
		const user = await client.users.fetch(amigo).catch(() => { });
		await client.relationships
			.deleteRelationship(user)
			.then(async () => {
				contador++;
				await exibirBarraDeProgresso(
					contador,
					amigos.length,
					"147Clear | Remover amigos",
					"amigos removidos",
					"",
					client,
				);

				await updatePresence({
					details: `Removendo amigos ${contador}/${amigos.length} [${Math.round((contador / amigos.length) * 100)}%]`,
				});
			})
			.catch(() => { });
	}

	setTimeout(() => {
		menu(client);
	}, 1000);
}

async function removerServidores() {
	console.clear();

	process.title = "147Clear | Remover servidores";
	const servers = client.guilds.cache.map((a) => a);
	let contador = 0;

	if (!servers.length) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não está em nenhum servidor.`);
		await sleep(3.5);
		menu(client);
	}

	for (const server of servers) {
		await sleep(Number.parseFloat(config.delay) || 1);
		await server
			.leave()
			.then(async () => {
				contador++;
				await exibirBarraDeProgresso(
					contador,
					servers.length,
					"147Clear | Remover servidores",
					"servidores removidos",
					"",
					client,
				);

				await updatePresence({
					details: `Removendo servidores ${contador}/${servers.length} [${Math.round((contador / servers.length) * 100)}%]`,
				});
			})
			.catch(() => { });
	}

	setTimeout(() => {
		menu(client);
	}, 1000);
}

async function fecharDMs() {
	console.clear();

	process.title = "147Clear | Fechar DMs";
	const dms = await client.channels.cache
		.filter((c) => c.type == "DM")
		.map((a) => a);
	let contador = 0;

	if (!dms.length) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem DMs abertas.`);
		await sleep(3.5);
		menu(client);
	}

	for (const dm of dms) {
		await sleep(1.3);
		await dm
			.delete()
			.then(async () => {
				contador++;
				await exibirBarraDeProgresso(
					contador,
					dms.length,
					"147Clear | Fechar DMs",
					"DMs fechadas",
					"",
					client,
				);

				await updatePresence({
					details: `Fechando DMs ${contador}/${dms.length} [${Math.round((contador / dms.length) * 100)}%]`,
				});
			})
			.catch(() => { });
	}

	setTimeout(() => {
		menu(client);
	}, 1000);
}

async function configurar() {
	console.clear();

	process.title = "147Clear | Configuração";
	await titulo(client?.user?.username || "a", client?.user?.id || "ww");

	console.log(`
        ${cor}[ 1 ]${reset} Mudar delay
        ${cor}[ 2 ]${reset} Mudar cor do painel
        ${cor}[ 3 ]${reset} Esperar obtenção de todas as mensagens para apagar
        
        ${cor}[ 4 ]${reset} Voltar
  `);

	const opcoes = {
		1: async () => {
			console.clear();
			console.log(
				"Insira o delay em segundos. (ex: 1.5 para 1 segundo e meio)",
			);
			const delayInput = readlineSync.question("> ");

			const delayInSeconds = Number.parseFloat(delayInput);
			if (isNaN(delayInSeconds) || delayInSeconds <= 0) {
				console.clear();
				console.log(`${erro}[X]${reset} Isso não é um delay válido.`);
				await sleep(3.5);
			} else {
				const currentConfig = JSON.parse(fs.readFileSync("config.json"));
				currentConfig.delay = delayInSeconds.toString();
				fs.writeFileSync("config.json", JSON.stringify(currentConfig, null, 4));
				await sleep(1.5);
			}
		},
		2: async () => {
			console.clear();
			console.log("Insira a cor em formato HEX (ex: #ffffff)");
			const cor = readlineSync.question("> ");

			try {
				const cor_convertida = hex(cor);
				const currentConfig = JSON.parse(fs.readFileSync("config.json"));
				currentConfig.cor_painel = cor;
				fs.writeFileSync("config.json", JSON.stringify(currentConfig, null, 4));
				console.clear();
				console.log("Cor trocada com sucesso, inicie o programa novamente.");
				await sleep(7);
				process.exit(0);
			} catch {
				console.clear();
				console.log(`${erro}[X]${reset} Isso não é uma cor HEX válida.`);
				await sleep(3.5);
			}
		},
        3: async () => {
            while (true) {
                console.clear();
                console.log("Esperar a obtenção de TODAS as mensagens para apagar?");
                console.log("Estado atual:", config.esperar_fetch ? `${ativo}Ativado${reset}` : `${erro}Desativado${reset}`);
                console.log(`\n${cor}[ 1 ]${reset} Alterar estado`);
                console.log(`${cor}[ 2 ]${reset} Voltar para o menu\n`);
        
                const opcao = readlineSync.question("> ");
        
                switch (opcao) {
                    case '1':
                        config.esperar_fetch = !config.esperar_fetch;
                        fs.writeFileSync("config.json", JSON.stringify(config, null, 4));
                        break;
                    case '2':
                        return menu(client);
                    default:
                        console.clear();
                        console.log(`${erro}[X] ${reset} Opção inválida, tente novamente.`);
                        await sleep(1.5);
                        break;
                }
            }
        },
		4: async () => {
			return menu(client);
		},
		default: async () => {
			console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
			await sleep(1.5);
			console.clear();
		},
	};

	const opcao = readlineSync.question("> ");

	await (opcoes[opcao] || opcoes["default"])();
	await configurar();
}

async function kosameFarm() {
	console.clear();

	console.log("Implementar depois.");
	await sleep(3.5);
	menu(client);
}

async function processarCanais(zipEntries, whitelist) {
	const totalDMs = await contarDMs(zipEntries);
	let contador = 0;

	for (const entry of zipEntries) {
		if (!canalValido(entry)) continue;

		const channelData = dadosCanal(entry);
		if (!ehDMGrupo(channelData)) continue;

		for (const recipientId of pegarRecipients(channelData.recipients)) {
			if (whitelist.includes(recipientId)) continue;

			const user = await fetchUser(recipientId);
			await sleep(Number.parseFloat(config.delay) || 1);

			const dmChannel = await user?.createDM().catch(() => { });
			if (dmChannel) {
				await cleanMessagesFromDM(dmChannel, client);
				contador++;

				await exibirBarraDeProgresso(
					contador,
					totalDMs,
					"147Clear | Apagar package",
					"DMs limpas",
					`        ${cor}Apagando com${reset} ${dmChannel.recipient.globalName || dmChannel.recipient.username}\n`,
					client,
				);

				await updatePresence({
					details: `Usando CL all`,
					state: `Apagando ${contador}/${totalDMs} DMs [${Math.round((contador / totalDMs) * 100)}%]`,
					largeImageText: `Na dm com ${dmChannel.recipient.globalName || dmChannel.recipient.username}`,
				});
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
	return (
		data?.recipients &&
		Array.isArray(data.recipients) &&
		data.type === 'DM' &&
		data.recipients.length > 1
	);
}

function pegarRecipients(recipients) {
	return recipients.filter((r) => r !== client.user.id);
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

async function cleanMessagesFromDM(dmChannel, client) {
	let deletedCount = 0;
	let totalFiltrados = 0;

	if (config.esperar_fetch === false) {
		let ultimoid;

		while (true) {
			const fetched = await dmChannel.messages.fetch({
				limit: 100,
				...(ultimoid && { before: ultimoid }),
			});

			if (fetched.size === 0) break;

			const msgsFiltradas = Array.from(fetched.values()).filter(
				(msg) => msg.author.id === client.user.id && !msg.system
			);

			totalFiltrados += msgsFiltradas.length;

			for (const msg of msgsFiltradas) {
				await sleep(Number.parseFloat(config.delay) || 1);

				await msg.delete().then(async () => {
					deletedCount++;

					await exibirBarraDeProgresso(
						deletedCount,
						totalFiltrados,
						"147Clear | Apagar package",
						"mensagens removidas",
						`        ${cor}Apagando mensagens no canal ${reset}${
							dmChannel.name || dmChannel.recipient.username
						} \n`,
						client
					);
				}).catch(e => {
					if (e.message.includes("Could not find the channel")) {
						return;
					}
				});
			}

			ultimoid = fetched.lastKey();
		}
	} else {
		const messages = await fetchMsgs(dmChannel.id);
		totalFiltrados = messages.length;

		for (const msg of messages) {
			await sleep(Number.parseFloat(config.delay) || 1);

			await msg.delete().then(async () => {
				deletedCount++;

				await exibirBarraDeProgresso(
					deletedCount,
					totalFiltrados,
					"147Clear | Apagar package",
					"mensagens removidas",
					`        ${cor}Apagando mensagens no canal ${reset}${
						dmChannel.name || dmChannel.recipient.username
					} \n`,
					client
				);
			}).catch(e => {
				if (e.message.includes("Could not find the channel")) {
					return;
				}
			});
		}
	}

	await dmChannel.delete().catch(() => { });
}

async function userInfo() {
	console.clear();

	process.title = "147Clear | Informações do Usuário";

	await titulo(client.user.username, client.user.id);
	const impulsionamento =
		await client.api.users[client.user.id]["profile"].get();
	const dmsAbertas = await client.api.users["@me"]["channels"].get();

	let nivelImpulsionamento = {};

	if (impulsionamento.premium_guild_since) {
		const dataImpulsionamento = moment(impulsionamento.premium_guild_since);
		const agora = moment();

		const niveisMeses = [1, 2, 3, 6, 9, 12, 15, 18, 24];
		const diff_meses = agora.diff(dataImpulsionamento, "months");

		let previous = 0;
		let next = 0;

		for (const months of niveisMeses) {
			if (diff_meses >= months) {
				previous = months;
			} else {
				next = months;
				break;
			}
		}

		if (diff_meses < 1) {
			previous = 1;
			next = 2;
		}

		const formatarDuracao = (duration) => {
			const partes = [];
			const anos = duration.years();
			const meses = duration.months();
			const dias = duration.days();
			const horas = duration.hours();
			const minutos = duration.minutes();

			if (anos > 0) partes.push(`${anos} ano${anos > 1 ? "s" : ""}`);
			if (meses > 0) partes.push(`${meses} mês${meses > 1 ? "es" : ""}`);
			if (dias > 0) partes.push(`${dias} dia${dias > 1 ? "s" : ""}`);
			if (horas > 0) partes.push(`${horas} hora${horas > 1 ? "s" : ""}`);
			if (minutos > 0)
				partes.push(`${minutos} minuto${minutos > 1 ? "s" : ""}`);

			if (partes.length > 1) {
				const ultimo = partes.pop();
				return partes.join(", ") + " e " + ultimo;
			}
			return partes[0];
		};

		const calcularProximaData = (inicio, meses) => {
			return moment(inicio).add(meses, "months");
		};

		if (diff_meses >= 24) {
			nivelImpulsionamento = {
				dataImpulsionamento: `${dataImpulsionamento.format("lll")} (Há ${formatarDuracao(moment.duration(agora.diff(dataImpulsionamento)))})`,
				dataProxima: "Não sobe mais de nível",
			};
		} else {
			const dataProxima = calcularProximaData(dataImpulsionamento, next);
			nivelImpulsionamento = {
				dataImpulsionamento: `${dataImpulsionamento.format("lll")} (Há ${formatarDuracao(moment.duration(agora.diff(dataImpulsionamento)))})`,
				dataProxima: `${dataProxima.format("lll")} (Em ${formatarDuracao(moment.duration(dataProxima.diff(agora)))})`,
			};
		}
	} else {
		nivelImpulsionamento = {};
	}

	console.log(`
    ${reset}├─>${cor} Usuário:${reset}${client.user.globalName ? `${reset} ${client.user.username} (\`${client.user.globalName}\`) > ${cor}${client.user.id}` : `${client.user.username} | ${cor}${client.user.id}`}
    ${reset}├─>${cor} DMs abertas:${reset} ${dmsAbertas.length}
    ${nivelImpulsionamento.dataImpulsionamento
			? `${reset}└─>${cor} Boost:
    ${reset}  ├─> ${cor} Data início: ${reset} ${nivelImpulsionamento.dataImpulsionamento}
    ${reset}  └─> ${cor} Data próxima: ${reset} ${nivelImpulsionamento.dataProxima}`
			: ``
		}
  `);
	readlineSync.question(
		`${cor}>${reset} Aperte ${cor}ENTER${reset} para voltar`,
	);
	menu(client);
}

async function clearPackage() {
	console.clear();

	process.title = "147Clear | Apagar package";

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
  `);

	const tem = readlineSync.question("> ");
	if (tem !== "1") return menu(client);

	if (process.platform === "win32") {
		const child = child_process.spawnSync(
			"powershell.exe",
			["-Command", psScript],
			{ encoding: "utf8" },
		);
		const path = child.stdout.toString().trim();
		if (!path) {
			console.clear();
			console.log(`${erro}[X]${reset} Você não selecionou o ZIP.`);
			await sleep(5);
			await menu(client);
		}

		const buffer_zip = fs.readFileSync(path);
		const zipEntries = new AdmZip(buffer_zip).getEntries();

		console.clear();
		console.log(
			"Insira os IDs que você não deseja apagar (id, id, id). caso não tenha nenhum aperte ENTER.",
		);
		const whitelist = readlineSync.question("> ");
		const ids_whitelist = whitelist.split(/,\s*/);

		await processarCanais(zipEntries, ids_whitelist);
	} else {
		if (!fs.existsSync("package.zip")) {
			console.clear();
			console.log(
				`${erro}[X]${reset} Não achei o arquivo "package.zip", coloque-o na mesma pasta que eu(${path.basename(__filename)}) e tente novamente.`,
			);
			await sleep(8);
			await menu(client);
		}

		console.clear();
		console.log(
			"Insira os IDs que você não deseja apagar (id, id, id). caso não tenha nenhum aperte ENTER.",
		);
		const whitelist = readlineSync.question("> ");
		const ids_whitelist = whitelist.split(/,\s*/);

		const buffer_zip = fs.readFileSync("package.zip");
		const zipEntries = new AdmZip(buffer_zip).getEntries();
		await processarCanais(zipEntries, ids_whitelist);
	}

	menu(client);
}

async function abrirDMs() {
	console.clear();

	process.title = "147Clear | Abrir DMs";
	console.log(`
    ${cor}[ 1 ]${reset} Abrir DMs com amigos
    ${cor}[ 2 ]${reset} Abrir todas as DMs com quem conversou (package)

    ${cor}[ 3 ]${reset} Voltar
  `);
	const opcao = readlineSync.question("> ");

	if (opcao === "1") {
		await abrirDMsComAmigos();
	} else if (opcao === "2") {
		await abrirTodasAsDMs();
	} else if (opcao === "3") {
		return await menu(client);
	} else {
		console.clear();
		console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
		await sleep(1.5);
		await menu(client);
	}

	menu(client);
}

async function abrirDMsComAmigos() {
	const amigos = client.relationships.cache
		.filter((value) => value === 1)
		.map((value, key) => key);
	let contador = 0;

	if (!amigos.length) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem amigos :(`);
		await sleep(5);
		menu(client);
		return;
	}

	for (const amigo of amigos) {
		const amigokk = await client.users.fetch(amigo).catch(() => { });
		await sleep(1.7);
		await amigokk
			.createDM()
			.then(async () => {
				contador++;
				await exibirBarraDeProgresso(
					contador,
					amigos.length,
					"147Clear | Abrir DMs",
					"DMs abertas",
					"",
					client,
				);

				await updatePresence({
					details: `Abrindo DMs com amigos ${contador}/${amigos.length} [${Math.round((contador / amigos.length) * 100)}%]`,
				});
			})
			.catch(() => { });
	}

	setTimeout(() => {
		menu(client);
	}, 1000);
}

async function abrirTodasAsDMs() {
	console.clear();
	console.log(`
    ${cor}Você precisa ter o pacote de dados do Discord em mãos, você o tem?
  
    [!] ${reset}Como pegá-lo: Configurações > Privacidade & Segurança > Solicitar dados (marque Mensagens). O .ZIP chegará no e-mail, prazo varia conforme a idade da conta.
  
    ${cor}[ 1 ]${reset} Tenho
    ${cor}[ 2 ]${reset} Não tenho
  `);

	const tem = readlineSync.question("> ");
	if (tem !== "1") return menu(client);

	const path = await selecionarArquivoZip();
	if (!path) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não selecionou o ZIP.`);
		await sleep(5);
		await menu(client);
		return;
	}

	const buffer_zip = fs.readFileSync(path);
	const zipEntries = new AdmZip(buffer_zip).getEntries();
	const totalDMs = await contarDMs(zipEntries) / 2;
	let contador = 0;

	for (const entry of zipEntries) {
		if (!canalValido(entry)) continue;

		const channelData = dadosCanal(entry);
		if (!ehDMGrupo(channelData)) continue;

		for (const recipientId of pegarRecipients(channelData.recipients)) {
			const user = await fetchUser(recipientId);
			await sleep(Number.parseFloat(config.delay) || 1);
			await user
				?.createDM()
				.then(async () => {
					contador++;
					await exibirBarraDeProgresso(
						contador,
						totalDMs,
						"147Clear | Abrir DMs",
						"DMs abertas",
						"",
						client,
					);

					await updatePresence({
						details: `Abrindo todas as DMs ${contador}/${totalDMs} [${Math.round((contador / totalDMs) * 100)}%]`,
					});
				})
				.catch(() => { });
		}
	}

	setTimeout(() => {
		menu(client);
	}, 1000);
}

async function selecionarArquivoZip() {
	if (process.platform === "win32") {
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

		const child = child_process.spawnSync(
			"powershell.exe",
			["-Command", psScript],
			{ encoding: "utf8" },
		);
		return child.stdout.toString().trim();
	} else {
		if (!fs.existsSync("package.zip")) {
			console.clear();
			console.log(
				`${erro}[X]${reset} Não achei o arquivo "package.zip", coloque-o na mesma pasta que eu(${path.basename(__filename)}) e tente novamente.`,
			);
			await sleep(8);
			return menu(client);
		}

		return "package.zip";
	}
}

async function utilidadesCall() {
	console.clear();

	process.title = "147Clear | Utilidades de call";

	console.log(`
    Você deseja desconectar ou mover todos da call?
    
    ${cor}[ 1 ]${reset} Desconectar
    ${cor}[ 2 ]${reset} Mover
	
    ${cor}[ 3 ]${reset} Voltar
  `);
	const move_ou_disconnect = readlineSync.question("> ");
	console.clear();

	switch (move_ou_disconnect) {
		case "2":
			console.log("Digite o ID da call que os membros estão");
			const disconnectChannelId = readlineSync.question("> ");

			console.clear();
			console.log("Digite o ID da call que os membros vão ser movidos");
			const moveChannelId = readlineSync.question("> ");

			console.clear();
			console.log(`
    Tem certeza que deseja fazer isso?
        
    ${cor}[ 1 ]${reset} Sim
    ${cor}[ 2 ]${reset} Não
      `);
			const confirmMove = readlineSync.question("> ");
			if (confirmMove !== "1") {
				console.clear();
				await sleep(1.5);
				await menu(client);
				return;
			}

			const disconnectChannel = client.channels.cache.get(disconnectChannelId);
			const moveChannel = client.channels.cache.get(moveChannelId);

			if (
				!disconnectChannel ||
				!moveChannel ||
				disconnectChannel.type !== "GUILD_VOICE" ||
				moveChannel.type !== "GUILD_VOICE"
			) {
				console.clear();
				console.log(`${erro}[X]${reset} ID inválido.`);
				await sleep(3.5);
				await menu(client);
				return;
			}

			if (!disconnectChannel.members.size) {
				console.clear();
				console.log(`${erro}[X]${reset} A call está vazia.`);
				await sleep(3.5);
				await menu(client);
				return;
			}

			const members = Array.from(disconnectChannel.members.values());
			let deuerro = false;

			for (const member of members) {
				if (moveChannel.locked || moveChannel.full) {
					console.clear();
					console.log(`${erro}[X]${reset} A call está privada ou lotada.`);
					await sleep(3.5);
					await menu(client);
					break;
				}

				try {
					await disconnectChannel.members
						.get(member.id)
						.voice.setChannel(moveChannel.id);
					if (member.id !== client.user.id) {
						console.log(
							`${cor}[+]${reset} ${member.user.username} movido para o canal ${moveChannel.name}`,
						);
					}
				} catch (err) {
					if (err.message === "Missing Permissions") {
						if (!deuerro) {
							console.clear();
							console.log(`${erro}[X]${reset} Você não tem permissão.`);
							await sleep(3.5);
							await menu(client);
							deuerro = true;
						}
						break;
					}
				}
			}
			await menu(client);
			break;
		case "1":
			console.log(
				"Digite o ID da call que você deseja desconectar todos os usuários",
			);
			const moveChannelId2 = readlineSync.question("> ");
			console.clear();

			console.log(`
    Tem certeza que deseja fazer isso?
        
    ${cor}[ 1 ]${reset} Sim
    ${cor}[ 2 ]${reset} Não
      `);
			const confirmDisconnect = readlineSync.question("> ");

			if (confirmDisconnect !== "1") {
				console.clear();
				await sleep(1.5);
				await menu(client);
				return;
			}

			const moveChannel2 = client.channels.cache.get(moveChannelId2);
			if (!moveChannel2 || moveChannel2.type !== "GUILD_VOICE") {
				console.clear();
				console.log(`${erro}[X]${reset} ID inválido.`);
				await sleep(3.5);
				await menu(client);
				return;
			}

			if (!moveChannel2.members.size) {
				console.clear();
				console.log(`${erro}[X]${reset} A call está vazia.`);
				await sleep(3.5);
				await menu(client);
				return;
			}

			const members2 = Array.from(moveChannel2.members.values());
			let deuerrokk = false;

			for (const member of members2) {
				const user = client.users.cache.get(member.id);
				try {
					await moveChannel2.members.get(member.id).voice.setChannel(null);
					console.log(
						`${cor}[+]${reset} ${user.tag} desconectado da call ${moveChannel2.name}`,
					);
				} catch (err) {
					if (err.message === "Missing Permissions") {
						if (!deuerrokk) {
							console.clear();
							console.log(`${erro}[X]${reset} Você não tem permissão.`);
							await sleep(3.5);
							await menu(client);
							deuerrokk = true;
						}
						break;
					}
				}
			}

			await menu(client);
			break;
		case "3":
			await menu(client);
			break;
		default:
			console.clear();
			console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
			await sleep(1.5);
			await menu(client);
			break;
	}
}

async function triggerClear() {
	console.clear();

	process.title = "147Clear | Limpar com Trigger";
	console.log("Insira o trigger que vai iniciar o clear.");
	let trigger = readlineSync.question("> ");
	let triggered = false;
	let contador = 0;

	console.clear();
	console.log(
		`${reset}Envie ${cor}${trigger} ${reset}em algum chat para limpar suas mensagens.`,
	);

	const waitForTrigger = () => {
		return new Promise((resolve) => {
			client.on("messageCreate", async (message) => {
				if (message.author.id !== client.user.id) return;
				if (message.content === trigger) {
					triggered = true;
					resolve(message);
				}
			});
		});
	};

	const message = await waitForTrigger();

	let totalFiltrados = 0;
	let msgs = [];
	if (config.esperar_fetch === false) {
		let ultimoid;
		while (true) {
			const fetched = await message.channel.messages.fetch({
				limit: 100,
				...(ultimoid && { before: ultimoid }),
			});

			if (fetched.size === 0) break;

			const msgsFiltradas = Array.from(fetched.values()).filter(
				(msg) => msg.author.id === client.user.id && !msg.system
			);

			totalFiltrados += msgsFiltradas.length;

			for (const [index, msg] of msgsFiltradas.entries()) {
				await sleep(parseFloat(config.delay) || 1);
				await msg
					.delete()
					.then(async () => {
						contador++;
						await exibirBarraDeProgresso(
							contador,
							totalFiltrados,
							"147Clear | Limpar com Trigger",
							"mensagens removidas",
							`        ${cor}Apagando mensagens com ${reset}${message.channel.recipient?.globalName || message.channel.recipient?.username || message.channel.name} \n`,
							client,
						);
					})
					.catch(() => {});
			}

			ultimoid = fetched.lastKey();
		}
	} else {
		msgs = await fetchMsgs(message.channel.id);
		totalFiltrados = msgs.length;
		for (const [index, msg] of msgs.entries()) {
			await sleep(parseFloat(config.delay) || 1);
			await msg
				.delete()
				.then(async () => {
					contador++;
					await exibirBarraDeProgresso(
						contador,
						totalFiltrados,
						"147Clear | Limpar com Trigger",
						"mensagens removidas",
						`        ${cor}Apagando mensagens com ${reset}${message.channel.recipient?.globalName || message.channel.recipient?.username || message.channel.name} \n`,
						client,
					);
				})
				.catch(() => {});
		}
	}

	if (!totalFiltrados) {
		console.clear();
		console.log(`${erro}[X]${reset} Você não tem mensagens ai.`);
		await sleep(3.5);
		menu(client);
		return;
	}

	menu(client);
}

function getMaxDescriptionLength(options) {
	return Math.max(...options.map((option) => option.description.length));
}

function formatMenuInColumns(options, columns = 2) {
	const maxDescriptionLength = getMaxDescriptionLength(options);
	const rows = Math.ceil(options.length / columns);
	let output = "";

	for (let i = 0; i < rows; i++) {
		let row = "";
		for (let j = 0; j < columns; j++) {
			const index = i + j * rows;
			if (index < options.length) {
				const option = options[index];
				const paddedDescription = option.description.padEnd(
					maxDescriptionLength,
					" ",
				);
				row += `      ${cor}[ ${option.id} ]${reset} ${paddedDescription}`;
				if (j < columns - 1) {
					row += "          ";
				}
			}
		}
		output += row + "\n";
	}

	return output;
}

async function menu(client) {
	console.clear();
	process.title = `147Clear | Menu | v${VERSAO_ATUAL}`;

	await updatePresence(theme);

	while (true) {
		console.clear();
		await titulo(client?.user?.username || "a", client?.user?.id || "ww");
		
	        if (await checarUpdates()) {
		  console.log(
			`        ${cor}[!]${reset} Há uma atualização disponível, vá em https://github.com/147organization/147clear`,
    	          );
	        }
		
		console.log("\n" + formatMenuInColumns(menuOptions, 2) + "\n");
		
		const opcao = readlineSync.question("> ");
		const selectedOption = menuOptions.find((option) => option.id === opcao);
		if (selectedOption) {
			await selectedOption.action();
		} else {
			console.log(`${erro}[X] ${reset}Opção inválida, tente novamente.`);
			await sleep(2.5);
		}
	}
}

async function checarUpdates() {
	if (
		(
			await (
				await fetch(
					"https://api.github.com/repos/147organization/147clear/releases/latest",
				)
			).json()
		).tag_name !== VERSAO_ATUAL
	) {
		return true;
	}
	return false;
}

async function iniciarCliente() {
	criarConfig();
	console.clear();

	try {
		let config = JSON.parse(fs.readFileSync("config.json"));

		const tokensValidos = await validarTokens(config.tokens);
		config.tokens = tokensValidos;
		fs.writeFileSync("config.json", JSON.stringify(config, null, 4));

		if (!tokensValidos.length) {
			console.log(
				`${erro}[X]${reset} Nenhuma token válida encontrada na config.\n`,
			);
			await pedirToken();
			return iniciarCliente();
		}

		await selecionarToken(tokensValidos, config);
	} catch (error) {
		console.log("Falha ao fazer login, verifique seu token.");
		await pedirToken();
		return iniciarCliente();
	}
}

async function validarTokens(tokens) {
	const tokensValidos = [];
	for (const { nome, token } of tokens) {
		if (await validarToken(token)) {
			tokensValidos.push({
				nome,
				token,
			});
		}
	}
	return tokensValidos;
}

async function selecionarToken(tokensValidos, config) {
	process.title = "147Clear | Selecionar token";
	console.clear();
	console.log(`  Escolha uma token para logar.\n`);

	tokensValidos.forEach((t, index) => {
		console.log(`  ${cor}[ ${index + 1} ]${reset} ${t.nome}`);
	});

	console.log(
		`\n  ${cor}[ ${tokensValidos.length + 1} ]${reset} Adicionar nova token`,
	);
	console.log(
		`  ${cor}[ ${tokensValidos.length + 2} ]${reset} Remover uma token`,
	);

	const opcao = readlineSync.question("\n> ");

	switch (parseInt(opcao)) {
		case tokensValidos.length + 1:
			console.clear();
			await pedirToken();
			return iniciarCliente();
		case tokensValidos.length + 2:
			await removerToken(tokensValidos, config);
			return iniciarCliente();
		default:
			await logarToken(tokensValidos, opcao);
	}
}

async function removerToken(tokensValidos, config) {
	console.clear();
	console.log(`  Escolha uma token para remover.\n`);
	tokensValidos.forEach((t, index) => {
		console.log(`  ${cor}[ ${index + 1} ]${reset} ${t.nome}`);
	});

	const indiceTokenRemover = parseInt(readlineSync.question("\n> ")) - 1;

	if (indiceTokenRemover >= 0 && indiceTokenRemover < tokensValidos.length) {
		const tokenRemover = tokensValidos[indiceTokenRemover];
		config.tokens = config.tokens.filter((t) => t.token !== tokenRemover.token);
		fs.writeFileSync("config.json", JSON.stringify(config, null, 4));
		console.log(`Token "${tokenRemover.nome}" removida com sucesso.\n`);
	} else {
		console.clear();
		console.log(`${erro}[X]${reset} Opção inválida.`);
		await sleep(5);
	}
}

async function logarToken(tokensValidos, opcao) {
	const tokenEscolhido = tokensValidos[parseInt(opcao) - 1];

	if (tokenEscolhido) {
		await client.login(tokenEscolhido.token);
		menu(client);
	} else {
		console.log("Opção inválida.");
		await iniciarCliente();
	}
}

iniciarCliente();
