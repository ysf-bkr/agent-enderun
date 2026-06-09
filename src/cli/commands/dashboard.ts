import { startDashboardServer } from "./dashboard/server.js";

/**
 * Launch the Agent Enderun Visual Monitor.
 */
export async function dashboardCommand(args: string[]) {
    const portArg = args.find(a => a.startsWith("--port="));
    const port = portArg ? parseInt(portArg.split("=")[1]) : 5858;
    
    startDashboardServer(port);
}
