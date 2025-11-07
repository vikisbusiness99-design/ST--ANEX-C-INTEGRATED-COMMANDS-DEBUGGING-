# ANEX-C Debug System for SillyTavern

Integrated ANEX C psychology debugging with comprehensive narrative tracking for SillyTavern.

## Features

- **Psychology State Debugging**: Monitor character emotions, resources, goals, relationships, and traumas
- **Slash Command Interface**: Use `/debug` commands to view character state
- **ANEX C Format Support**: Parses ANEX C XML format from character cards

## Installation

### From GitHub (Recommended for Termux)

1. Navigate to your SillyTavern extensions directory:
   ```bash
   cd ~/SillyTavern/public/scripts/extensions/third-party
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/vikisbusiness99-design/ST--ANEX-C-INTEGRATED-COMMANDS-DEBUGGING-.git
   ```

3. Restart SillyTavern or reload extensions

### Manual Installation

1. Download all files from this repository
2. Create a folder in `SillyTavern/public/scripts/extensions/third-party/anex-c-debug/`
3. Place all files in that folder
4. Restart SillyTavern

## Usage

### Slash Commands

Once installed, you can use these commands in the chat:

- `/debug emotions` or `/debug state` - Show emotional state with visual bars
- `/debug resources` - Show resource pools (energy, willpower, etc.)
- `/debug goals` - Show goal priorities
- `/debug relationships` - Show relationship status
- `/debug traumas` - Show trauma catalog
- `/debug all` - Show complete state dump

### Example

```
/debug emotions
```

Output:
```
**EMOTIONS:**
joy         : ████████░░ 80% (base: 50%)
fear        : ██░░░░░░░░ 20% (base: 10%)
anger       : ███░░░░░░░ 30% (base: 15%)
```

## ANEX C Format

This extension expects character cards to use ANEX C format tags:

```xml
<ANEX_C>
  <emotions>
    <e name="joy" base="0.5" cur="0.8" decay="0.1"/>
    <e name="fear" base="0.1" cur="0.2" decay="0.15"/>
  </emotions>
  
  <resources>
    <r name="energy" cur="75" max="100"/>
    <r name="willpower" cur="50" max="100"/>
  </resources>
  
  <goals>
    <goal name="survive" priority="10" markers="safety,threat"/>
    <goal name="connect" priority="7" markers="intimacy,trust"/>
  </goals>
</ANEX_C>
```

## Configuration

Go to **Extensions → ANEX-C Debug System** to enable/disable the debug commands.

## Requirements

- SillyTavern 1.10.0 or higher
- Character cards using ANEX C format

## Version History

- **2.0.0** - Initial SillyTavern extension release
  - Converted from worker script format
  - Added slash command support
  - Added settings UI

## Credits

Based on the ANEX C psychology system. Converted to SillyTavern extension format.

## License

MIT License - Feel free to modify and distribute!
