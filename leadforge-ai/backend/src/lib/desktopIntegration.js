import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

/**
 * Desktop Application Integration
 * Connects LeadForge AI to desktop apps like VS Code, IDEs, browsers, etc.
 */

export const desktopApps = {
  vscode: {
    name: "Visual Studio Code",
    command: "code",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in VS Code",
    icon: "💻",
  },
  "vscode-insiders": {
    name: "VS Code Insiders",
    command: "code-insiders",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in VS Code Insiders",
    icon: "💻",
  },
  cursor: {
    name: "Cursor",
    command: "cursor",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in Cursor AI IDE",
    icon: "🖱️",
  },
  webstorm: {
    name: "WebStorm",
    command: "webstorm",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in WebStorm",
    icon: "🌊",
  },
  sublime: {
    name: "Sublime Text",
    command: "subl",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in Sublime Text",
    icon: "📝",
  },
  atom: {
    name: "Atom",
    command: "atom",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in Atom",
    icon: "⚛️",
  },
  notepad: {
    name: "Notepad++",
    command: "notepad++",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open project in Notepad++",
    icon: "📄",
  },
  chrome: {
    name: "Google Chrome",
    command: process.platform === "win32" ? "start chrome" : process.platform === "darwin" ? "open -a 'Google Chrome'" : "google-chrome",
    args: (url) => [`"${url}"`],
    description: "Open in Chrome browser",
    icon: "🌐",
  },
  edge: {
    name: "Microsoft Edge",
    command: process.platform === "win32" ? "start msedge" : "microsoft-edge",
    args: (url) => [`"${url}"`],
    description: "Open in Edge browser",
    icon: "🌐",
  },
  firefox: {
    name: "Mozilla Firefox",
    command: process.platform === "win32" ? "start firefox" : "firefox",
    args: (url) => [`"${url}"`],
    description: "Open in Firefox browser",
    icon: "🦊",
  },
  explorer: {
    name: "File Explorer",
    command: process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open folder in file explorer",
    icon: "📁",
  },
  terminal: {
    name: "Terminal",
    command: process.platform === "win32" ? "cmd /c start cmd /k cd /d" : process.platform === "darwin" ? "open -a Terminal" : "gnome-terminal --working-directory=",
    args: (projectPath) => [`"${projectPath}"`],
    description: "Open terminal in project folder",
    icon: "⌨️",
  },
};

/**
 * Check if an app is installed on the system
 */
export async function checkAppInstalled(appId) {
  const app = desktopApps[appId];
  if (!app) return false;

  try {
    const checkCommand = process.platform === "win32" 
      ? `where ${app.command.split(" ")[0]}`
      : `which ${app.command.split(" ")[0]}`;
    
    await execAsync(checkCommand);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of installed desktop apps
 */
export async function getInstalledApps() {
  const installedApps = [];

  for (const [appId, app] of Object.entries(desktopApps)) {
    const installed = await checkAppInstalled(appId);
    installedApps.push({
      id: appId,
      ...app,
      installed,
    });
  }

  return installedApps;
}

/**
 * Open a project in a specific desktop app
 */
export async function openInApp(appId, projectPath) {
  const app = desktopApps[appId];
  if (!app) {
    throw new Error(`Unknown app: ${appId}`);
  }

  const isInstalled = await checkAppInstalled(appId);
  if (!isInstalled) {
    throw new Error(`${app.name} is not installed or not in PATH`);
  }

  const args = app.args(projectPath);
  const fullCommand = `${app.command} ${args.join(" ")}`;

  try {
    await execAsync(fullCommand);
    return {
      success: true,
      app: app.name,
      path: projectPath,
    };
  } catch (error) {
    throw new Error(`Failed to open ${app.name}: ${error.message}`);
  }
}

/**
 * Open project in multiple apps at once
 */
export async function openInMultipleApps(appIds, projectPath) {
  const results = [];

  for (const appId of appIds) {
    try {
      const result = await openInApp(appId, projectPath);
      results.push({ appId, ...result });
    } catch (error) {
      results.push({ appId, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Create a .code-workspace file for VS Code
 */
export async function createVSCodeWorkspace(projectPath, projectName) {
  const workspaceConfig = {
    folders: [
      {
        path: ".",
      },
    ],
    settings: {
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "typescript.tsdk": "node_modules/typescript/lib",
    },
    extensions: {
      recommendations: [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma",
      ],
    },
  };

  const workspacePath = path.join(projectPath, `${projectName}.code-workspace`);
  await fs.writeFile(workspacePath, JSON.stringify(workspaceConfig, null, 2));

  return workspacePath;
}

/**
 * Open a URL in default browser
 */
export async function openInBrowser(url) {
  const command = process.platform === "win32"
    ? `start "" "${url}"`
    : process.platform === "darwin"
    ? `open "${url}"`
    : `xdg-open "${url}"`;

  try {
    await execAsync(command);
    return { success: true, url };
  } catch (error) {
    throw new Error(`Failed to open browser: ${error.message}`);
  }
}

/**
 * Start local dev server for a Next.js project
 */
export async function startDevServer(projectPath, port = 3000) {
  const command = `cd "${projectPath}" && npm install && npm run dev -- -p ${port}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ success: true, port, stdout, stderr });
      }
    });
  });
}
