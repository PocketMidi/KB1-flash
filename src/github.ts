/**
 * KB1 Flash Tool - GitHub Releases Fetcher
 */

import type { GitHubRelease } from './types';

const GITHUB_OWNER = 'PocketMidi';
const GITHUB_REPO = 'KB1';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
const ASSETS_API  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/assets`;

/**
 * Fetch latest releases from GitHub
 */
export async function fetchReleases(limit = 5): Promise<GitHubRelease[]> {
    try {
        const response = await fetch(`${RELEASES_API}?per_page=${limit}`);

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const releases: GitHubRelease[] = await response.json();
        return releases;
    } catch (error) {
        console.error('Failed to fetch releases:', error);
        throw error;
    }
}

/**
 * Download firmware binary via the GitHub API assets endpoint.
 * This avoids the CORS issue with the direct release download URL,
 * which redirects through github.com (no CORS header) before landing
 * on objects.githubusercontent.com.
 */
export async function downloadFirmware(
    assetId: number,
    onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
    const url = `${ASSETS_API}/${assetId}`;
    try {
        console.log('Downloading firmware via API asset:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
            }
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            loaded += value.length;

            if (onProgress && total > 0) {
                onProgress(loaded, total);
            }
        }

        // Combine chunks into single ArrayBuffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        return combined.buffer;
    } catch (error) {
        console.error('Failed to download firmware:', error);
        throw error;
    }
}

/**
 * Find firmware .bin asset in a release and return its id.
 */
export function findFirmwareBinary(release: GitHubRelease): number | null {
    const binAsset = release.assets.find(asset =>
        asset.name.endsWith('.bin') && !asset.name.includes('bootloader')
    );
    if (binAsset) return binAsset.id;

    const combinedAsset = release.assets.find(asset =>
        asset.name.includes('combined') || asset.name.includes('full')
    );
    return combinedAsset?.id ?? null;
}
