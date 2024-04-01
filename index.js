/**
 *  The MIT License (MIT)
 *  Copyright (c) 2024 by @xyzendev - Adriansyah
 *  © 2024 by @xyzendev - Adriansyah | MIT License
 */

import { fs, path } from "@xyzendev/modules/core/main.modules.js"
import { spawn } from "@xyzendev/modules/core/second.modules.js"
import treeKill from "./core/tree-kill.js"

let a = null

function startFile(file) {
    if (a) {
        treeKill(a.pid, "SIGTERM", (err) => {
            if (err) {
                console.error("Error stopping process:", err)
            } else {
                console.log("Process stopped.")
                a = null
                start(file)
            }
        })
    } else {
        console.log("Starting . . .")
        let args = [path.join(process.cwd(), file), ...process.argv.slice(2)]
        let p = spawn(process.argv[0], args, { stdio: ["inherit", "inherit", "inherit", "ipc"] })
            .on("message", (data) => {
                console.log("[RECEIVED]", data)
                switch (data) {
                    case "reset":
                    start(file)
                    break
                    case "uptime":
                    p.send(process.uptime())
                    break
                }
            })
            .on("exit", (code) => {
                console.error("Exited with code:", code)
                if (code === 0) return
                fs.watchFile(args[0], () => {
                    fs.unwatchFile(args[0])
                    start(file)
                })
            })
        a = p
    }
}

startFile("./client/main.js")