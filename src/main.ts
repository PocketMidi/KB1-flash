/**
 * KB1 Flash Tool - Main Entry Point
 * ESPConnect-inspired layout with sidebar navigation
 */

import { KB1Flasher } from './flasher';
import { downloadFirmware, fetchReleases } from './github';
import { SerialMonitor } from './serial-monitor';
import './style.css';
import type { FirmwareFile, FirmwareRelease, FlashStatus } from './types';

// Initialize
let flasher: KB1Flasher | null = null;
let serialMonitor: SerialMonitor | null = null;
let currentFirmware: FirmwareFile | null = null;
let latestVersion: string = 'v1.6.0'; // Default until loaded from GitHub

// DOM elements - Top Bar
const browserWarning = document.getElementById('browser-warning')!;
const topLogo = document.getElementById('logo') as HTMLImageElement;
const versionDisplay = document.getElementById('version-number')!;
const btnConnect = document.getElementById('connect-btn')!;
const btnDisconnect = document.getElementById('disconnect-btn')!;
const themeToggle = document.getElementById('theme-toggle')!;
const themeIcon = document.getElementById('theme-icon') as HTMLImageElement;

// Connection status
const connectionStatus = document.getElementById('connection-status')!;
const statusMessage = document.getElementById('status-message')!;

// Sidebar navigation
const sidebarButtons = document.querySelectorAll('.sidebar-btn');
const contentSections = document.querySelectorAll('.content-section');

// Flash Tool section
const releasesLoading = document.getElementById('releases-loading')!;
const releasesList = document.getElementById('releases-list')!;
const flashGitHubBtn = document.getElementById('flash-github-btn') as HTMLButtonElement;
const flashLocalBtn = document.getElementById('flash-local-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileDropZone = document.getElementById('file-drop-zone')!;
const fileName = document.getElementById('file-name')!;
// flashProgress element - kept for potential future use (always visible now)
// const flashProgress = document.getElementById('flash-progress')!;
const flashComplete = document.getElementById('flash-complete')!;
const flashError = document.getElementById('flash-error')!;
const progressFill = document.getElementById('progress-fill')!;
const progressPercent = document.getElementById('progress-percent')!;
const progressMessage = document.getElementById('progress-message')!;
const errorMessage = document.getElementById('error-message')!;
const resetBtn = document.getElementById('reset-btn')!;
const retryBtn = document.getElementById('retry-btn')!;
const flashSuccessBadge = document.getElementById('flash-success-badge')!;

// Device Info section
const deviceName = document.getElementById('device-name')!;
const deviceChipType = document.getElementById('device-chip-type')!;
const deviceMac = document.getElementById('device-mac')!;
const deviceFlashSize = document.getElementById('device-flash-size')!;
const deviceLatestFirmware = document.getElementById('device-latest-firmware')!;

// NVS Inspector section
const nvsBatPct = document.getElementById('nvs-bat-pct')!;
const nvsBatBleOnMs = document.getElementById('nvs-bat-ble-on-ms')!;
const nvsBatBleOffMs = document.getElementById('nvs-bat-ble-off-ms')!;
const nvsBatDischMs = document.getElementById('nvs-bat-disch-ms')!;
const nvsBatCalTime = document.getElementById('nvs-bat-cal-time')!;
const nvsIsCharging = document.getElementById('nvs-is-charging')!;
const nvsUsbBoot = document.getElementById('nvs-usb-boot')!;

// Serial Monitor section
const serialConnectBtn = document.getElementById('serial-connect-btn')!;
const serialDisconnectBtn = document.getElementById('serial-disconnect-btn')!;
const serialClearBtn = document.getElementById('serial-clear-btn')!;
const serialOutput = document.getElementById('serial-output')!;
const autoScrollCheckbox = document.getElementById('auto-scroll') as HTMLInputElement;


/**
 * Initialize application
 */
function init(): void {
    console.log('KB1 Flash Tool v1.0.0');

    // Check browser support
    if (!KB1Flasher.isSupported()) {
        browserWarning.classList.remove('hidden');
        return;
    }

    // Setup navigation
    setupSidebarNavigation();

    // Setup theme toggle
    setupThemeToggle();

    // Setup connection buttons
    setupConnectionButtons();

    // Setup file upload
    setupFileUpload();

    // Setup GitHub firmware selection
    setupGitHubFirmwareSelection();

    // Setup local firmware flash button
    setupLocalFirmwareFlash();

    // Initialize progress UI to idle state
    progressMessage.textContent = 'Select a firmware version or upload a .bin file to begin';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';

    // Load GitHub releases and version
    loadGitHubReleases();

    // Setup serial monitor
    setupSerialMonitor();

    // Setup help modal
    setupHelpModal();

    // Setup reset/retry buttons
    resetBtn.addEventListener('click', resetFlash);
    retryBtn.addEventListener('click', resetFlash);

    // Setup clear device data
    setupClearDeviceData();
}

/**
 * Setup sidebar navigation
 */
function setupSidebarNavigation(): void {
    sidebarButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');

            // Update sidebar buttons
            sidebarButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content sections
            contentSections.forEach(s => {
                s.classList.remove('active');
                if (s.id === `section-${section}`) {
                    s.classList.add('active');
                }
            });
        });
    });
}

