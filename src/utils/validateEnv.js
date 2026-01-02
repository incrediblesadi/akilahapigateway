/**
 * Environment Variable Validation Utility
 * 
 * Validates that all required environment variables are set before the application starts.
 * This prevents runtime errors and ensures proper configuration.
 */

const REQUIRED_ENV_VARS = {
  // Firebase Configuration
  'FIREBASE_DATABASE_URL': 'Firebase Realtime Database URL',
  'FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
  
  // Google Cloud Platform
  'GCP_PROJECT_ID': 'Google Cloud Project ID',
  'GCP_REGION': 'Google Cloud Region',
  
  // GitHub Authentication
  'GITHUB_PAT': 'GitHub Personal Access Token',
  
  // Notion Authentication
  'NOTION_TOKEN': 'Notion Integration Token',
};

const OPTIONAL_ENV_VARS = {
  // Google Cloud (Optional for some features)
  'GCP_CLIENT_ID': 'Google Cloud OAuth Client ID',
  'GCP_CLIENT_SECRET': 'Google Cloud OAuth Client Secret',
  'GCP_BROWSER_API_KEY': 'Google Cloud Browser API Key',
  'GCP_SERVICE_ACCOUNT_EMAIL': 'Google Cloud Service Account Email',
  'GCP_COMPUTE_SERVICE_ACCOUNT': 'Google Cloud Compute Service Account',
  
  // GitHub (Optional OAuth features)
  'GITHUB_CLIENT_ID': 'GitHub OAuth Client ID',
  'GITHUB_CLIENT_SECRET': 'GitHub OAuth Client Secret',
  'GITHUB_OAUTH_CLIENT_ID': 'GitHub OAuth App Client ID',
  'GITHUB_OAUTH_CLIENT_SECRET': 'GitHub OAuth App Client Secret',
  'GITHUB_FINE_GRAINED_PAT': 'GitHub Fine-Grained Personal Access Token',
  
  // LinkedIn (Optional)
  'LINKEDIN_CLIENT_ID': 'LinkedIn Client ID',
  'LINKEDIN_CLIENT_SECRET': 'LinkedIn Client Secret',
  'LINKEDIN_AUTH_URL': 'LinkedIn Auth URL',
  'LINKEDIN_SADI_PROFILE_PAT': 'LinkedIn Profile PAT',
  
  // AWS (Optional)
  'AWS_ACCESS_KEY_ID': 'AWS Access Key ID',
  'AWS_SECRET_ACCESS_KEY': 'AWS Secret Access Key',
  'AWS_AMPLIFY_KEY': 'AWS Amplify Key',
  'AWS_AMPLIFY_SECRET': 'AWS Amplify Secret',
  
  // Notion (Optional OAuth features)
  'NOTION_CLIENT_ID': 'Notion OAuth Client ID',
  'NOTION_CLIENT_SECRET': 'Notion OAuth Client Secret',
  'NOTION_WORKSPACE_ID': 'Notion Workspace ID',
  'NOTION_INTERNAL_INTEGRATION_SECRET': 'Notion Internal Integration Secret',
  
  // Server Configuration
  'PORT': 'Server Port (defaults to 8080)',
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variables are missing
 */
function validateEnvironment() {
  const missing = [];
  const warnings = [];
  
  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[key]) {
      missing.push(`  - ${key}: ${description}`);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missing,
      '',
      '💡 Please set these variables in your .env file or environment.',
      '📝 See .env.example for reference.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  // Check optional variables and provide warnings
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      warnings.push(`  - ${key}: ${description}`);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set (some features may be unavailable):');
    warnings.forEach(warning => console.warn(warning));
    console.warn('');
  }
  
  console.log('✅ Environment validation passed');
  console.log(`✅ Required variables: ${Object.keys(REQUIRED_ENV_VARS).length} set`);
  console.log(`ℹ️  Optional variables: ${Object.keys(OPTIONAL_ENV_VARS).length - warnings.length}/${Object.keys(OPTIONAL_ENV_VARS).length} set`);
  console.log('');
}

/**
 * Gets an environment variable with validation
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not set (optional)
 * @returns {string} Environment variable value
 * @throws {Error} If variable is required but not set
 */
function getEnvVar(key, defaultValue = undefined) {
  const value = process.env[key];
  
  if (!value && defaultValue === undefined && REQUIRED_ENV_VARS[key]) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || defaultValue;
}

/**
 * Checks if a specific environment variable is set
 * @param {string} key - Environment variable key
 * @returns {boolean} True if set, false otherwise
 */
function hasEnvVar(key) {
  return !!process.env[key];
}

module.exports = {
  validateEnvironment,
  getEnvVar,
  hasEnvVar,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS,
};
