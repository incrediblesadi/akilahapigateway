/**
 * Simple test file to verify the backend directory structure
 * This ensures that the directory referenced in the deploy.yml workflow exists
 * and is properly set up for future development.
 */

const fs = require('fs');
const path = require('path');

describe('Backend Directory Structure', () => {
  test('backend directory exists', () => {
    const backendDirExists = fs.existsSync(path.resolve(__dirname, '..'));
    expect(backendDirExists).toBe(true);
  });

  test('README.md exists in backend directory', () => {
    const readmePath = path.resolve(__dirname, '../README.md');
    const readmeExists = fs.existsSync(readmePath);
    expect(readmeExists).toBe(true);
  });

  test('README.md contains information about deployment workflow', () => {
    const readmePath = path.resolve(__dirname, '../README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    expect(readmeContent).toContain('deploy.yml');
    expect(readmeContent).toContain('GitHub Actions');
  });
});