/**
 * Setup theme toggle
 */
function setupThemeToggle(): void {
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Set initial theme
    html.setAttribute('data-theme', currentTheme);
    updateThemeAssets(currentTheme);

    themeToggle.addEventListener('click', () => {
        const theme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeAssets(theme);
    });
}

/**
 * Update logo and theme icons based on theme
 */
function updateThemeAssets(theme: string): void {
    // Use relative paths that work with Vite's base URL configuration
    if (theme === 'dark') {
        topLogo.src = new URL('../public/PM1.svg', import.meta.url).href;
        themeIcon.src = new URL('../public/lite.svg', import.meta.url).href;
    } else {
        topLogo.src = new URL('../public/PM2.svg', import.meta.url).href;
        themeIcon.src = new URL('../public/dark.svg', import.meta.url).href;
    }
}

/**
 * Setup connection buttons in top bar
 */
function setupConnectionButtons(): void {
    const connectLabel = btnConnect.querySelector('.btn-connect-label') as HTMLElement;
    const connectSpinner = btnConnect.querySelector('.btn-spinner') as HTMLElement;

    function setConnecting(on: boolean): void {
        if (on) {
            btnConnect.classList.add('connecting');
            if (connectLabel) connectLabel.textContent = 'CONNECTING...';
            if (connectSpinner) connectSpinner.style.display = 'block';
        } else {
            btnConnect.classList.remove('connecting');
            if (connectLabel) connectLabel.textContent = 'CONNECT';
            if (connectSpinner) connectSpinner.style.display = '';
        }
    }

    btnConnect.addEventListener('click', async () => {
        try {
            setConnecting(true);

            // Create flasher if not exists
            if (!flasher) {
                flasher = new KB1Flasher();
                flasher.onStatus((status: FlashStatus) => {
                    updateFlashUI(status);
                });
            }

            // Request USB port
            await flasher.requestPort();

            // Connect to device
            await flasher.connectToDevice();

            // Read NVS and load device info (BEFORE reset, while loader is active)
            await loadDeviceInfo();

            // Reset device to boot into firmware mode (so serial monitor works)
            console.log('Resetting device to firmware mode...');
            await flasher.resetToFirmware();

            setConnecting(false);

            // Update UI
            btnConnect.classList.add('hidden');
            btnDisconnect.classList.remove('hidden');

            // Update connection status
            connectionStatus.classList.remove('disconnected');
            connectionStatus.classList.add('connected');
            statusMessage.textContent = 'Connected';
        } catch (error) {
            setConnecting(false);
            console.error('Connection failed:', error);
            const message = error instanceof Error ? error.message : 'Failed to connect to device';
            alert(message);
        }
    });

    btnDisconnect.addEventListener('click', async () => {
        // Reset flasher (it will auto-disconnect when garbage collected)
        flasher = null;

        // Update UI
        btnDisconnect.classList.add('hidden');
        btnConnect.classList.remove('hidden');

        // Update connection status
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
        statusMessage.textContent = 'Not Connected';

        // Clear device info
        clearDeviceInfo();

        // Reset flash UI
        resetFlash();
    });
}

