module.exports = {
    apps: [{
        name: "xyzen",
        script: "./index.js",
        watch: true,
        autorestart: true,
        ignore_watch: ["node_modules", "logs", ".git"],
        max_memory_restart: "2G",
        log_date_format: "YYYY-MM-DD HH:mm Z",
    }]
};