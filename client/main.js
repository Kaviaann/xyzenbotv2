import config from "./config.js";
import smsg, {
    Module
} from "../core/Serialize.js";
import makeWASocket, {
    delay,
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeInMemoryStore,
    jidNormalizedUser,
    PHONENUMBER_MCC,
    DisconnectReason,
    Browsers
} from "@xyzendev/baileys";
import {
    Boom,
    fs,
    pino
} from "@xyzendev/modules/core/main.modules.js";

const logger = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
}).child({
    class: "xyzen"
})
logger.level = "fatal";
const usePairingCode = config.usePairingCode;
const store = makeInMemoryStore({
    logger
});

if (config.write_store) store.readFromFile(`./core/store.json`)


// Path: client/main.js;

const Start = async () => {
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(`./core/session`);
    const {
        version,
        isLatest
    } = await fetchLatestWaWebVersion()

    console.log(`Current version: ${version} ${isLatest ? "(latest)" : "(not latest)"}`);

    /**
     *  @type {import("@xyzendev/baileys").WASocket}
     *  @param {import("@xyzendev/baileys").MessageKey} key
     *  @returns {Promise<string>}
     *  @returns {string}
     *  @returns {Promise<string>}
     * 
     *  @NOTE : Dont Change the return type
     */

    const xyzen = makeWASocket.default({
        version,
        logger,
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: Browsers.macOS('Safari'),
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage
    });

    store.bind(xyzen.ev);

    await Module({
        xyzen,
        store
    });

    if (usePairingCode && !xyzen.authState.creds.registered) {
        let phoneNumber = config.number.number.replace(/[^0-9]/g, '');

        if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) throw "Invalid phone number";

        await delay(5000);
        let code = await xyzen.requestPairingCode(phoneNumber);
        console.log(`Pairing Code : \x1b[32m${code?.match(/.{1,4}/g)?.join("-") || code}\x1b[39m`)
    }

    xyzen.ev.on("connection.update", (update) => {
        const {
            lastDisconnect,
            connection,
            qr
        } = update
        if (connection) {
            console.info(`Connection Status : ${connection}`)
        }

        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

            switch (reason) {
                case DisconnectReason.badSession:
                    console.info("Bad Session, Restart Required")
                    Start();
                    break
                case DisconnectReason.connectionClosed:
                    console.info("Connection Closed, Reconnecting...")
                    Start();
                    break
                case DisconnectReason.connectionLost:
                    console.info("Connection Lost, Reconnecting...")
                    Start();
                    break
                case DisconnectReason.connectionReplaced:
                    console.info("Connection Replaced, Reconnecting...")
                    Start();
                    break
                case DisconnectReason.restartRequired:
                    console.info("Restart Required")
                    Start();
                    break
                case DisconnectReason.loggedOut:
                    console.info("Logged Out, Restart Required")
                    xyzen.end();
                    fs.rmSync(`./core/session`, {
                        recursive: true,
                        force: true
                    });
                    Start();
                    break
                case DisconnectReason.multideviceMismatch:
                    console.info("Multi Device Mismatch, Restart Required")
                    xyzen.end();
                    fs.rmSync(`./core/session`, {
                        recursive: true,
                        force: true
                    });
                    Start();
                    break
                default:
                    console.info("Connection Closed, Reconnecting...")
                    Start();
            }
        }

        if (connection === "open") {
            console.info("Connection Opened")
        }
    });

    xyzen.ev.on("creds.update", saveCreds);

    xyzen.ev.on("contacts.update", (update) => {
        for (let contact of update) {
            let id = jidNormalizedUser(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                ...(store.contacts?.[id] || {}),
                ...(contact || {})
            }
        }
    })

    xyzen.ev.on("contacts.upsert", (update) => {
        for (let contact of update) {
            let id = jidNormalizedUser(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                ...(contact || {}),
                isContact: true
            }
        }
    })

    xyzen.ev.on("groups.update", (updates) => {
        for (const update of updates) {
            const id = update.id
            if (store.groupMetadata[id]) {
                store.groupMetadata[id] = {
                    ...(store.groupMetadata[id] || {}),
                    ...(update || {})
                }
            }
        }
    })

    xyzen.ev.on('group-participants.update', ({
        id,
        participants,
        action
    }) => {
        const metadata = store.groupMetadata[id]
        if (metadata) {
            switch (action) {
                case 'add':
                case "revoked_membership_requests":
                    metadata.participants.push(...participants.map(id => ({
                        id: jidNormalizedUser(id),
                        admin: null
                    })))
                    break
                case 'demote':
                case 'promote':
                    for (const participant of metadata.participants) {
                        let id = jidNormalizedUser(participant.id)
                        if (participants.includes(id)) {
                            participant.admin = (action === "promote" ? "admin" : null)
                        }
                    }
                    break
                case 'remove':
                    metadata.participants = metadata.participants.filter(p => !participants.includes(jidNormalizedUser(p.id)))
                    break
            }
        }
    });

    xyzen.ev.on("messages.upsert", async ({
        messages
    }) => {
        if (!messages[0].message) return
        let m = await smsg(xyzen, messages[0], store);

        if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0) store.groupMetadata = await xyzen.groupFetchAllParticipating()

        if (m.key && !m.key.fromMe && m.key.remoteJid === "status@broadcast") {
            if (m.type === "protocolMessage" && m.message.protocolMessage.type === 0) return
            await xyzen.readMessages([m.key])
        }

        if (config.self === "true" && m.isCreator) return

        await ((await import("./message.js")).default(xyzen, store, m))
    })

    setInterval(async () => {
        if (config.write_store) store.writeToFile(`./core/store.json`)
    }, 10 * 1000)

    process.on("uncaughtException", console.error)
    process.on("unhandledRejection", console.error)
}

async function getMessage(key) {
    try {
        const jid = jidNormalizedUser(key.remoteJid)
        const msg = await store.loadMessage(jid, key.id)

        return msg?.message || ""

        return ""
    } catch {}
}

Start()