/**
 * Load device information (chip type, MAC, firmware version, etc.)
 */
async function loadDeviceInfo(): Promise<void> {
    try {
        if (!flasher) return;

        // TODO: Implement actual device info reading via esptool-js
        // For now, use placeholders

        deviceName.textContent = 'KB1';
        deviceChipType.textContent = 'ESP32-S3';
        deviceMac.textContent = 'AA:BB:CC:DD:EE:FF';
        deviceFlashSize.textContent = '8 MB';
        deviceLatestFirmware.textContent = latestVersion;

        // Try to read current NVS data from device (non-fatal if fails)
        try {
            await flasher.readNVS();
            await loadNVSData();
        } catch (error) {
            console.warn('Could not read NVS data on initial connect:', error);
            console.log('NVS data will be available during flash process');
        }
    } catch (error) {
        console.error('Failed to load device info:', error);
    }
}

/**
 * Clear device information
 */
function clearDeviceInfo(): void {
    deviceName.textContent = '-';
    deviceChipType.textContent = 'N/A';
    deviceMac.textContent = 'N/A';
    deviceFlashSize.textContent = 'N/A';
    deviceLatestFirmware.textContent = 'N/A';

    // Clear NVS data
    nvsBatPct.textContent = 'N/A';
    nvsBatBleOnMs.textContent = 'N/A';
    nvsBatBleOffMs.textContent = 'N/A';
    nvsBatDischMs.textContent = 'N/A';
    nvsBatCalTime.textContent = 'N/A';
    nvsIsCharging.textContent = 'N/A';
    nvsUsbBoot.textContent = 'N/A';
}

/**
 * Load NVS data (battery calibration)
 */
async function loadNVSData(): Promise<void> {
    try {
        if (!flasher) {
            console.warn('No flasher instance');
            return;
        }

        // Get NVS backup from flasher
        const nvsData = flasher.getNVSBackup();
        if (!nvsData) {
            console.warn('No NVS backup available');
            return;
        }

        console.log(`Loading NVS data: ${nvsData.length} bytes`);

        // Parse NVS data
        const { parseNVSBatteryData } = await import('./nvs-parser');
        const batteryData = parseNVSBatteryData(nvsData);

        console.log('Battery data parsed:', batteryData);

        // Update UI with parsed values
        nvsBatPct.textContent = batteryData.percentage !== null ? `${batteryData.percentage}%` : 'N/A';

        nvsBatBleOnMs.textContent = batteryData.bleOnTimeMs !== null
            ? `${Math.floor(batteryData.bleOnTimeMs / 1000)}s`
            : 'N/A';

        nvsBatBleOffMs.textContent = batteryData.bleOffTimeMs !== null
            ? `${Math.floor(batteryData.bleOffTimeMs / 1000)}s`
            : 'N/A';

        nvsBatDischMs.textContent = batteryData.dischargeTimeMs !== null
            ? `${Math.floor(batteryData.dischargeTimeMs / 1000)}s`
            : 'N/A';

        nvsBatCalTime.textContent = batteryData.calibrationTime !== null
            ? batteryData.calibrationTime.toString()
            : 'N/A';

        nvsIsCharging.textContent = batteryData.isChargingMode !== null
            ? (batteryData.isChargingMode ? '1' : '0')
            : 'N/A';

        nvsUsbBoot.textContent = batteryData.usbAtBoot !== null
            ? (batteryData.usbAtBoot ? '1' : '0')
            : 'N/A';
    } catch (error) {
        console.error('Failed to load NVS data:', error);
    }
}


/**
 * Setup file upload (drag & drop + click)
 */
function setupFileUpload(): void {
    // File input change handler (label's 'for' attribute handles click)
    fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file && file.name.endsWith('.bin')) {
            loadLocalFirmware(file);
        }
    });

    // Drag & drop
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('drag-over');
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('drag-over');
    });

    fileDropZone.addEventListener('drop', (e) => {
        const dragEvent = e as DragEvent;
        dragEvent.preventDefault();
        fileDropZone.classList.remove('drag-over');

        const file = dragEvent.dataTransfer?.files[0];

        if (file && file.name.endsWith('.bin')) {
            loadLocalFirmware(file);
        }
    });
}

