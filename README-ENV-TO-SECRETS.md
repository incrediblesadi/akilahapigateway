# Environment Variables to GitHub Secrets

This tool extracts key-value pairs from a `.env` file and creates corresponding GitHub secrets.

## Prerequisites

- Node.js 14 or higher
- A GitHub Personal Access Token with the `repo` scope
- A `.env` file containing the secrets you want to create

## Installation

```bash
# Install dependencies
npm install

# Make the CLI script executable
chmod +x ./bin/env-to-secrets
```

## Usage

### Using the CLI

```bash
# Set your GitHub token as an environment variable
export GITHUB_PAT=your_github_token

# Run the script
./bin/env-to-secrets <owner> <repo> [env-file-path]
```

### Using npm script

```bash
# Set your GitHub token as an environment variable
export GITHUB_PAT=your_github_token

# Run the script
npm run env-to-secrets -- <owner> <repo> [env-file-path]
```

### Using the Node.js script directly

```bash
# Set your GitHub token as an environment variable
export GITHUB_PAT=your_github_token

# Run the script
node src/env-to-github-secrets.js <owner> <repo> [env-file-path]
```

## Arguments

- `owner`: GitHub repository owner/organization
- `repo`: GitHub repository name
- `env-file-path`: (Optional) Path to .env file, defaults to '.env' in the current directory

## Example

```bash
# Create GitHub secrets from the .env file in the current directory
export GITHUB_PAT=ghp_1234567890abcdefghijklmnopqrstuvwxyz
./bin/env-to-secrets myorg myrepo

# Create GitHub secrets from a specific .env file
./bin/env-to-secrets myorg myrepo ./config/.env.production
```

## Features

- Extracts key-value pairs from a `.env` file
- Skips comments and empty lines
- Encrypts secret values using sodium encryption
- Creates or updates GitHub secrets via the GitHub API
- Handles quoted values in the `.env` file

## Security Notes

- Never commit your `.env` files or GitHub tokens to version control
- Use environment variables to pass sensitive information to the script
- Consider using GitHub's OIDC integration for CI/CD workflows instead of long-lived tokens

## Testing

```bash
# Run tests
npm test
```