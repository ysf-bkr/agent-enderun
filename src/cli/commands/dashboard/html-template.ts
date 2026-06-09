/**
 * Agent Enderun — Live Dashboard HTML Template
 */
export const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Enderun — Live Dashboard</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #0b0c10;
            color: #c5c6c7;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Gradient background glows */
        body::before {
            content: '';
            position: absolute;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%);
            top: 10%;
            left: 5%;
            z-index: -1;
            pointer-events: none;
        }

        body::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(0,0,0,0) 70%);
            bottom: 10%;
            right: 5%;
            z-index: -1;
            pointer-events: none;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(15, 17, 23, 0.7);
            backdrop-filter: blur(12px);
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #fff;
            font-size: 1.1rem;
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            background: linear-gradient(to right, #ffffff, #a5b4fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .system-status {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            font-size: 0.875rem;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 0.35rem 0.75rem;
            border-radius: 9999px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            font-weight: 500;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 8px #10b981;
            animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px #10b981; }
            100% { transform: scale(0.9); opacity: 0.6; }
        }

        .main-layout {
            display: flex;
            flex: 1;
            padding: 1.5rem;
            gap: 1.5rem;
            height: calc(100vh - 80px);
            overflow: hidden;
        }

        /* Card panels */
        .panel {
            background: rgba(18, 20, 29, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            backdrop-filter: blur(16px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .panel-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 0.95rem;
            color: #ffffff;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        /* Left Panel - Agents list */
        .agents-panel {
            width: 300px;
            flex-shrink: 0;
        }

        .agent-list {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            overflow-y: auto;
            flex: 1;
        }

        .agent-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.25s ease;
        }

        .agent-card:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(139, 92, 246, 0.3);
            transform: translateX(4px);
        }

        .agent-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .agent-name {
            font-weight: 600;
            color: #e2e8f0;
            font-size: 0.9rem;
        }

        .agent-role {
            font-size: 0.75rem;
            color: #64748b;
        }

        .agent-state {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
        }

        .state-active { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .state-working { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .state-idle { color: #94a3b8; background: rgba(148, 163, 184, 0.1); }

        /* Middle Panel - Terminal Screen */
        .terminal-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .terminal-header-controls {
            display: flex;
            gap: 0.4rem;
        }

        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .dot-red { background-color: #ef4444; }
        .dot-yellow { background-color: #f59e0b; }
        .dot-green { background-color: #10b981; }

        .terminal-screen {
            flex: 1;
            background: #050508;
            font-family: 'Fira Code', monospace;
            padding: 1.25rem;
            overflow-y: auto;
            font-size: 0.85rem;
            line-height: 1.6;
            color: #a7f3d0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .terminal-line {
            display: flex;
            gap: 0.5rem;
            align-items: flex-start;
            border-left: 2px solid transparent;
            padding-left: 0.5rem;
        }

        .line-timestamp {
            color: #64748b;
            flex-shrink: 0;
            font-size: 0.75rem;
        }

        .line-trace {
            color: #8b5cf6;
            font-weight: 600;
            flex-shrink: 0;
            font-size: 0.75rem;
        }

        .line-agent {
            color: #06b6d4;
            font-weight: 600;
            flex-shrink: 0;
        }

        .line-content {
            color: #e2e8f0;
            word-break: break-all;
        }

        .line-status-success {
            color: #10b981;
            font-weight: bold;
        }

        .line-status-failure {
            color: #ef4444;
            font-weight: bold;
        }

        /* Right Panel - Tasks & Metadata */
        .meta-panel {
            width: 320px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            background: transparent;
            border: none;
            box-shadow: none;
            overflow: visible;
        }

        .meta-card {
            background: rgba(18, 20, 29, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            backdrop-filter: blur(16px);
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .meta-card-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 0.5rem;
        }

        /* Task layout */
        .task-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .task-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .task-meta-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
        }

        .task-title {
            font-size: 0.825rem;
            font-weight: 500;
            color: #e2e8f0;
        }

        .task-agent-badge {
            color: #06b6d4;
            font-weight: 600;
        }

        .task-status-badge {
            font-size: 0.7rem;
            font-weight: bold;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .status-inprogress { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .status-pending { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .status-completed { color: #10b981; background: rgba(16, 185, 129, 0.1); }

        /* Memory metrics */
        .metric-row {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .metric-label-container {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .metric-bar-bg {
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 9999px;
            overflow: hidden;
        }

        .metric-bar-fill {
            height: 100%;
            background: linear-gradient(to right, #8b5cf6, #06b6d4);
            border-radius: 9999px;
            width: 0%;
            transition: width 0.5s ease;
        }

        /* Scrollbar styles */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }

    </style>
</head>
<body>

    <header>
        <div class="logo-container">
            <div class="logo-icon">E</div>
            <div class="logo-text">Agent Enderun Live Monitor</div>
        </div>
        <div class="system-status">
            <div>Active Phase: <span id="system-phase" style="color:#ffffff; font-weight:600;">PHASE_0</span></div>
            <div>Trace ID: <span id="system-trace" style="color:#8b5cf6; font-weight:600; font-family:'Fira Code',monospace;">N/A</span></div>
            <div class="status-badge">
                <span class="status-dot"></span>
                <span>Live Connection</span>
            </div>
        </div>
    </header>

    <div class="main-layout">
        
        <!-- Left Panel: Agents -->
        <div class="panel agents-panel">
            <div class="panel-header">
                <span>Army Agents</span>
                <span id="agents-online-count" style="color: #10b981; font-size: 0.8rem;">12 Online</span>
            </div>
            <div class="agent-list" id="agent-list-container">
                <!-- Dynamic Agents -->
                <div style="color:#64748b; font-size:0.875rem; text-align:center; padding:2rem;">Loading...</div>
            </div>
        </div>

        <!-- Middle Panel: Terminal -->
        <div class="panel terminal-panel">
            <div class="panel-header">
                <span>Live Orchestration Logs</span>
                <div class="terminal-header-controls">
                    <span class="dot dot-red"></span>
                    <span class="dot dot-yellow"></span>
                    <span class="dot dot-green"></span>
                </div>
            </div>
            <div class="terminal-screen" id="terminal-screen-container">
                <div class="terminal-line">
                    <span class="line-content">> Initializing Agent Enderun orchestrator...</span>
                </div>
            </div>
        </div>

        <!-- Right Panel: Tasks & System Status -->
        <div class="meta-panel">
            
            <!-- Active Tasks -->
            <div class="meta-card">
                <div class="meta-card-title">Active Tasks</div>
                <div class="task-list" id="task-list-container">
                    <div style="color:#64748b; font-size:0.825rem; text-align:center; padding:1rem;">No active tasks</div>
                </div>
            </div>

            <!-- Project Memory State -->
            <div class="meta-card">
                <div class="meta-card-title">Project Memory State</div>
                <div class="metric-row">
                    <div class="metric-label-container">
                        <span>Agent Compliance</span>
                        <span id="metric-compliance">100%</span>
                    </div>
                    <div class="metric-bar-bg">
                        <div class="metric-bar-fill" id="compliance-bar" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric-label-container">
                        <span>Completed Tasks</span>
                        <span id="metric-tasks-done">100%</span>
                    </div>
                    <div class="metric-bar-bg">
                        <div class="metric-bar-fill" id="tasks-done-bar" style="width: 100%; background: linear-gradient(to right, #10b981, #059669);"></div>
                    </div>
                </div>
            </div>

        </div>

    </div>

    <script>
        const API_STATUS = '/api/status';
        const API_AGENTS = '/api/agents';

        // Predefined list of Agent Enderun core agents to ensure we display all 12 correctly
        const CORE_AGENTS = [
            { name: "manager", role: "CTO / Orchestrator", status: "state-active", stateLabel: "Active" },
            { name: "backend", role: "Logic & API Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "frontend", role: "UI & UX Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "database", role: "SQL & Migration Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "quality", role: "QA & Compliance Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "devops", role: "CI/CD & Deploy Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "security", role: "Crypt & RLS Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "explorer", role: "Code Discovery Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "git", role: "Version Control Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "analyst", role: "Specs Verification Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "mobile", role: "Mobile Specialist", status: "state-idle", stateLabel: "Idle" },
            { name: "native", role: "Desktop wrapper Specialist", status: "state-idle", stateLabel: "Idle" }
        ];

        let loadedAgents = [];

        async function fetchAgents() {
            try {
                const res = await fetch(API_AGENTS);
                loadedAgents = await res.json();
                renderAgents();
            } catch (e) {
                console.error("Agents fetch error", e);
                renderAgents(); // Fallback to core agents list
            }
        }

        function renderAgents(activeAgentName = null) {
            const container = document.getElementById('agent-list-container');
            container.innerHTML = '';

            const displayList = CORE_AGENTS.map(core => {
                const found = loadedAgents.find(l => l.name === core.name);
                return {
                    name: core.name,
                    role: found ? found.role : core.role,
                    displayName: found ? found.displayName : core.name.toUpperCase()
                };
            });

            displayList.forEach(agent => {
                let stateClass = 'state-idle';
                let stateLabel = 'Idle';

                if (agent.name === 'manager') {
                    stateClass = 'state-active';
                    stateLabel = 'Active';
                }
                
                if (activeAgentName && agent.name === activeAgentName.replace('@', '').toLowerCase()) {
                    stateClass = 'state-working';
                    stateLabel = 'Working';
                }

                const card = document.createElement('div');
                card.className = 'agent-card';
                card.innerHTML = \`
                    <div class="agent-info">
                        <span class="agent-name">@\${agent.name}</span>
                        <span class="agent-role">\${agent.role}</span>
                    </div>
                    <span class="agent-state \${stateClass}">\${stateLabel}</span>
                \`;
                container.appendChild(card);
            });

            document.getElementById('agents-online-count').innerText = \`\${displayList.length} Online\`;
        }

        let renderedLogTimestamps = new Set();

        async function fetchStatus() {
            try {
                const res = await fetch(API_STATUS);
                const data = await res.json();

                if (data.error) {
                    console.error("API error", data.error);
                    return;
                }

                // Update Header Status
                document.getElementById('system-phase').innerText = data.phase || 'PHASE_0';
                document.getElementById('system-trace').innerText = data.traceId || 'N/A';

                // Update Active Tasks
                const taskContainer = document.getElementById('task-list-container');
                if (data.tasks && data.tasks.length > 0) {
                    taskContainer.innerHTML = '';
                    data.tasks.forEach(task => {
                        const statusClass = task.status.toLowerCase().includes('progress') ? 'status-inprogress' 
                                            : task.status.toLowerCase().includes('pending') ? 'status-pending' 
                                            : 'status-completed';
                        const item = document.createElement('div');
                        item.className = 'task-item';
                        item.innerHTML = \`
                            <div class="task-meta-top">
                                <span class="task-agent-badge">\${task.agent}</span>
                                <span class="task-status-badge \${statusClass}">\${task.status}</span>
                            </div>
                            <span class="task-title">\${task.task}</span>
                        \`;
                        taskContainer.appendChild(item);
                    });
                } else {
                    taskContainer.innerHTML = '<div style="color:#64748b; font-size:0.825rem; text-align:center; padding:1rem;">No active tasks</div>';
                }

                // Update Terminal logs dynamically with manager.json
                const terminal = document.getElementById('terminal-screen-container');
                
                if (data.logs && data.logs.length > 0) {
                    // Filter and append new logs
                    let activeAgent = null;
                    data.logs.forEach(log => {
                        const uniqueKey = log.timestamp + '-' + log.action;
                        if (!renderedLogTimestamps.has(uniqueKey)) {
                            renderedLogTimestamps.add(uniqueKey);
                            
                            const line = document.createElement('div');
                            line.className = 'terminal-line';
                            
                            const cleanTime = new Date(log.timestamp).toLocaleTimeString();
                            const cleanTrace = log.requestId ? log.requestId.slice(0, 8) : 'T-000';
                            
                            const statusColorClass = log.status === 'SUCCESS' ? 'line-status-success' : 'line-status-failure';
                            
                            line.innerHTML = \`
                                <span class="line-timestamp">[\${cleanTime}]</span>
                                <span class="line-trace">[TR-\${cleanTrace}]</span>
                                <span class="line-agent">\${log.agent}:</span>
                                <span class="line-content">\${log.summary} <span class="\${statusColorClass}">[\${log.status}]</span></span>
                            \`;
                            terminal.appendChild(line);
                            terminal.scrollTop = terminal.scrollHeight;
                            
                            activeAgent = log.agent;
                        }
                    });

                    if (activeAgent) {
                        renderAgents(activeAgent);
                    }
                } else if (data.history && data.history.length > 0) {
                    // Fallback to parsed project memory history
                    data.history.forEach(hist => {
                        const uniqueKey = hist.title;
                        if (!renderedLogTimestamps.has(uniqueKey)) {
                            renderedLogTimestamps.add(uniqueKey);
                            
                            const line = document.createElement('div');
                            line.className = 'terminal-line';
                            line.innerHTML = \`
                                <span class="line-timestamp">[MEMORY]</span>
                                <span class="line-agent">✏️ \${hist.title}:</span>
                                <span class="line-content">\${hist.body.join(' ')}</span>
                            \`;
                            terminal.appendChild(line);
                            terminal.scrollTop = terminal.scrollHeight;
                        }
                    });
                }
            } catch (e) {
                console.error("Status fetch error", e);
            }
        }

        // Initialize and Start Polling
        fetchAgents().then(() => {
            fetchStatus();
            setInterval(fetchStatus, 2000);
        });
    </script>
</body>
</html>
`;