/**
 * Setup GitHub firmware selection
 */
function setupGitHubFirmwareSelection(): void {
    // Flash selected version
    flashGitHubBtn.addEventListener('click', async () => {
        const selectedRelease = (window as any).selectedRelease;
        if (!selectedRelease) {
            console.error('No release selected');
            return;
        }

        await loadGitHubFirmware(selectedRelease);
    });
}

/**
 * Load local firmware file
 */
async function loadLocalFirmware(file: File): Promise<void> {
    try {
        fileName.textContent = `Loading ${file.name}...`;

        const arrayBuffer = await file.arrayBuffer();

        currentFirmware = {
            name: file.name,
            data: arrayBuffer,
            source: 'local',
        };

        console.log(`Loaded local firmware: ${file.name} (${arrayBuffer.byteLength} bytes)`);
        fileName.textContent = `${file.name} (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB) - Ready to flash`;

        // Show flash button
        flashLocalBtn.style.display = 'block';
        flashLocalBtn.disabled = false;
    } catch (error) {
        console.error('Failed to load firmware file:', error);
        fileName.textContent = 'Drop .bin file or click to browse';
        flashLocalBtn.style.display = 'none';
        showError('Failed to load firmware file');
    }
}

/**
 * Setup local firmware flash button
 */
function setupLocalFirmwareFlash(): void {
    flashLocalBtn.addEventListener('click', async () => {
        if (!currentFirmware || currentFirmware.source !== 'local') {
            showError('No firmware file loaded');
            return;
        }
        await startFlash();
    });
}


/**
 * Load GitHub releases
 */
