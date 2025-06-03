#!/usr/bin/env node

/**
 * Script to extract key-value pairs from a .env file and create corresponding GitHub secrets
 * 
 * Usage: node env-to-github-secrets.js <owner> <repo> [env-file-path]
 * 
 * Arguments:
 *   owner: GitHub repository owner/organization
 *   repo: GitHub repository name
 *   env-file-path: (Optional) Path to .env file, defaults to '.env' in the current directory
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const sodium = require('libsodium-wrappers');
const readline = require('readline');

// Check if required arguments are provided
const [owner, repo, envFilePath = '.env'] = process.argv.slice(2);

// Only check arguments when run directly (not when imported)
if (require.main === module && (!owner || !repo)) {
  console.error('Error: Missing required arguments');
  console.log('Usage: node env-to-github-secrets.js <owner> <repo> [env-file-path]');
  process.exit(1);
}

// Initialize Octokit with GitHub token from environment
const octokit = new Octokit({
  auth: process.env.GITHUB_FINE_GRAINED_PAT || process.env.GITHUB_PAT
});

// Only check token when run directly (not when imported)
if (require.main === module && !octokit.auth) {
  console.error('Error: GitHub token not found. Please set GITHUB_FINE_GRAINED_PAT or GITHUB_PAT environment variable.');
  process.exit(1);
}

/**
 * Parse .env file and extract key-value pairs
 * @param {string} filePath - Path to .env file
 * @returns {Promise<Object>} - Object containing key-value pairs
 */
async function parseEnvFile(filePath) {
  return new Promise((resolve, reject) => {
    const envVars = {};
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      reject(new Error(`File not found: ${fullPath}`));
      return;
    }
    
    const lineReader = readline.createInterface({
      input: fs.createReadStream(fullPath),
      crlfDelay: Infinity
    });
    
    lineReader.on('line', (line) => {
      // Skip empty lines and comments
      if (!line || line.trim() === '' || line.trim().startsWith('#')) {
        return;
      }
      
      // Extract key-value pairs
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        envVars[key] = value;
      }
    });
    
    lineReader.on('close', () => {
      resolve(envVars);
    });
    
    lineReader.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Create or update a GitHub secret
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} secretName - Secret name
 * @param {string} secretValue - Secret value
 * @returns {Promise<void>}
 */
async function createOrUpdateSecret(owner, repo, secretName, secretValue) {
  try {
    // Get the repository's public key for encrypting secrets
    const { data: { key, key_id } } = await octokit.actions.getRepoPublicKey({
      owner,
      repo
    });
    
    // Convert the secret value and public key to Uint8Array
    const messageBytes = Buffer.from(secretValue);
    const keyBytes = Buffer.from(key, 'base64');
    
    // Encrypt the secret value using libsodium
    await sodium.ready;
    const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
    const encrypted_value = Buffer.from(encryptedBytes).toString('base64');
    
    // Create or update the secret
    await octokit.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: secretName,
      encrypted_value,
      key_id
    });
    
    console.log(`✅ Secret '${secretName}' created/updated successfully`);
  } catch (error) {
    console.error(`❌ Failed to create/update secret '${secretName}':`, error.message);
    throw error;
  }
}

/**
 * Main function to process .env file and create GitHub secrets
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} envFilePath - Path to .env file
 * @returns {Promise<void>}
 */
async function main(ownerArg, repoArg, envFilePathArg) {
  // Use arguments passed to the function or fall back to command line arguments
  const ownerToUse = ownerArg || owner;
  const repoToUse = repoArg || repo;
  const envFilePathToUse = envFilePathArg || envFilePath;
  
  try {
    console.log(`Processing .env file: ${envFilePathToUse}`);
    console.log(`Target repository: ${ownerToUse}/${repoToUse}`);
    
    // Parse .env file
    const envVars = await parseEnvFile(envFilePathToUse);
    const secretCount = Object.keys(envVars).length;
    
    console.log(`Found ${secretCount} environment variables to process`);
    
    // Create GitHub secrets for each environment variable
    for (const [key, value] of Object.entries(envVars)) {
      await createOrUpdateSecret(ownerToUse, repoToUse, key, value);
    }
    
    console.log(`\n🎉 Successfully processed ${secretCount} secrets`);
  } catch (error) {
    console.error('Error:', error.message);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

// Run the main function when the script is executed directly
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  parseEnvFile,
  createOrUpdateSecret,
  main
};