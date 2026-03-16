import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ObjectStorageService } from './object-storage.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

describe('ObjectStorageService', () => {
  let service: ObjectStorageService;
  let s3Client: S3Client;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config = {
          AWS_REGION: process.env.AWS_REGION || 'us-east-1',
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          S3_BUCKET: process.env.S3_BUCKET || 'test-bucket',
        };
        return config[key];
      }),
    };

    const mockS3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjectStorageService,
        { provide: 'S3_CLIENT', useValue: mockS3Client },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ObjectStorageService>(ObjectStorageService);
    s3Client = module.get<S3Client>('S3_CLIENT');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('AWS Credentials Test', () => {
    it('should have valid AWS credentials configured', async () => {
      // Check if environment variables are set
      expect(process.env.AWS_ACCESS_KEY_ID).toBeDefined();
      expect(process.env.AWS_SECRET_ACCESS_KEY).toBeDefined();
      expect(process.env.S3_BUCKET).toBeDefined();
      expect(process.env.AWS_REGION).toBeDefined();

      console.log('Testing AWS credentials...');
      console.log('Region:', process.env.AWS_REGION);
      console.log('Bucket:', process.env.S3_BUCKET);
      console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...');
    }, 10000);

    it('should successfully ping the S3 bucket', async () => {
      try {
        const isHealthy = await service.ping();
        expect(isHealthy).toBe(true);
        console.log('✅ AWS S3 bucket access successful');
      } catch (error) {
        console.error('❌ AWS S3 bucket access failed:', error.message);
        throw error;
      }
    }, 15000);

    it('should be able to connect to S3 service directly', async () => {
      try {
        const bucketName = process.env.S3_BUCKET;
        const command = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(command);
        console.log(`✅ Direct S3 connection to bucket '${bucketName}' successful`);
      } catch (error) {
        console.error('❌ Direct S3 connection failed:', error.message);

        if (error.name === 'NotFound') {
          console.log('🔍 Bucket does not exist or you do not have access to it');
        } else if (error.name === 'Forbidden') {
          console.log('🔍 Access denied - check IAM permissions');
        } else if (error.name === 'InvalidAccessKeyId') {
          console.log('🔍 Invalid AWS Access Key ID');
        } else if (error.name === 'SignatureDoesNotMatch') {
          console.log('🔍 Invalid AWS Secret Access Key');
        }

        throw error;
      }
    }, 15000);
  });

  describe('Basic Operations Test', () => {
    const testKey = `test-${Date.now()}.txt`;
    const testData = Buffer.from('Hello AWS S3!', 'utf-8');

    it('should upload, download, and delete a test file', async () => {
      try {
        // Upload test file
        console.log('📤 Uploading test file...');
        await service.upload(testKey, testData, 'text/plain');
        console.log('✅ Upload successful');

        // Download test file
        console.log('📥 Downloading test file...');
        const downloadedData = await service.download(testKey);
        expect(downloadedData.toString('utf-8')).toBe('Hello AWS S3!');
        console.log('✅ Download successful');

        // Delete test file
        console.log('🗑️ Deleting test file...');
        await service.delete(testKey);
        console.log('✅ Delete successful');

        console.log('🎉 All AWS S3 operations completed successfully!');
      } catch (error) {
        console.error('❌ AWS S3 operation failed:', error.message);

        // Cleanup in case of error
        try {
          await service.delete(testKey);
          console.log('🧹 Cleanup completed');
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        throw error;
      }
    }, 30000);
  });

  describe('Configuration Validation', () => {
    it('should validate all required environment variables', () => {
      const requiredEnvVars = [
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars);
        console.log('📝 Add these to your .env file:');
        missingVars.forEach(varName => {
          console.log(`${varName}=your_value_here`);
        });
      }

      expect(missingVars).toHaveLength(0);
    });

    it('should have valid AWS region format', () => {
      const region = process.env.AWS_REGION;
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d{1}$/);
      console.log('✅ AWS region format is valid:', region);
    });

    it('should have valid AWS Access Key ID format', () => {
      const accessKey = process.env.AWS_ACCESS_KEY_ID;
      expect(accessKey).toMatch(/^AKIA[0-9A-Z]{16}$/);
      console.log('✅ AWS Access Key ID format is valid');
    });

    it('should have valid S3 bucket name format', () => {
      const bucketName = process.env.S3_BUCKET;
      expect(bucketName).toMatch(/^[a-z0-9.-]{3,63}$/);
      expect(bucketName).not.toMatch(/\.\./);
      expect(bucketName).not.toMatch(/^\.|\.$|^-|-$/);
      console.log('✅ S3 bucket name format is valid:', bucketName);
    });
  });
});