async function loadGitHubReleases(): Promise<void> {
    try {
        console.log('Fetching releases from GitHub...');

        // Show spinner while loading
        releasesLoading.style.display = 'flex';
        releasesList.style.display = 'none';
        flashGitHubBtn.style.display = 'none';

        const releases = await fetchReleases();
        console.log(`Fetched ${releases.length} releases`);

        if (releases.length === 0) {
            releasesLoading.innerHTML = '<p class="note">No releases found</p>';
            return;
        }

        // Update version display with latest release
        latestVersion = releases[0].version;
        versionDisplay.textContent = latestVersion;

        // Create list items
        releasesList.innerHTML = '';

        releases.forEach((release, index) => {
            const date = new Date(release.date).toLocaleDateString();
            const version = release.name;
            const isLatest = index === 0;

            const item = document.createElement('div');
            item.className = 'release-list-item';
            item.dataset.index = index.toString();
            item.dataset.version = release.version;

            item.innerHTML = `
                <div class="release-version">
                    ${version}
                    ${isLatest ? '<span class="release-badge">Latest</span>' : ''}
                </div>
                <div class="release-meta">
                    <span>${date}</span>
                </div>
            `;

            item.addEventListener('click', () => selectRelease(item, index, releases));

            releasesList.appendChild(item);
        });

        // Hide spinner, show list and button
        releasesLoading.style.display = 'none';
        releasesList.style.display = 'block';
        flashGitHubBtn.style.display = 'block';

        // Store releases for later use
        (window as any).githubReleases = releases;

    } catch (error) {
        console.error('Failed to load releases:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        releasesLoading.innerHTML = `<p class="note">Failed to load releases: ${errorMsg}</p>`;
    }
}

/**
 * Select a release from the list
 */
function selectRelease(element: HTMLElement, index: number, releases: any[]): void {
    // Remove previous selection
    releasesList.querySelectorAll('.release-list-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Mark as selected
    element.classList.add('selected');

    // Enable flash button
    flashGitHubBtn.disabled = false;

    // Store selected release
    (window as any).selectedRelease = releases[index];
}

/**
 * Load firmware from GitHub release
 */
async function loadGitHubFirmware(release: FirmwareRelease): Promise<void> {
    try {
        console.log(`Downloading firmware: ${release.name}...`);

        // Update UI to show downloading
        fileName.textContent = `Downloading ${release.name}...`;

        const arrayBuffer = await downloadFirmware(
            release.filename,
            (loaded, total) => {
                if (total > 0) {
                    const pct = Math.round((loaded / total) * 100);
                    fileName.textContent = `Downloading ${release.name}... ${pct}%`;
                }
            }
        );

        currentFirmware = {
            name: release.name,
            data: arrayBuffer,
            source: 'github',
        };

        console.log(`Downloaded firmware: ${arrayBuffer.byteLength} bytes`);
        fileName.textContent = `${release.name} (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB) - Ready to flash`;

        // Start flashing
        await startFlash();
    } catch (error) {
        console.error('Failed to download firmware:', error);
        fileName.textContent = 'Drop .bin file or click to browse';
        const message = error instanceof Error ? error.message : 'Failed to download firmware from GitHub';
        showToast(message, 'error');
    }
}


/**
 * Start firmware flash process
 */
async function startFlash(): Promise<void> {
    if (!currentFirmware) {
        return;
    }

    const clearDataToggle = document.getElementById('clear-data-toggle') as HTMLInputElement;
    const clearData = clearDataToggle?.checked ?? false;

    try {
        // Create flasher if not exists
        if (!flasher) {
            flasher = new KB1Flasher();

            // Setup status callback
            flasher.onStatus((status: FlashStatus) => {
                updateFlashUI(status);
            });

            // Request USB port
            await flasher.requestPort();

            // Update connection UI
            btnConnect.classList.add('hidden');
            btnDisconnect.classList.remove('hidden');
        }

        // Reset status cards
        flashComplete.classList.add('hidden');
        flashError.classList.add('hidden');

        // Start flashing
        await flasher.flash(currentFirmware.data, clearData);

        // Update success message based on clear data mode
        const completeMsg = document.getElementById('flash-complete-message');
        if (completeMsg) {
            completeMsg.textContent = clearData
                ? 'KB1 updated successfully. Device data was cleared.'
                : 'KB1 updated successfully! Battery calibration preserved.';
        }

        // Show success
        showComplete();
    } catch (error) {
        console.error('Flash failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        showError(message);
    }
}

/**
 * Setup clear device data button
 */
function setupClearDeviceData(): void {
    const clearBtn = document.getElementById('clear-device-data-btn') as HTMLButtonElement;
    const clearToggle = document.getElementById('clear-data-toggle') as HTMLInputElement;
    const clearWarning = document.getElementById('clear-data-warning') as HTMLElement;

    const backupStep = document.querySelector<HTMLElement>('.step[data-step="backing-up-nvs"]');
    const restoreStep = document.querySelector<HTMLElement>('.step[data-step="restoring-nvs"]');

    // Toggle warning + progress step visual when checkbox changes
    clearToggle?.addEventListener('change', () => {
        clearWarning.classList.toggle('hidden', !clearToggle.checked);
        backupStep?.classList.toggle('step-skipped', clearToggle.checked);
        restoreStep?.classList.toggle('step-skipped', clearToggle.checked);
    });

    clearBtn?.addEventListener('click', async () => {
        const confirmed = confirm(
            'This will permanently erase all presets, calibration data, and settings from your KB1.\n\nAre you sure you want to continue?'
        );
        if (!confirmed) return;

        clearBtn.disabled = true;
        clearBtn.textContent = 'Clearing...';

        try {
            // Create a fresh flasher for standalone clear
            const clearFlasher = new KB1Flasher();
            clearFlasher.onStatus((status: FlashStatus) => updateFlashUI(status));
            await clearFlasher.requestPort();

            flashComplete.classList.add('hidden');
            flashError.classList.add('hidden');

            await clearFlasher.clearDeviceData();
            showToast('Device data cleared successfully', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to clear device data';
            showToast(message, 'error');
        } finally {
            clearBtn.disabled = false;
            clearBtn.textContent = 'Clear Device Data';
        }
    });
}

/**
 * Update flash UI with status
 */
function updateFlashUI(status: FlashStatus): void {
    // Handle error state
    if (status.step === 'error') {
        showError(status.error || status.message);
        return;
    }

    // Handle completion
    if (status.step === 'complete') {
        showComplete();
        return;
    }

    // Update overall progress bar and percentage
    progressFill.style.width = `${status.progress}%`;
    progressPercent.textContent = `${status.progress}%`;
    progressMessage.textContent = status.message;

    // Load NVS data after backup completes (to show what's being preserved)
    if (status.step === 'backing-up-nvs' && status.progress >= 30) {
        loadNVSData();
    }

    // Update steps
    const steps = document.querySelectorAll('.step');
    const stepOrder = ['checking-usb', 'backing-up-nvs', 'flashing-firmware', 'restoring-nvs'];
    const currentStepIndex = stepOrder.indexOf(status.step);

    steps.forEach(step => {
        const stepName = step.getAttribute('data-step');
        const thisStepIndex = stepOrder.indexOf(stepName!);

        step.classList.remove('active', 'complete');

        if (stepName === status.step) {
            // Current active step — only if not skipped
            if (!step.classList.contains('step-skipped')) {
                step.classList.add('active');
            }

            // Update step progress bar
            const stepProgressFill = step.querySelector('.step-progress-fill') as HTMLElement;
            if (stepProgressFill) {
                // Calculate progress within this step
                let stepProgress = 0;
                if (status.step === 'checking-usb') {
                    stepProgress = Math.min(status.progress * 10, 100); // 0-10%
                } else if (status.step === 'backing-up-nvs') {
                    stepProgress = Math.min((status.progress - 10) * 5, 100); // 10-30%
                } else if (status.step === 'flashing-firmware') {
                    stepProgress = Math.min((status.progress - 30) * 2, 100); // 30-80%
                } else if (status.step === 'restoring-nvs') {
                    stepProgress = Math.min((status.progress - 80) * 6.67, 100); // 80-95%
                }
                stepProgressFill.style.width = `${stepProgress}%`;
            }
        } else if (thisStepIndex < currentStepIndex) {
            // Previous steps are complete — but honour skipped state
            if (!step.classList.contains('step-skipped')) {
                step.classList.add('complete');
                const stepProgressFill = step.querySelector('.step-progress-fill') as HTMLElement;
                if (stepProgressFill) {
                    stepProgressFill.style.width = '100%';
                }
            }
        } else {
            // Future steps - reset progress
            const stepProgressFill = step.querySelector('.step-progress-fill') as HTMLElement;
            if (stepProgressFill) {
                stepProgressFill.style.width = '0%';
            }
        }
    });
}


/**
 * Show flash complete
 */
function showComplete(): void {
    // Update progress to 100%
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    progressMessage.textContent = 'Firmware update complete! Device is ready to use.';

    // Change progress bar to green
    progressFill.classList.add('success');

    // Mark steps complete — skipped steps stay as-is
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active');
        if (!step.classList.contains('step-skipped')) {
            step.classList.add('complete');
            const stepProgressFill = step.querySelector('.step-progress-fill') as HTMLElement;
            if (stepProgressFill) {
                stepProgressFill.style.width = '100%';
            }
        }
    });

    // Show success badge in header
    flashSuccessBadge.classList.remove('hidden');

    // Show success card
    flashComplete.classList.remove('hidden');

    // Load NVS data after flash completes
    loadNVSData();
}

/**
 * Show flash error
 */
function showError(message: string): void {
    flashError.classList.remove('hidden');
    errorMessage.textContent = message;
    showToast(message, 'error');
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    const toast = document.getElementById('toast')!;
    const toastMsg = document.getElementById('toast-message')!;
    toastMsg.textContent = message;
    toast.className = `toast toast-${type} visible`;
    clearTimeout((toast as any)._hideTimer);
    (toast as any)._hideTimer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 5000);
}

/**
 * Reset flash UI
 */
function resetFlash(): void {
    flashComplete.classList.add('hidden');
    flashError.classList.add('hidden');
    flashSuccessBadge.classList.add('hidden');

    currentFirmware = null;

    fileName.textContent = 'Drop .bin file or click to browse';
    fileInput.value = '';
    flashLocalBtn.style.display = 'none';
    flashLocalBtn.disabled = true;

    // Reset GitHub selection
    flashGitHubBtn.disabled = true;
    document.querySelectorAll<HTMLElement>('.release-list-item').forEach(el => el.classList.remove('selected'));

    // Reset progress UI to idle state
    progressFill.style.width = '0%';
    progressFill.classList.remove('success');
    progressPercent.textContent = '0%';
    progressMessage.textContent = 'Select a firmware version or upload a .bin file to begin';

    // Reset all steps — preserve step-skipped state from toggle
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.remove('active', 'complete');
        const fill = step.querySelector('.step-progress-fill') as HTMLElement;
        if (fill) fill.style.width = '0%';
    });
}

