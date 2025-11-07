/**
 * ANEX-C Debug System v2.0
 * Fixed for SillyTavern UI Extensions
 */

const MODULE_NAME = 'anex-c-debug';

// Default settings
const defaultSettings = {
    enabled: true,
    autoTrack: true,
    debugVerbosity: 'normal'
};

// Initialize settings
function loadSettings() {
    const context = SillyTavern.getContext();
    context.extensionSettings[MODULE_NAME] = context.extensionSettings[MODULE_NAME] || {};
    if (Object.keys(context.extensionSettings[MODULE_NAME]).length === 0) {
        Object.assign(context.extensionSettings[MODULE_NAME], defaultSettings);
    }
}

// ===== PARSING FUNCTIONS =====
function parseEmotions(text) {
    const emotions = {};
    const emotionRegex = /<e name="(\w+)" base="([\d.]+)" cur="([\d.]+)" decay="([\d.]+)"\/>/g;
    let match;
    while ((match = emotionRegex.exec(text)) !== null) {
        emotions[match[1]] = {
            base: parseFloat(match[2]),
            current: parseFloat(match[3]),
            decay: parseFloat(match[4])
        };
    }
    return emotions;
}

function parseResources(text) {
    const resources = {};
    const resourceRegex = /<r name="(\w+)" cur="([\d.]+)" max="([\d.]+)"\/>/g;
    let match;
    while ((match = resourceRegex.exec(text)) !== null) {
        resources[match[1]] = {
            current: parseFloat(match[2]),
            max: parseFloat(match[3])
        };
    }
    return resources;
}

function parseGoals(text) {
    const goals = [];
    const goalRegex = /<goal name="([^"]+)" priority="([\d.]+)"[^>]*markers="([^"]*)"\/>/g;
    let match;
    while ((match = goalRegex.exec(text)) !== null) {
        goals.push({
            name: match[1],
            priority: parseFloat(match[2]),
            markers: match[3]
        });
    }
    return goals;
}

function parseRelationships(text) {
    const relationshipRegex = /<character id="([^"]+)" trust="([\d.]+)" intimacy="([\d.]+)" history="([\d.]+)"[^>]*\/>/;
    const match = relationshipRegex.exec(text);
    if (match) {
        return {
            id: match[1],
            trust: parseFloat(match[2]),
            intimacy: parseFloat(match[3]),
            history: parseFloat(match[4])
        };
    }
    return null;
}

function parseTraumas(text) {
    const traumas = [];
    const traumaRegex = /<trauma type="(\w+)" severity="([\d.]+)">/g;
    let match;
    while ((match = traumaRegex.exec(text)) !== null) {
        traumas.push({
            type: match[1],
            severity: parseFloat(match[2])
        });
    }
    return traumas;
}


function getANEXCData() {
    const context = SillyTavern.getContext();
    
    
    const mainPrompt = context.chatMetadata?.main_prompt || "";
    const description = context.characters?.[context.characterId]?.description || "";
    
    const fullText = mainPrompt + "\n" + description;

    return {
        found: fullText.includes("<ANEX_C>"),
        text: fullText
    
    };
}


function debugEmotions() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found in character card.";

    const emotions = parseEmotions(data.text);
    let output = "**EMOTIONS:**\n";
    for (const [name, values] of Object.entries(emotions)) {
        const percentage = Math.round(values.current * 100);
        const filled = Math.floor(values.current * 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        output += `${name.padEnd(12)}: ${bar} ${percentage}% (base: ${Math.round(values.base * 100)}%)\n`;
    }
    return output;
}

function debugResources() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found.";

    const resources = parseResources(data.text);
    let output = "**RESOURCES:**\n";
    for (const [name, values] of Object.entries(resources)) {
        const ratio = values.current / values.max;
        const percentage = Math.round(ratio * 100);
        const filled = Math.floor(ratio * 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        output += `${name.padEnd(12)}: ${bar} ${values.current}/${values.max} (${percentage}%)\n`;
    }
    return output;
}

function debugGoals() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found.";

    const goals = parseGoals(data.text);
    let output = "**GOALS (by priority):**\n";
    goals.sort((a, b) => b.priority - a.priority);
    goals.forEach(goal => {
        const filled = Math.min(Math.floor(goal.priority), 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        output += `\n${goal.name}:\n  Priority: ${bar} ${goal.priority}/10\n  Markers: ${goal.markers}\n`;
    });
    return output;
}

function debugRelationships() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found.";

    const rel = parseRelationships(data.text);
    if (!rel) return "No relationship data found.";
    return `**RELATIONSHIP:**\nTarget: ${rel.id}\nTrust: ${Math.round(rel.trust*100)}%\nIntimacy: ${Math.round(rel.intimacy*100)}%\nHistory: ${rel.history} interactions`;
}

function debugTraumas() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found.";

    const traumas = parseTraumas(data.text);
    if (traumas.length === 0) return "**TRAUMAS:** None";
    return "**TRAUMAS:**\n" + traumas.map(t => `• ${t.type}: ${Math.round(t.severity*100)}%`).join('\n');
}

function debugAll() {
    const data = getANEXCData();
    if (!data.found) return "Warning: ANEX C data not found.";

    return `
**FULL STATE DUMP**

**EMOTIONS:**
${Object.entries(parseEmotions(data.text)).map(([n,v]) => `  ${n}: ${Math.round(v.current*100)}%`).join('\n') || '  (none)'}

**RESOURCES:**
${Object.entries(parseResources(data.text)).map(([n,v]) => `  ${n}: ${v.current}/${v.max}`).join('\n') || '  (none)'}

**TOP GOALS:**
${parseGoals(data.text).sort((a,b)=>b.priority-a.priority).slice(0,3).map(g=>`  ${g.name} (${g.priority})`).join('\n') || '  (none)'}

**TRAUMAS:**
${parseTraumas(data.text).map(t=>`  ${t.type} (${Math.round(t.severity*100)}%)`).join('\n') || '  (none)'}
`.trim();
}

// ===== REGISTER SLASH COMMANDS =====
function registerSlashCommands() {
    const context = SillyTavern.getContext();
    const { SlashCommandParser, SlashCommand, ARGUMENT_TYPE, SlashCommandArgument } = context;

    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'debug',
        callback: (args, value) => {
            const sub = (value || 'emotions').toLowerCase();
            switch (sub) {
                case 'emotions': case 'state': return debugEmotions();
                case 'resources': return debugResources();
                case 'goals': return debugGoals();
                case 'relationships': return debugRelationships();
                case 'traumas': return debugTraumas();
                case 'all': return debugAll();
                default: return "Unknown: use emotions, resources, goals, relationships, traumas, all";
            }
        },
        unnamedArgumentList: [
            new SlashCommandArgument('subcommand', [ARGUMENT_TYPE.STRING], false)
        ],
        helpString: 'Usage: /debug [emotions|resources|goals|relationships|traumas|all]'
    }));
}

// ===== INITIALIZATION =====
jQuery(() => {
    const context = SillyTavern.getContext();
    loadSettings();
    registerSlashCommands();

    const html = `
        <div class="anex-c-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>ANEX-C Debug System</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label><input id="anex-c-enabled" type="checkbox"> Enable /debug commands</label>
                    <small>Use /debug emotions, /debug all, etc.</small>
                </div>
            </div>
        </div>
    `;

    $('#extensions_settings2').append(html);

    $('#anex-c-enabled').prop('checked', context.extensionSettings[MODULE_NAME].enabled)
        .on('change', function() {
            context.extensionSettings[MODULE_NAME].enabled = this.checked;
            context.saveSettingsDebounced();
        });
});
