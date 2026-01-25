#!/usr/bin/env node

/**
 * Test script to simulate Netlify build locally
 * Run with: node scripts/test-netlify-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Netlify Build Locally...\n');

// Set environment variable for Netlify build
process.env.NETLIFY_DEPLOY = 'true';

try {
  // Check if required files exist
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'netlify.toml',
    '.env.example'
  ];

  console.log('📋 Checking required files...');
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      process.exit(1);
    }
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Run the Netlify build
  console.log('\n🔨 Running Netlify build...');
  execSync('npm run build:netlify', { stdio: 'inherit' });

  // Check if output directory exists
  if (fs.existsSync('out')) {
    console.log('\n✅ Build successful! Output directory "out" created.');
    
    // List some key files in the output
    const outputFiles = fs.readdirSync('out');
    console.log('\n📁 Output files:');
    outputFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    
    if (outputFiles.length > 10) {
      console.log(`   ... and ${outputFiles.length - 10} more files`);
    }
  } else {
    console.log('\n❌ Build failed! Output directory "out" not found.');
    process.exit(1);
  }

  console.log('\n🎉 Netlify build test completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Push your code to GitHub');
  console.log('   2. Connect your repository to Netlify');
  console.log('   3. Set environment variables in Netlify dashboard');
  console.log('   4. Deploy!');

} catch (error) {
  console.error('\n❌ Build test failed:', error.message);
  process.exit(1);
}