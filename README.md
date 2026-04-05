# KB1 Flash Tool

Desktop firmware updater for KB1 MIDI controller. Flash firmware via USB with automatic battery calibration preservation.

## Features

- **Firmware Flashing** - Update KB1 firmware via USB
- **NVS Preservation** - Automatically backs up and restores battery calibration
- **GitHub Integration** - Auto-download latest firmware releases
- **Local Files** - Drag & drop custom .bin files
- **Serial Monitor** - View device boot logs and debug output

## Browser Requirements

This tool requires **Chrome, Edge, or Opera** on **desktop** (Windows, macOS, Linux).

- Web Serial API support required
- HTTPS or localhost required
- Mobile browsers **not supported**

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Open the tool** in Chrome/Edge/Opera
2. **Connect KB1** via USB-C cable
3. **Select firmware source:**
   - Click a GitHub release to auto-download
   - Or drag/drop a local `.bin` file
4. **Grant USB permission** when prompted
5. **Wait for flash** to complete (automatic NVS backup/restore)
6. **Device restarts** automatically

## Architecture

```
kb1-flash/
├── src/
│   ├── main.ts              # Entry point, UI logic
│   ├── flasher.ts           # Firmware flashing (esptool-js wrapper)
│   ├── github.ts            # GitHub releases API
│   ├── serial-monitor.ts    # Serial port reader
│   ├── types.ts             # TypeScript definitions
│   └── style.css            # KB1 brand styles
├── index.html               # Main UI
├── package.json             # Dependencies
├── vite.config.ts           # Build configuration
└── tsconfig.json            # TypeScript config
```

## Technology Stack

- **Vite** - Build tool
- **TypeScript** - Type safety
- **esptool-js** - ESP32 flashing library
- **Web Serial API** - USB communication
- **GitHub API** - Release fetching

## Firmware Format

Expects **combined firmware binary** with:
- Bootloader @ 0x0
- Partition table @ 0x8000
- NVS partition @ 0x9000 (preserved)
- Firmware @ 0x10000

## NVS Preservation

The tool automatically preserves the NVS partition (0x9000, 20KB) which contains:
- Battery percentage
- Active time counters (BLE on/off, sleep, discharge)
- Calibration timestamp
- User settings

This ensures battery calibration survives firmware updates.

## Deployment

### GitHub Pages

```bash
# Build
npm run build

# Deploy dist/ folder to GitHub Pages
# Configure base in vite.config.ts if using subdirectory
```

### Custom Domain

1. Build for production
2. Upload `dist/` to web server
3. Ensure HTTPS (required for Web Serial API)
4. Point DNS to server

## Serial Monitor

View real-time output from KB1:
- Boot messages
- Firmware version
- Debug logs
- Error messages

Useful for troubleshooting flash issues or verifying successful update.

## Troubleshooting

### "Browser Not Supported"
- Use Chrome, Edge, or Opera on desktop
- Ensure you're on HTTPS or localhost
- Mobile browsers don't support Web Serial API

### "Failed to connect USB"
- Make sure KB1 is connected via USB
- Try different USB cable
- Check USB port is working
- On macOS: Grant permission in System Preferences

### "No firmware binary found"
- Ensure release has .bin file
- Check GitHub release assets
- Try uploading local .bin file instead

### Flash fails during update
- Don't disconnect USB during flash
- Try different USB port
- Ensure battery has charge
- Check serial monitor for errors

## License

MIT License - See LICENSE file

## Links

- [KB1 Website](https://kb1.pocketmidi.com)
- [KB1 Config App](https://github.com/pocket-midi/KB1-config)
- [KB1 Firmware](https://github.com/pocket-midi/KB1-firmware)
- [Pocket MIDI](https://pocketmidi.com)
