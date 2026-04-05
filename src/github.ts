/**
 * KB1 Flash Tool - GitHub Releases Fetcher
 */

import type { GitHubRelease } from './types';

const GITHUB_OWNER = 'PocketMidi';
const GITHUB_REPO = 'KB1-firmware';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

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
 * Download firmware binary from URL
 */
export async function downloadFirmware(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
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
 * Find firmware .bin file in release assets
 */
export function findFirmwareBinary(release: GitHubRelease): string | null {
  // Look for .bin file in assets
  const binAsset = release.assets.find(asset => 
    asset.name.endsWith('.bin') && !asset.name.includes('bootloader')
  );
  
  if (binAsset) {
    return binAsset.browser_download_url;
  }
  
  // Look for combined firmware
  const combinedAsset = release.assets.find(asset => 
    asset.name.includes('combined') || asset.name.includes('full')
  );
  
  return combinedAsset?.browser_download_url || null;
}