/**
 * Setup serial monitor
 */
function setupSerialMonitor(): void {
    serialMonitor = new SerialMonitor();

    const portLabel = document.getElementById('terminal-port-label') as HTMLElement;

    // Data callback
    serialMonitor.onData((text: string) => {
        appendSerialOutput(text);
    });

    // Connect button
    serialConnectBtn.addEventListener('click', async () => {
        try {
            await serialMonitor!.connect();
            serialConnectBtn.classList.add('hidden');
            serialDisconnectBtn.classList.remove('hidden');
            if (portLabel) {
                portLabel.textContent = '● Monitor open';
                portLabel.classList.add('connected');
            }
            // Remove placeholder if present
            const placeholder = serialOutput.querySelector('.serial-placeholder');
            if (placeholder) placeholder.remove();
        } catch (error) {
            console.error('Serial connect failed:', error);
            appendSerialOutput(`Error: ${error}\n`);
        }
    });

    // Disconnect button
    serialDisconnectBtn.addEventListener('click', async () => {
        await serialMonitor!.disconnect();
        serialConnectBtn.classList.remove('hidden');
        serialDisconnectBtn.classList.add('hidden');
        if (portLabel) {
            portLabel.textContent = '● Monitor closed';
            portLabel.classList.remove('connected');
        }
    });

    // Clear button
    serialClearBtn.addEventListener('click', () => {
        serialOutput.textContent = '';
    });
}

