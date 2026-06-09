import http from "http";
import { parseProjectMemory, readManagerLogs, listAgents } from "./data-service.js";
import { HTML_CONTENT } from "./html-template.js";

export function startDashboardServer(port: number = 5858) {
    const server = http.createServer((req, res) => {
        // API: Status
        if (req.url === "/api/status") {
            const mem = parseProjectMemory();
            const logs = readManagerLogs();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ...mem, logs }));
            return;
        }

        // API: Agents list
        if (req.url === "/api/agents") {
            const list = listAgents();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(list));
            return;
        }

        // Static HTML Serve
        if (req.url === "/" || req.url === "/index.html") {
            res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
            res.end(HTML_CONTENT);
            return;
        }

        // Fallback 404
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    });

    server.listen(port, () => {
        process.stdout.write("================================================================================\n");
        process.stdout.write(`🖥️  AGENT ENDERUN LIVE MONITOR SERVED AT: http://localhost:${port}\n`);
        process.stdout.write("================================================================================\n");
    });

    return server;
}
