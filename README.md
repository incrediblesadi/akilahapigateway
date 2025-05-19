# akilahapigateway

A locally tested API Gateway deployed to Cloud Run with auto-scaling, GitHub activation, and public access.

- Tested with curl, Google Cloud, and GNU[ADI]
- With multiple endpoints/routes handling defined in index.js

- Response to /gbt tests IOK:

   curl -X POST https://akilahapigateway-858627689875.us-central1.run.app/gpt \
  -H Content-Type: application/json \
  -d {\"message\": \"Hello from client!\"}


## Project: akilahstack

- Cloud Run Service: `akilahapigateway`
- Region: `us-central1`
- Live at: https://akilahapigateway-858627689875.us-central1.run.app

- Alrenate service: `firebase-adminsdk-fbsvc`
- Live at: https://firebase-adminsdk-fbsvc-858627689875.us-central1.run.app
- Purpose: Used by Firebase infrastructure or additional config (not traffic)

## Routes: 

- /gbt
  /notion
  /ping/trace
  /   (endpoint, healtcheck test)

- Notion server route confirms to be receiving regular REQ structure and JSON


## Cloud Run Service Account
- `858627689875-compute@developer.gserviceaccount.com`
   - Roles added:
    * logging.logWriter
    * cloudbuild.builds.editor


## Deployment via GitHub Actions
- Automated on `main` branch push
- Uses `run-deploy` command with `gcloud` and gives service access
- Service is set to run as unauthenticated

- Via repo: https://github.com/incrediblesadi/akilahapigateway


## Insights for Future Mentenance

- Seedling checkpoint in `index.js`
- Fallback route "/
 - Make sure template strings like this `  `console.log(`application running on port ${PORT}`)` `
- Always look for "Received GTP request" logs in Cloud Logs



[tree will be auto-inserted here]
