#!/usr/bin/env node

/**
 * Quick AWS Credentials Test Script
 *
 * Run this script to test your AWS credentials and S3 configuration:
 * node scripts/test-aws-credentials.js
 */

const { S3Client, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testAWSCredentials() {
  console.log('🔍 Testing AWS Credentials...\n');

  // Check environment variables
  const requiredVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n📝 Add these to your .env file and try again.\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found:');
  console.log(`   Region: ${process.env.AWS_REGION}`);
  console.log(`   Bucket: ${process.env.S3_BUCKET}`);
  console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
  console.log('');

  // Create S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Test 1: Check if bucket exists and is accessible
    console.log('🪣 Testing bucket access...');
    const headBucketCommand = new HeadBucketCommand({
      Bucket: process.env.S3_BUCKET
    });
    await s3Client.send(headBucketCommand);
    console.log('✅ Bucket access successful\n');

    // Test 2: List objects (permissions test)
    console.log('📋 Testing list objects permission...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 1
    });
    const listResult = await s3Client.send(listCommand);
    console.log(`✅ List objects successful (found ${listResult.KeyCount || 0} objects)\n`);

    console.log('🎉 All AWS credential tests passed!');
    console.log('Your AWS configuration is working correctly.\n');

  } catch (error) {
    console.error('❌ AWS credential test failed:\n');

    switch (error.name) {
      case 'NoSuchBucket':
        console.error('🔍 Bucket does not exist');
        console.error(`   Create bucket: aws s3 mb s3://${process.env.S3_BUCKET} --region ${process.env.AWS_REGION}`);
        break;
      case 'AccessDenied':
      case 'Forbidden':
        console.error('🔍 Access denied - check IAM permissions');
        console.error('   Required permissions: s3:HeadBucket, s3:ListBucket, s3:GetObject, s3:PutObject, s3:DeleteObject');
        break;
      case 'InvalidAccessKeyId':
        console.error('🔍 Invalid AWS Access Key ID');
        console.error('   Check your AWS_ACCESS_KEY_ID in .env file');
        break;
      case 'SignatureDoesNotMatch':
        console.error('🔍 Invalid AWS Secret Access Key');
        console.error('   Check your AWS_SECRET_ACCESS_KEY in .env file');
        break;
      case 'InvalidToken':
        console.error('🔍 Invalid or expired AWS credentials');
        console.error('   Generate new credentials in AWS IAM console');
        break;
      default:
        console.error(`🔍 Unexpected error: ${error.message}`);
    }

    console.error(`\nError details: ${error.name} - ${error.message}\n`);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAWSCredentials().catch(console.error);
}

module.exports = { testAWSCredentials };