import { logger } from '../../utils/logger';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class IPFSService {
  private apiKey: string;
  private apiSecret: string;
  private gateway: string;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || '';
    this.apiSecret = process.env.PINATA_API_SECRET || '';
    this.gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
  }

  /**
   * Upload a single file buffer to IPFS via Pinata.
   * Returns the IPFS CID.
   */
  async uploadFile(buffer: Buffer, filename: string, mimeType = 'application/octet-stream'): Promise<string> {
    if (!this.apiKey) {
      // Dev mode — return a mock CID
      const mockCid = 'QmMock' + Buffer.from(filename).toString('hex').slice(0, 40);
      logger.info(`[DEV IPFS] Mock upload: ${filename} → ${mockCid}`);
      return mockCid;
    }

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('pinataMetadata', JSON.stringify({ name: filename }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw Object.assign(new Error(`IPFS upload failed: ${err}`), { code: 'IPFS_ERROR', statusCode: 500 });
    }

    const data = await response.json() as PinataResponse;
    logger.info(`Uploaded to IPFS: ${data.IpfsHash}`);
    return data.IpfsHash;
  }

  /**
   * Upload multiple files as a directory bundle.
   * Returns the root CID of the directory.
   */
  async uploadBundle(files: { name: string; buffer: Buffer; mimeType?: string }[]): Promise<string> {
    if (!this.apiKey) {
      const mockCid = 'QmBundle' + Date.now().toString(16);
      logger.info(`[DEV IPFS] Mock bundle upload: ${files.length} files → ${mockCid}`);
      return mockCid;
    }

    const formData = new FormData();
    for (const file of files) {
      const blob = new Blob([file.buffer], { type: file.mimeType || 'application/octet-stream' });
      formData.append('file', blob, `bundle/${file.name}`);
    }
    formData.append('pinataMetadata', JSON.stringify({ name: `bundle-${Date.now()}` }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      throw Object.assign(new Error('IPFS bundle upload failed'), { code: 'IPFS_ERROR', statusCode: 500 });
    }

    const data = await response.json() as PinataResponse;
    return data.IpfsHash;
  }

  getGatewayURL(cid: string): string {
    return `${this.gateway}/ipfs/${cid}`;
  }
}

export const ipfsService = new IPFSService();