/**
 * Classify a serial line and return a CSS class for coloring.
 */
function classifySerialLine(line: string): string {
    if (/={3,}/.test(line) || /^-{3,}/.test(line)) return 'serial-line-header';
    if (/error|fail|fault/i.test(line)) return 'serial-line-error';
    if (/warn/i.test(line)) return 'serial-line-warn';
    if (/battery:|firmware:|uptime:|version:|ok|ready|done/i.test(line)) return 'serial-line-ok';
    if (/^\s*>/.test(line) || /^\$/.test(line)) return 'serial-line-prompt';
    if (/:\s+\d/.test(line)) return 'serial-line-value';
    return 'serial-line-info';
}

/**
 * Append text to serial output with VS Code-style line coloring
 */
function appendSerialOutput(text: string): void {
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        // Skip the trailing empty segment from a trailing newline
        if (index === lines.length - 1 && line === '') return;
        const cleanLine = line.replace(/\r/g, '');
        const div = document.createElement('div');
        div.className = classifySerialLine(cleanLine);
        div.textContent = cleanLine;
        serialOutput.appendChild(div);
    });

    // Auto-scroll
    if (autoScrollCheckbox.checked) {
        serialOutput.scrollTop = serialOutput.scrollHeight;
    }
}

/**
 * Setup help modal (?) buttons
 */
function setupHelpModal(): void {
    const overlay = document.getElementById('help-modal')!;
    const contentEl = document.getElementById('help-modal-content')!;
    const closeBtn = document.getElementById('help-modal-close')!;

    document.querySelectorAll<HTMLButtonElement>('.help-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.modal;
            const tpl = document.getElementById(`${key}-help-content`) as HTMLTemplateElement | null;
            if (tpl) {
                contentEl.innerHTML = '';
                contentEl.appendChild(tpl.content.cloneNode(true));
                overlay.classList.remove('hidden');
            }
        });
    });

    closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
    });
}

// Initialize on load
init();
