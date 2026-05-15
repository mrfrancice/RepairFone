import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface StorageProvider {
  upload(file: FileInfo, key: string): Promise<UploadResult>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

// Types minimaux pour les SDK charges dynamiquement (non installes par defaut).
// Voir S3StorageProvider / CloudinaryStorageProvider qui utilisent require()
// dans un try/catch pour permettre une activation optionnelle.
interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface CloudinaryUploadStream {
  end(buffer: Buffer): void;
}

interface CloudinaryLike {
  config(options: {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  }): void;
  uploader: {
    upload_stream(
      options: {
        public_id: string;
        folder: string;
        resource_type: 'auto';
      },
      callback: (error: unknown, result?: CloudinaryUploadResponse) => void,
    ): CloudinaryUploadStream;
    destroy(publicId: string): Promise<unknown>;
  };
}

// Local storage provider (development)
class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger('LocalStorageProvider');
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(uploadDir: string, baseUrl: string) {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  upload(file: FileInfo, key: string): Promise<UploadResult> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const dir = path.dirname(filePath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, file.buffer);

      return Promise.resolve({
        success: true,
        url: this.getUrl(key),
        key,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Local upload error: ${errorMessage}`);
      return Promise.resolve({
        success: false,
        error: errorMessage,
      });
    }
  }

  delete(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return Promise.resolve(true);
    } catch (error) {
      this.logger.error(`Delete error: ${String(error)}`);
      return Promise.resolve(false);
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }
}

// AWS S3 storage provider
// SDK charge dynamiquement via require() pour permettre une activation
// optionnelle sans ajouter @aws-sdk/client-s3 aux dependencies de base.
class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger('S3StorageProvider');
  private s3Client: S3ClientLike | null = null;
  private bucket: string;
  private region: string;

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    region: string,
  ) {
    this.bucket = bucket;
    this.region = region;
    this.initializeClient(accessKeyId, secretAccessKey);
  }

  private initializeClient(accessKeyId: string, secretAccessKey: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const aws = require('@aws-sdk/client-s3') as {
        S3Client: new (config: {
          region: string;
          credentials: { accessKeyId: string; secretAccessKey: string };
        }) => S3ClientLike;
      };
      this.s3Client = new aws.S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3 client initialized');
    } catch {
      this.logger.error(
        'AWS SDK not installed. Run: npm install @aws-sdk/client-s3',
      );
    }
  }

  async upload(file: FileInfo, key: string): Promise<UploadResult> {
    if (!this.s3Client) {
      return { success: false, error: 'S3 client not initialized' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const aws = require('@aws-sdk/client-s3') as {
        PutObjectCommand: new (input: {
          Bucket: string;
          Key: string;
          Body: Buffer;
          ContentType: string;
          ACL: string;
        }) => unknown;
      };

      await this.s3Client.send(
        new aws.PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimeType,
          ACL: 'public-read',
        }),
      );

      return {
        success: true,
        url: this.getUrl(key),
        key,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`S3 upload error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.s3Client) return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const aws = require('@aws-sdk/client-s3') as {
        DeleteObjectCommand: new (input: {
          Bucket: string;
          Key: string;
        }) => unknown;
      };

      await this.s3Client.send(
        new aws.DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(`S3 delete error: ${String(error)}`);
      return false;
    }
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

// Cloudinary storage provider
// SDK charge dynamiquement via require() pour permettre une activation
// optionnelle sans ajouter cloudinary aux dependencies de base.
class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger('CloudinaryStorageProvider');
  private cloudinary: CloudinaryLike | null = null;
  private cloudName: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.initializeClient(apiKey, apiSecret);
  }

  private initializeClient(apiKey: string, apiSecret: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sdk = require('cloudinary') as { v2: CloudinaryLike };
      const client = sdk.v2;
      client.config({
        cloud_name: this.cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.cloudinary = client;
      this.logger.log('Cloudinary client initialized');
    } catch {
      this.logger.error(
        'Cloudinary SDK not installed. Run: npm install cloudinary',
      );
    }
  }

  async upload(file: FileInfo, key: string): Promise<UploadResult> {
    const client = this.cloudinary;
    if (!client) {
      return { success: false, error: 'Cloudinary client not initialized' };
    }

    try {
      const result = await new Promise<CloudinaryUploadResponse>(
        (resolve, reject) => {
          const uploadStream = client.uploader.upload_stream(
            {
              public_id: key.replace(/\.[^/.]+$/, ''), // Remove extension
              folder: path.dirname(key),
              resource_type: 'auto',
            },
            (error, uploadResult) => {
              if (error) {
                reject(
                  error instanceof Error
                    ? error
                    : new Error('Cloudinary upload failed'),
                );
              } else if (uploadResult) {
                resolve(uploadResult);
              } else {
                reject(new Error('Cloudinary returned no result'));
              }
            },
          );

          uploadStream.end(file.buffer);
        },
      );

      return {
        success: true,
        url: result.secure_url,
        key: result.public_id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Cloudinary upload error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.cloudinary) return false;

    try {
      await this.cloudinary.uploader.destroy(key);
      return true;
    } catch (error) {
      this.logger.error(`Cloudinary delete error: ${String(error)}`);
      return false;
    }
  }

  getUrl(key: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${key}`;
  }
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private provider: StorageProvider;

  // Default limits
  private readonly defaultMaxSize = 10 * 1024 * 1024; // 10MB
  private readonly imageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly documentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private readonly configService: ConfigService) {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    const providerName =
      this.configService.get<string>('STORAGE_PROVIDER') || 'local';

    switch (providerName.toLowerCase()) {
      case 's3':
      case 'aws': {
        const awsKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const awsSecret = this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        );
        const bucket = this.configService.get<string>('AWS_S3_BUCKET');
        const region =
          this.configService.get<string>('AWS_REGION') || 'eu-west-1';

        if (!awsKey || !awsSecret || !bucket) {
          this.logger.warn('AWS credentials missing, falling back to local');
          this.provider = this.createLocalProvider();
        } else {
          this.provider = new S3StorageProvider(
            awsKey,
            awsSecret,
            bucket,
            region,
          );
          this.logger.log('Storage provider: AWS S3 initialized');
        }
        break;
      }

      case 'cloudinary': {
        const cloudName = this.configService.get<string>(
          'CLOUDINARY_CLOUD_NAME',
        );
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>(
          'CLOUDINARY_API_SECRET',
        );

        if (!cloudName || !apiKey || !apiSecret) {
          this.logger.warn(
            'Cloudinary credentials missing, falling back to local',
          );
          this.provider = this.createLocalProvider();
        } else {
          this.provider = new CloudinaryStorageProvider(
            cloudName,
            apiKey,
            apiSecret,
          );
          this.logger.log('Storage provider: Cloudinary initialized');
        }
        break;
      }

      case 'local':
      default:
        this.provider = this.createLocalProvider();
        this.logger.log('Storage provider: Local (development mode)');
        break;
    }
  }

  private createLocalProvider(): LocalStorageProvider {
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';
    const baseUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3000';
    return new LocalStorageProvider(uploadDir, baseUrl);
  }

  // ==================== Public Methods ====================

  /**
   * Upload a repair image (before/after photos)
   */
  async uploadRepairImage(
    file: FileInfo,
    requestId: string,
    type: 'before' | 'after' | 'progress',
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `repairs/${requestId}/${type}`,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: this.imageTypes,
    });
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: FileInfo, _userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `avatars`,
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: this.imageTypes,
    });
  }

  /**
   * Upload repairer document (ID, certification, etc.)
   */
  async uploadDocument(
    file: FileInfo,
    repairerId: string,
    documentType: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `documents/${repairerId}/${documentType}`,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: this.documentTypes,
    });
  }

  /**
   * Upload chat attachment
   */
  async uploadChatAttachment(
    file: FileInfo,
    conversationId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `chat/${conversationId}`,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [...this.imageTypes, 'application/pdf'],
    });
  }

  /**
   * Upload dispute evidence
   */
  async uploadDisputeEvidence(
    file: FileInfo,
    disputeId: string,
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `disputes/${disputeId}`,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [...this.imageTypes, ...this.documentTypes],
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url);
      if (!key) {
        this.logger.warn(`Could not extract key from URL: ${url}`);
        return false;
      }

      return await this.provider.delete(key);
    } catch (error) {
      this.logger.error(`Delete file error: ${error}`);
      return false;
    }
  }

  /**
   * Get file URL from key
   */
  getFileUrl(key: string): string {
    return this.provider.getUrl(key);
  }

  // ==================== Private Methods ====================

  private async uploadFile(
    file: FileInfo,
    options: UploadOptions,
  ): Promise<UploadResult> {
    // Validate file size
    const maxSize = options.maxSize || this.defaultMaxSize;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    // Validate file type
    const allowedTypes = options.allowedTypes || [
      ...this.imageTypes,
      ...this.documentTypes,
    ];
    if (!allowedTypes.includes(file.mimeType)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Generate unique filename
    const ext = this.getExtension(file.originalName, file.mimeType);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const key = `${options.folder || 'uploads'}/${timestamp}-${uniqueId}${ext}`;

    // Upload file
    const result = await this.provider.upload(file, key);

    if (!result.success) {
      this.logger.error(`Upload failed: ${result.error}`);
    }

    return result;
  }

  private getExtension(originalName: string, mimeType: string): string {
    // Try to get from original filename
    const ext = path.extname(originalName).toLowerCase();
    if (ext) return ext;

    // Fallback to mime type
    const mimeExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
    };

    return mimeExtensions[mimeType] || '';
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      // Handle S3 URLs
      if (urlObj.hostname.includes('s3.')) {
        return urlObj.pathname.substring(1); // Remove leading slash
      }

      // Handle Cloudinary URLs
      if (urlObj.hostname.includes('cloudinary')) {
        const parts = urlObj.pathname.split('/upload/');
        return parts[1] || null;
      }

      // Handle local URLs
      if (urlObj.pathname.startsWith('/uploads/')) {
        return urlObj.pathname.substring('/uploads/'.length);
      }

      return null;
    } catch {
      return null;
    }
  }
}
