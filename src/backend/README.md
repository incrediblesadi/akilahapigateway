# Backend Directory

This directory contains backend code for the API gateway service. The GitHub Actions workflow in `.github/workflows/deploy.yml` is configured to deploy to Cloud Run when changes are made to files in this directory.

## Structure

Place backend code and related files in this directory.

## Deployment

Deployment is automatically triggered when changes are pushed to the main branch and affect files in this directory or the deploy.yml workflow file itself.