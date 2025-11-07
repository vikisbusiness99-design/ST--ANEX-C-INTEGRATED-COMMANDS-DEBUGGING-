// ANEX C Unified Psych V4 - Works with 1 style or 100
class ANEXC {
  constructor() {
    this.base = this.getBaseANEXC();
    this.styles = {};
    this.active = 'base';
    this.states = {};
    this.state = null;
    this.narrative = {};
  }

  getBaseANEXC() {
    return {
      emotions: {
        joy: { baseline: 0.14, cur: 0.14, decay: 0.10 },
        anger: { baseline: 0.09, cur: 0.09, decay: 0.05 },
        sadness: { baseline: 0.23, cur: 0.23, decay: 0.03 },
        fear: { baseline: 0.18, cur: 0.18, decay: 0.10 },
        anxiety: { baseline: 0.23, cur: 0.23, decay: 0.15 },
        pride: { baseline: 0.10, cur: 0.10, decay: 0.08 },
        shame: { baseline: 0.05, cur: 0.05, decay: 0.07 }
      },
      goals: {
        G_SeekConnection: { priority: 8 },
        G_AvoidVulnerability: { priority: 8 },
        G_PursuePride: { priority: 6 },
        G_Atonement: { priority: 7 }
      },
      relationships: { trust: 0.4, intimacy: 0.2 }
    };
  }

  init() {
    eventSource.on('chatMessageProcessed', msg => this.handle(msg));
    eventSource.on('generationComplete', gen => this.fix(gen));
    eventSource.on('extensionLoaded', () => this.start());
  }

  start() {
    const ctx = getContext();
    ctx.state.anex_c_psych = ctx.state.anex_c_psych || JSON.parse(JSON.stringify(this.base));
    ctx.state.anex_narrative = ctx.state.anex_narrative || { scenes: [], timeline: [] };
    this.state = ctx.state.anex_c_psych;
    this.narrative = ctx.state.anex_narrative;
    this.active = ctx.state.anex_style || 'base';
    this.loadStyles();
  }

  loadStyles() {
    // Auto-load all .json in /styles/
    // In ST: use file system
    // For now: just grrm.json works
    setTimeout(() => {
      if (window.anexStyles) {
        this.styles = window.anexStyles;
        console.log('Styles loaded:', Object.keys(this.styles));
      }
    }, 1000);
  }

  handle(msg) {
    if (!msg.isUser) return;
    const text = msg.text.trim();
    if (text.startsWith('!summon_style')) {
      const name = text.split(' ')[1]?.toLowerCase() || 'base';
      this.switch(name);
      insertAtChatEnd(`Style: **${name}** loaded.`, false);
      msg.delete();
      return;
    }
    if (text.startsWith('!debug') || text.startsWith('!summon_')) {
      insertAtChatEnd(this.runCommand(text), false);
      msg.delete();
      return;
    }
    this.updateNarrative(msg);
  }

  switch(name) {
    this.states[this.active] = JSON.parse(JSON.stringify(this.state));
    const style = this.styles[name] || this.base;
    this.state = this.states[name] || this.merge(this.base, style);
    this.active = name;
    getContext().state.anex_c_psych = this.state;
    getContext().state.anex_style = name;
  }

  merge(a, b) {
    const c = JSON.parse(JSON.stringify(a));
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
        c[k] = c[k] || {};
        for (const sk in b[k]) c[k][sk] = b[k][sk];
      } else {
        c[k] = b[k];
      }
    }
    return c;
  }

  runCommand(text) {
    // Full !debug + !summon_ logic here (from original)
    // Simplified for now
    if (text.includes('!debug state')) {
      let out = '**EMOTIONS:**\n';
      for (const [k, e] of Object.entries(this.state.emotions)) {
        out += `  ${k}: ${e.cur.toFixed(2)}\n`;
      }
      return out;
    }
    return 'Command not ready yet. Use !summon_style grrm';
  }

  updateNarrative(msg) {
    this.narrative.timeline.push({
      time: new Date().toISOString(),
      text: msg.text.slice(0, 50)
    });
    if (this.narrative.timeline.length > 20) this.narrative.timeline.shift();
  }

  fix(gen) {
    if (gen.text.startsWith('System:')) gen.text = gen.text.replace('System:', '{{char}}:');
  }
}

const anex = new ANEXC();
anex.init();

// Auto-load styles from /styles/*.json
setTimeout(() => {
  window.anexStyles = window.anexStyles || {};
  fetch('/extensions/anex-c-unified-ext/styles/grrm.json')
    .then(r => r.json())
    .then(data => {
      window.anexStyles['grrm'] = data;
      console.log('GRRM style loaded');
    })
    .catch(() => {});
}, 500);
