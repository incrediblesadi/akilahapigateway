const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      actions: {
        getRepoPublicKey: jest.fn().mockResolvedValue({
          data: {
            key: 'mocked-public-key',
            key_id: 'mocked-key-id'
          }
        }),
        createOrUpdateRepoSecret: jest.fn().mockResolvedValue({
          status: 201
        })
      }
    }))
  };
});

jest.mock('tweetsodium', () => ({
  seal: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
}));

// Import the module with mocked dependencies
const { parseEnvFile, createOrUpdateSecret, main } = require('../src/env-to-github-secrets');
const { Octokit } = require('@octokit/rest');
const sodium = require('tweetsodium');

describe('env-to-github-secrets', () => {
  const testEnvPath = path.join(__dirname, 'test.env');
  
  beforeEach(() => {
    // Create a test .env file
    fs.writeFileSync(testEnvPath, `
# Test comment
TEST_KEY1=test_value1
TEST_KEY2="test_value2"
TEST_KEY3=test_value3

# Another comment
TEST_KEY4=test_value4
    `);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Set environment variable for testing
    process.env.GITHUB_PAT = 'test-token';
  });
  
  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
    
    // Clean up environment variable
    delete process.env.GITHUB_PAT;
  });
  
  test('should parse .env file correctly', async () => {
    // Call the parseEnvFile function
    const envVars = await parseEnvFile(testEnvPath);
    
    // Verify the parsed environment variables
    expect(envVars).toEqual({
      TEST_KEY1: 'test_value1',
      TEST_KEY2: 'test_value2',
      TEST_KEY3: 'test_value3',
      TEST_KEY4: 'test_value4'
    });
  });
  
  test('should create GitHub secrets for each environment variable', async () => {
    // Call the main function with test parameters
    await main('test-owner', 'test-repo', testEnvPath);
    
    const mockOctokit = Octokit.mock.results[0].value;
    
    // Verify that getRepoPublicKey was called for each secret
    expect(mockOctokit.actions.getRepoPublicKey).toHaveBeenCalledTimes(4);
    
    // Verify that createOrUpdateRepoSecret was called for each secret
    expect(mockOctokit.actions.createOrUpdateRepoSecret).toHaveBeenCalledTimes(4);
    
    // Verify the calls to createOrUpdateRepoSecret
    expect(mockOctokit.actions.createOrUpdateRepoSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        secret_name: 'TEST_KEY1',
        encrypted_value: expect.any(String),
        key_id: 'mocked-key-id'
      })
    );
    
    expect(mockOctokit.actions.createOrUpdateRepoSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        secret_name: 'TEST_KEY2',
        encrypted_value: expect.any(String),
        key_id: 'mocked-key-id'
      })
    );
  });
  
  test('should encrypt secret values using sodium', async () => {
    // Call the createOrUpdateSecret function
    await createOrUpdateSecret('test-owner', 'test-repo', 'TEST_SECRET', 'test-value');
    
    // Verify that sodium.seal was called with the correct arguments
    expect(sodium.seal).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(Buffer)
    );
  });
});