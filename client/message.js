import { chalk, util } from "@xyzendev/modules/core/main.modules.js";
import * as Func from "../core/Function.js";

export default async function message(xyzen, store, m) {
    try {
        let quoted = m.isQuoted  ? m.quoted : m;
        let isCommand = m.prefix && m.body.startsWith(m.prefix) || false

        if (m.isBot) return;

        if (m.message && !m.isBot) {
            console.log(
                chalk.black.bgWhite.bold("FROM"), chalk.black.bgGreen.bold(m.pushName + "  =>   " + m.sender) + "\n",
                chalk.black.bgWhite.bold("IN"), chalk.black.bgGreen.bold(m.isGroup ? "Group" : "Private") + "\n",
                chalk.black.bgWhite.bold("MESSAGE"), chalk.black.bgGreen.bold(m.body || m.type) + "\n",
            );
        }
        

        switch (isCommand ? m.command.toLowerCase() : false) {
            case "ping": {
                let os = (await import("os")).default, v8 = (await import("v8")).default, { performance } = (await import("perf_hooks")).default, eold = performance.now(); const used = process.memoryUsage(), cpus = os.cpus().map(cpu => { cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0); return cpu; }), cpu = cpus.reduce((last, cpu, _, { length }) => { last.total += cpu.total; last.speed += cpu.speed / length; last.times.user += cpu.times.user; last.times.nice += cpu.times.nice; last.times.sys += cpu.times.sys; last.times.idle += cpu.times.idle; last.times.irq += cpu.times.irq; return last; }, { speed: 0, total: 0, times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }); let heapStat = v8.getHeapStatistics(), neow = performance.now(); let teks = `*Ping :* *_${Number(neow - eold).toFixed(2)} milisecond(s)_*\n💻 *_Info Server_*\n*- Hostname :* ${(os.hostname() || xyzen.user?.name)}\n*- Platform :* ${os.platform()}\n*- OS :* ${os.version()} / ${os.release()}\n*- Arch :* ${os.arch()}\n*- RAM :* ${Func.formatSize(os.totalmem() - os.freemem(), false)} / ${Func.formatSize(os.totalmem(), false)}\n*_Runtime OS_*\n${Func.runtime(os.uptime())}\n*_Runtime Bot_*\n${Func.runtime(process.uptime())}\n*_NodeJS Memory Usage_*\n${Object.keys(used).map((key, _, arr) => `*- ${key.padEnd(Math.max(...arr.map(v => v.length)), ' ')} :* ${Func.formatSize(used[key])}`).join('\n')}\n*- Heap Executable :* ${Func.formatSize(heapStat?.total_heap_size_executable)}\n*- Physical Size :* ${Func.formatSize(heapStat?.total_physical_size)}\n*- Available Size :* ${Func.formatSize(heapStat?.total_available_size)}\n*- Heap Limit :* ${Func.formatSize(heapStat?.heap_size_limit)}\n*- Malloced Memory :* ${Func.formatSize(heapStat?.malloced_memory)}\n*- Peak Malloced Memory :* ${Func.formatSize(heapStat?.peak_malloced_memory)}\n*- Does Zap Garbage :* ${Func.formatSize(heapStat?.does_zap_garbage)}\n*- Native Contexts :* ${Func.formatSize(heapStat?.number_of_native_contexts)}\n*- Detached Contexts :* ${Func.formatSize(heapStat?.number_of_detached_contexts)}\n*- Total Global Handles :* ${Func.formatSize(heapStat?.total_global_handles_size)}\n*- Used Global Handles :* ${Func.formatSize(heapStat?.used_global_handles_size)}\n${cpus[0] ? `\n*_Total CPU Usage_*\n${cpus[0].model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times).map(type => `*- ${(type + '*').padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}\n*_CPU Core(s) Usage (${cpus.length} Core CPU)_*\n${cpus.map((cpu, i) => `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times).map(type => `*- ${(type + '*').padEnd(6)}: ${(100 * cpu.times[type] / cpu.total).toFixed(2)}%`).join('\n')}`).join('\n\n')}` : ''}`.trim(); m.isGroup ? xyzen.relayMessage(m.from, { liveLocationMessage: { degreesLatitude: 35.6895, degreesLongitude: 139.6917, caption: teks, sequenceNumber: 1656662972682001, timeOffset: 8600, jpegThumbnail: fs.readFileSync("./src/media/menu.jpg"), contextInfo: { mentionedJid: [m.sender], externalAdReply: { showAdAttribution: true } } } }, { quoted: m }) : xyzen.relayMessage(m.from, { requestPaymentMessage: { currencyCodeIso4217: 'IDR', amount1000: '9999999900', requestFrom: m.sender, noteMessage: { extendedTextMessage: { text: teks, contextInfo: { externalAdReply: { showAdAttribution: true } } } } } }, {})
            }
            break
            case "owner":
            case "creator": 
                await xyzen.sendContact(m.from, config.owner, m)
            break
            case "delete": 
            case "del":
                if (quoted.fromMe) {
                await xyzen.sendMessage(m.from, { delete: quoted.key })
                } else {
                if (!m.isBotAdmin) return m.reply("Bot is not an admin")
                if (!m.isAdmin) return m.reply("Sorry, only admins can do this")
                await xyzen.sendMessage(m.from, { delete: quoted.key })
                }
            break
            case "rvo":
            if (!quoted.msg.viewOnce) return m.reply("Please reply to a message that can only be viewed once.")
                quoted.msg.viewOnce = false
                await m.reply({ forward: quoted, force: true })
            break
            case "tourl":
                if (!quoted.isMedia) return m.reply("Please reply to a media message.")
                if (Number(quoted.msg?.fileLength) > 350000000) return m.reply("File size exceeds limit.")
                let media = await downloadM()
                let url = (/image|video/i.test(quoted.msg.mimetype) && !/webp/i.test(quoted.msg.mimetype)) ? await Func.upload.telegra(media) : await Func.upload.pomf(media)
                await m.reply(url)
            break


            case "igdl": 
            case "ig": 
            case "instagram": {
                if (!m.text) return m.reply("Please send the URL.")
                const isUrl = Func.isUrl(m.text);
                if (!isUrl) return m.reply("Your URL is wrong.")
                await Func.fetchJson(`https://api.xyzen.tech/api/downloader/instagram?url=${m.text}`).then(async ({ result }) => {
                for (let i=0;i< result.length;i++) {
                    if (result[i].includes('.jpg') || result[i].includes('.png') || result[i].includes('.webp')) {
                        await xyzen.sendMessage(m.from, { image: { url: result[i] }}, { quoted: m });
                    } else return await xyzen.sendMessage(m.from, { video: { url: result[i]}}, { quoted: m });
                }
                }).catch(() => {
                m.reply("The URL is incorrect or there is an error with the server.") 
                })
            }
            break
            case "tiktok": 
            case "ttdl": 
            case "tt": {
                if (!m.text) return m.reply("Please send the URL.")
                const isUrl = Func.isUrl(m.text);
                if (!isUrl) return m.reply("Your URL is wrong.")
                await Func.fetchJson(`https://api.xyzen.tech/api/downloader/tiktok?url=${m.text}`).then(async (data) => {
                    await xyzen.sendMessage(m.from, { video: { url: data.video }, caption: data.caption }, { quoted: m });
                }).catch(() => {
                    m.reply("The URL is incorrect or there is an error with the server.") 
                })
            }
            break
            case "menu":
            case "allmenu": {
                m.reply("*Menu*\n\n\n> script \n> ping\n> owner\n> delete\n> rvo\n> tourl\n> igdl\n> tiktok")
            }
            break
            case "sc":
            case "script": {
                m.reply("GITHUB: https://github.com/xyzendev/xyzenbotv2")
            }
            break
            default:
                if ([">", "eval", "=>"].some(a => m.command.toLowerCase().startsWith(a)) && m.isCreator) {
                    let evalCmd = ""
                    try {
                        evalCmd = /await/i.test(m.text) ? eval("(async() => { " + m.text + " })()") : eval(m.text)
                    } catch (e) {
                        evalCmd = e
                    }
                    new Promise(async (resolve, reject) => {
                        try {
                            resolve(evalCmd);
                        } catch (err) {
                            reject(err)
                        }
                    })
                        ?.then((res) => m.reply(util.format(res)))
                        ?.catch((err) => m.reply(util.format(err)))
                }
        }
    } catch (e) {
        console.error(e)
    }
}