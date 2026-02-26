#!/usr/bin/env node
/**
 * Gemini CLI - Startup Skill Enforcer Installer
 * Run this script with: node install-hook.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const isLocal = process.argv.includes('--local');
const baseDir = isLocal ? process.cwd() : os.homedir();
const geminiDir = path.join(baseDir, '.gemini');
const hooksDir = path.join(geminiDir, 'hooks');
const settingsFile = path.join(geminiDir, 'settings.json');
const hookFile = path.join(hooksDir, 'force-startup-skill.js');

console.log(`🛠️  Installing Gemini CLI Startup Skill Hook (${isLocal ? 'Local' : 'Global'} at ${geminiDir})...`);

// 1. Create hooks directory
if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

// 2. Write the robust hook script
const hookScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function main() {
  let rawData = '';
  try {
    rawData = fs.readFileSync(0, 'utf-8');
  } catch (e) {
    process.stdout.write(JSON.stringify({}));
    return;
  }
  
  if (!rawData) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let input;
  try {
    input = JSON.parse(rawData);
  } catch (e) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const sessionId = input.session_id;
  if (!sessionId) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const tmpDir = path.join(process.env.HOME || process.env.USERPROFILE, '.gemini', 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Session-based lock file ensures this only runs on turn 1
  const markerPath = path.join(tmpDir, \`startup_skill_locked_\${sessionId}.lock\`);

  if (!fs.existsSync(markerPath)) {
    try {
      fs.writeFileSync(markerPath, 'activated', 'utf8');
    } catch(e) {}

    // Force the agent to use activate_skill
    const output = {
      hookSpecificOutput: {
        toolConfig: {
          mode: "ANY",
          allowedFunctionNames: ["activate_skill"]
        }
      }
    };
    process.stdout.write(JSON.stringify(output));
  } else {
    // Lock exists, let the model act normally
    process.stdout.write(JSON.stringify({}));
  }
}

main();
`;

fs.writeFileSync(hookFile, hookScript, { mode: 0o755 });
console.log('✅ Created hook logic at: ' + hookFile);

// 3. Safely update settings.json
let settings = {};
if (fs.existsSync(settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (e) {
    console.error('❌ Could not parse ~/.gemini/settings.json. Please ensure it is valid JSON.');
    process.exit(1);
  }
}

if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.BeforeToolSelection) settings.hooks.BeforeToolSelection = [];

const hookConfig = {
  matcher: "*",
  hooks: [
    {
      name: "force-startup-skill",
      type: "command",
      command: `node ${hookFile}`
    }
  ]
};

// Check if already installed to prevent duplicates
const isInstalled = settings.hooks.BeforeToolSelection.some(
  h => h.hooks && h.hooks.some(sub => sub.name === 'force-startup-skill')
);

if (!isInstalled) {
  settings.hooks.BeforeToolSelection.push(hookConfig);
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
  console.log(`✅ Registered hook in ${settingsFile}`);
} else {
  console.log(`⚡ Hook was already registered in ${settingsFile}`);
}

console.log('🎉 Installation complete! Start a new Gemini CLI session and watch it load your skills immediately.');
