/**
 * ANEX C Integrated Command & Debug System v2.0
 * SillyTavern Extension Version
 */

import { saveSettingsDebounced } from "../../../script.js";
import { extension_settings } from "../../extensions.js";
import { SlashCommandParser } from "../../slash-commands/SlashCommandParser.js";
import { SlashCommand } from "../../slash-commands/SlashCommand.js";
import { ARGUMENT_TYPE, SlashCommandArgument } from "../../slash-commands/SlashCommandArgument.js";

const MODULE_NAME = 'anex-c-debug';

// Default settings
const defaultSettings = {
    enabled: true,
    autoTrack: true,
    debugVerbosity: 'normal'
};

// Initialize settings
function loadSettings() {
    extension_settings[MODULE_NAME] = extension_settings[MODULE_NAME] || {};
    if (Object.keys(extension_settings[MODULE_NAME]).length === 0) {
        Object.assign(extension_settings[MODULE_NAME], defaultSettings);
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
    const goalRegex = /<goal name="(\w+)" priority="([\d.]+)"[^>]*markers="([^"]+)"\/>/g;
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
    const relationshipRegex = /<character id="([^"]+)" trust="([\d.]+)" intimacy="([\d.]+)" history="([\d.]+)"[^>]*\/>/g;
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

// ===== HELPER FUNCTION =====
function getANEXCData() {
    // Get character data from SillyTavern context
    const context = SillyTavern.getContext();
    const char = context.characters[context.characterId];
    
    if (!char) {
        return { found: false, text: "" };
    }
    
    const systemPrompt = char.data?.system_prompt || "";
    const description = char.description || "";
    const fullText = systemPrompt + "\n" + description;
    
    return {
        found: fullText.includes("<ANEX_C>"),
        text: fullText
    };
}

// ===== DEBUG COMMANDS =====
function debugEmotions() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    const emotions = parseEmotions(data.text);
    let output = "**EMOTIONS:**\n";
    
    for (const [name, values] of Object.entries(emotions)) {
        const percentage = (values.current * 100).toFixed(0);
        const bar = "█".repeat(Math.floor(values.current * 10)) + "░".repeat(10 - Math.floor(values.current * 10));
        output += `${name.padEnd(12)}: ${bar} ${percentage}% (base: ${(values.base * 100).toFixed(0)}%)\n`;
    }
    
    return output;
}

function debugResources() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    const resources = parseResources(data.text);
    let output = "**RESOURCES:**\n";
    
    for (const [name, values] of Object.entries(resources)) {
        const percentage = ((values.current / values.max) * 100).toFixed(0);
        const bar = "█".repeat(Math.floor((values.current / values.max) * 10)) + "░".repeat(10 - Math.floor((values.current / values.max) * 10));
        output += `${name.padEnd(12)}: ${bar} ${values.current}/${values.max} (${percentage}%)\n`;
    }
    
    return output;
}

function debugGoals() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    const goals = parseGoals(data.text);
    let output = "**GOALS (by priority):**\n";
    
    goals.sort((a, b) => b.priority - a.priority);
    goals.forEach(goal => {
        const priorityBar = "█".repeat(Math.floor(goal.priority)) + "░".repeat(10 - Math.floor(goal.priority));
        output += `\n${goal.name}:\n`;
        output += `  Priority: ${priorityBar} ${goal.priority}/10\n`;
        output += `  Markers: ${goal.markers}\n`;
    });
    
    return output;
}

function debugRelationships() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    const relationship = parseRelationships(data.text);
    if (!relationship) {
        return "No relationship data found.";
    }
    
    let output = "**RELATIONSHIP STATUS:**\n";
    output += `Target: ${relationship.id}\n`;
    output += `Trust: ${(relationship.trust * 100).toFixed(0)}%\n`;
    output += `Intimacy: ${(relationship.intimacy * 100).toFixed(0)}%\n`;
    output += `Shared History: ${relationship.history} interactions\n`;
    
    return output;
}

function debugTraumas() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    const traumas = parseTraumas(data.text);
    let output = "**TRAUMA CATALOG:**\n";
    
    if (traumas.length === 0) {
        output += "No traumas configured.\n";
    } else {
        traumas.forEach(trauma => {
            const severity = (trauma.severity * 100).toFixed(0);
            output += `• ${trauma.type}: ${severity}% severity\n`;
        });
    }
    
    return output;
}

function debugAll() {
    const data = getANEXCData();
    if (!data.found) {
        return "⚠️ ANEX C data not found in character context.";
    }
    
    let output = "**FULL STATE DUMP**\n\n";
    
    output += "📊 EMOTIONS:\n";
    const emotions = parseEmotions(data.text);
    for (const [name, values] of Object.entries(emotions)) {
        output += `  ${name}: ${(values.current * 100).toFixed(0)}%\n`;
    }
    
    output += "\n⚡ RESOURCES:\n";
    const resources = parseResources(data.text);
    for (const [name, values] of Object.entries(resources)) {
        output += `  ${name}: ${values.current}/${values.max}\n`;
    }
    
    output += "\n🎯 TOP GOALS:\n";
    const goals = parseGoals(data.text);
    goals.sort((a, b) => b.priority - a.priority).slice(0, 3).forEach(goal => {
        output += `  ${goal.name} (${goal.priority})\n`;
    });
    
    output += "\n💔 TRAUMAS:\n";
    const traumas = parseTraumas(data.text);
    traumas.forEach(trauma => {
        output += `  ${trauma.type} (${(trauma.severity * 100).toFixed(0)}%)\n`;
    });
    
    return output;
}

// ===== REGISTER SLASH COMMANDS =====
function registerSlashCommands() {
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'debug',
        callback: (args) => {
            const subcommand = args.subcommand || 'emotions';
            
            switch (subcommand) {
                case 'emotions':
                case 'state':
                    return debugEmotions();
                case 'resources':
                    return debugResources();
                case 'goals':
                    return debugGoals();
                case 'relationships':
                    return debugRelationships();
                case 'traumas':
                    return debugTraumas();
                case 'all':
                    return debugAll();
                default:
                    return "Unknown debug command. Use: emotions, resources, goals, relationships, traumas, or all";
            }
        },
        namedArgumentList: [
            new SlashCommandArgument(
                'subcommand',
                ARGUMENT_TYPE.STRING,
                false,
                false,
                'emotions',
                ['emotions', 'state', 'resources', 'goals', 'relationships', 'traumas', 'all']
            )
        ],
        helpString: 'Debug ANEX C character state. Usage: /debug [emotions|resources|goals|relationships|traumas|all]',
    }));
    
    console.log('[ANEX-C] Slash commands registered');
}

// ===== INITIALIZATION =====
jQuery(async () => {
    loadSettings();
    registerSlashCommands();
    
    console.log('[ANEX-C Debug System] Extension loaded');
    
    // Add settings UI
    const settingsHtml = `
        <div class="anex-c-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>ANEX-C Debug System</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label class="checkbox_label">
                        <input id="anex-c-enabled" type="checkbox" />
                        <span>Enable Debug Commands</span>
                    </label>
                    <small>Use /debug [command] to view character state</small>
                </div>
            </div>
        </div>
    `;
    
    $('#extensions_settings2').append(settingsHtml);
    
    $('#anex-c-enabled').prop('checked', extension_settings[MODULE_NAME].enabled).on('change', function() {
        extension_settings[MODULE_NAME].enabled = $(this).prop('checked');
        saveSettingsDebounced();
    });
});
