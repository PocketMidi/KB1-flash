/**
 * KB1 Flash Tool - Main Entry Point
 */

import { KB1Flasher } from './flasher';
import { downloadFirmware, fetchReleases, findFirmwareBinary } from './github';
import { SerialMonitor } from './serial-monitor';
import './style.css';
import type { FirmwareFile, FlashStatus, GitHubRelease } from './types';

// Initialize
let flasher: KB1Flasher | null = null;
let serialMonitor: SerialMonitor | null = null;
let currentFirmware: FirmwareFile | null = null;

// DOM elements
const browserWarning = document.getElementById('browser-warning')!;
const flashTab = document.getElementById('flash-tab')!;
const serialTab = document.getElementById('serial-tab')!;
const githubReleases = document.getElementById('github-releases')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileLabel = document.querySelector('.file-label')!;
const fileName = document.getElementById('file-name')!;
const flashProgress = document.getElementById('flash-progress')!;
const flashComplete = document.getElementById('flash-complete')!;
const flashError = document.getElementById('flash-error')!;
const progressFill = document.getElementById('progress-fill')!;
const progressMessage = document.getElementById('progress-message')!;
const errorMessage = document.getElementById('error-message')!;
const resetBtn = document.getElementById('reset-btn')!;
const retryBtn = document.getElementById('retry-btn')!;
const connectionStatus = document.getElementById('connection-status')!;
const statusText = document.getElementById('status-text')!;

// Serial monitor elements
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

    // Setup tabs
    setupTabs();

    // Setup file upload
    setupFileUpload();

    // Load GitHub releases
    loadGitHubReleases();

    // Setup serial monitor
    setupSerialMonitor();

    // Setup reset/retry buttons
    resetBtn.addEventListener('click', resetFlash);
    retryBtn.addEventListener('click', resetFlash);
}

/**
 * Setup tab navigation
 */
function setupTabs(): void {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');

            // Update tab buttons
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update tab content
            if (tabName === 'flash') {
                flashTab.classList.add('active');
                serialTab.classList.remove('active');
            } else if (tabName === 'serial') {
                flashTab.classList.remove('active');
                serialTab.classList.add('active');
            }
        });
    });
}

/**
 * Setup file upload (drag & drop + click)
 */
function setupFileUpload(): void {
    // Click to browse
    fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file && file.name.endsWith('.bin')) {
            loadLocalFirmware(file);
        }
    });

    // Drag & drop
    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileLabel.classList.add('drag-over');
    });

    fileLabel.addEventListener('dragleave', () => {
        fileLabel.classList.remove('drag-over');
    });

    fileLabel.addEventListener('drop', (e) => {
        const dragEvent = e as DragEvent;
        dragEvent.preventDefault();
        fileLabel.classList.remove('drag-over');

        const file = dragEvent.dataTransfer?.files[0];

        if (file && file.name.endsWith('.bin')) {
            loadLocalFirmware(file);
        }
    });
}

/**
 * Load local firmware file
 */
async function loadLocalFirmware(file: File): Promise<void> {
    try {
        fileName.textContent = file.name;

        const arrayBuffer = await file.arrayBuffer();

        currentFirmware = {
            name: file.name,
            data: arrayBuffer,
            source: 'local',
        };

        console.log(`Loaded local firmware: ${file.name} (${arrayBuffer.byteLength} bytes)`);

        // Start flashing
        await startFlash();
    } catch (error) {
        console.error('Failed to load firmware file:', error);
        showError('Failed to load firmware file');
    }
}

/**
 * Load GitHub releases
 */
async function loadGitHubReleases(): Promise<void> {
    try {
        const releases = await fetchReleases(5);

        if (releases.length === 0) {
            githubReleases.innerHTML = '<p class="note">No releases found</p>';
            return;
        }

        // Display releases
        const html = releases.map(release => createReleaseHTML(release)).join('');
        githubReleases.innerHTML = html;

        // Add click handlers
        const releaseButtons = githubReleases.querySelectorAll('.release-btn');
        releaseButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => loadGitHubFirmware(releases[index]));
        });
    } catch (error) {
        console.error('Failed to load releases:', error);
        githubReleases.innerHTML = '<p class="note">Failed to load releases. Check your internet connection.</p>';
    }
}

/**
 * Create HTML for release item
 */
