/**
 * KB1 Flash Tool - Type Definitions
 */

export type FlashStep = 
  | 'idle' 
  | 'checking-usb' 
  | 'backing-up-nvs' 
  | 'flashing-firmware' 
  | 'restoring-nvs' 
  | 'complete' 
  | 'error';

export interface FlashStatus {
  step: FlashStep;
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface GitHubRelease {
  name: string;
  tag_name: string;
  published_at: string;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface FirmwareFile {
  name: string;
  data: ArrayBuffer;
  source: 'github' | 'local';
}