function createReleaseHTML(release: GitHubRelease): string {
    const date = new Date(release.published_at).toLocaleDateString();
    const firmwareUrl = findFirmwareBinary(release);

    if (!firmwareUrl) {
        return '';
    }

    return `
    <div class="release-item">
      <div class="release-info">
        <div class="release-name">${release.name || release.tag_name}</div>
        <div class="release-date">${date}</div>
      </div>
      <button class="btn btn-primary release-btn">Flash</button>
    </div>
  `;
}

/**
 * Load firmware from GitHub release
 */
async function loadGitHubFirmware(release: GitHubRelease): Promise<void> {
    try {
        const firmwareUrl = findFirmwareBinary(release);

        if (!firmwareUrl) {
            throw new Error('No firmware binary found in release');
        }

        console.log(`Downloading firmware: ${release.name}...`);

        const arrayBuffer = await downloadFirmware(firmwareUrl);

        currentFirmware = {
            name: release.name || release.tag_name,
            data: arrayBuffer,
            source: 'github',
        };

        console.log(`Downloaded firmware: ${arrayBuffer.byteLength} bytes`);

        // Start flashing
        await startFlash();
    } catch (error) {
        console.error('Failed to download firmware:', error);
        showError('Failed to download firmware from GitHub');
    }
}

/**
 * Start firmware flash process
 */
async function startFlash(): Promise<void> {
    if (!currentFirmware) {
        return;
    }

    try {
        // Create flasher
        flasher = new KB1Flasher();

        // Setup status callback
        flasher.onStatus((status: FlashStatus) => {
            updateFlashUI(status);
        });

        // Request USB port
        await flasher.requestPort();

        // Update connection status
        connectionStatus.classList.remove('disconnected');
        connectionStatus.classList.add('connected');
        statusText.textContent = 'Connected';

        // Show progress UI
        flashProgress.classList.remove('hidden');
        flashComplete.classList.add('hidden');
        flashError.classList.add('hidden');

        // Start flashing
        await flasher.flash(currentFirmware.data);

        // Show success
        showComplete();
    } catch (error) {
        console.error('Flash failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        showError(message);
    }
}

/**
 * Update flash UI with status
 */
function updateFlashUI(status: FlashStatus): void {
    // Update progress bar
    progressFill.style.width = `${status.progress}%`;
    progressMessage.textContent = status.message;

    // Update steps
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        const stepName = step.getAttribute('data-step');
        step.classList.remove('active', 'complete');

        if (stepName === status.step) {
            step.classList.add('active');
        } else {
            // Mark previous steps as complete
            const stepOrder = ['checking-usb', 'backing-up-nvs', 'flashing-firmware', 'restoring-nvs'];
            const currentIndex = stepOrder.indexOf(status.step);
            const thisIndex = stepOrder.indexOf(stepName!);

            if (thisIndex < currentIndex) {
                step.classList.add('complete');
            }
        }
    });
}

/**
 * Show flash complete
 */
function showComplete(): void {
    flashProgress.classList.add('hidden');
    flashComplete.classList.remove('hidden');

    connectionStatus.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
    statusText.textContent = 'Update Complete';
}

/**
 * Show flash error
 */
function showError(message: string): void {
    flashProgress.classList.add('hidden');
    flashError.classList.remove('hidden');
    errorMessage.textContent = message;

    connectionStatus.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
    statusText.textContent = 'Error';
}

/**
 * Reset flash UI
 */
function resetFlash(): void {
    flashProgress.classList.add('hidden');
    flashComplete.classList.add('hidden');
    flashError.classList.add('hidden');

    currentFirmware = null;
    flasher = null;

    connectionStatus.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
    statusText.textContent = 'Not Connected';

    fileName.textContent = 'Drop .bin file or click to browse';
    fileInput.value = '';
}

/**
 * Setup serial monitor
 */
function setupSerialMonitor(): void {
    serialMonitor = new SerialMonitor();

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
    });

    // Clear button
    serialClearBtn.addEventListener('click', () => {
        serialOutput.textContent = '';
    });
}

/**
 * Append text to serial output
 */
function appendSerialOutput(text: string): void {
    serialOutput.textContent += text;

    // Auto-scroll
    if (autoScrollCheckbox.checked) {
        serialOutput.scrollTop = serialOutput.scrollHeight;
    }
}

// Initialize on load
init();
