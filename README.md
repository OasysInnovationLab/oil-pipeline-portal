# Oil Pipeline Portal

Pipeline Status Portal for OIL Software Factory - Track CI/CD pipeline status and get actionable insights.

## Features

- 🔐 **Keycloak SSO Authentication** - Secure access via OIL Identity Provider
- 📊 **Pipeline Dashboard** - View pipeline runs across all repositories
- � **Executive Dashboard** - High-level overview for executives and stakeholders
- 🔍 **Run Details** - Detailed job status, steps, and timing information
- 📦 **Deployment Summaries** - Track what changed in each deployment
- 🔧 **Corrective Actions** - Intelligent suggestions for fixing pipeline failures
- 🔗 **Git Integration** - Direct links to commits, PRs, and diffs
- 🔔 **Real-time Notifications** - Get notified when pipelines complete
- 🌙 **Dark Mode** - Automatic theme switching based on system preferences

## Views

### Pipeline Dashboard (`/`)

The main dashboard shows all recent pipeline runs across repositories with:
- Real-time status updates from GitHub Actions
- Filtering by status (success, failure, in-progress)
- Live notifications when pipelines complete
- Statistics including success rate and average duration

### Executive Dashboard (`/executive`)

A high-level view designed for executives and stakeholders:
- Key metrics: total deployments, success rate, average build time
- Active pipelines with progress indicators
- Environment health overview (dev/staging/prod)
- Recent activity feed
- Period selector (today/this week/this month)

### Run Detail (`/runs/:owner/:repo/:runId`)

Detailed view of individual pipeline runs:
- Deployment summary showing what changed
- Job timeline with step-by-step progress
- Corrective actions for failures
- Direct links to GitHub

## Quick Start

### Prerequisites

- Node.js 18+
- npm or bun

### Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

### Build for Production

```bash
npm run build
```

### Deploy to S3


### Deploy to S3 (via GitHub Actions)

Deployment is now handled automatically by GitHub Actions:

- **Production deploy:** Merge or push to the `main` branch. The workflow will build and deploy to S3/CloudFront.
- **Manual deploy:** You can also trigger the workflow manually from the GitHub Actions tab.

#### (Optional) Local Deploy

If you need to deploy manually from your machine:

```bash
# Set environment variables
export PORTAL_BUCKET=oil-pipeline-portal-dev-432780980329
export CF_DISTRIBUTION_ID=EXXXXXXXXXX

# Build and deploy
npm run deploy
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    pipelines.dev.oasysic.net                     │
├─────────────────────────────────────────────────────────────────┤
│  CloudFront → S3 Static Site (React SPA)                        │
│       │                                                          │
│       ├─ Keycloak OIDC Authentication (OIL realm)               │
│       │                                                          │
│       └─ S3 API (pipeline results bucket)                       │
│            └─ /api/* → oil-pipeline-results bucket               │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── api/              # API clients for S3 data fetching
├── components/
│   ├── pipeline/     # Pipeline-specific components
│   └── ui/           # shadcn/ui base components
├── hooks/            # React hooks (auth, pipelines)
├── lib/              # Utilities (Keycloak config, helpers)
├── pages/            # Page components
└── types/            # TypeScript type definitions
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_KEYCLOAK_URL` | Keycloak server URL | `https://auth.oasysic.net` |
| `VITE_KEYCLOAK_REALM` | Keycloak realm name | `OIL` |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `pipeline-portal` |
| `VITE_API_URL` | API base URL (for proxying) | `/api` |

## Related Infrastructure

- **Terraform modules**: `uscg-iac/modules/s3-pipeline-results/`, `uscg-iac/modules/s3-static-site/`
- **Pipeline reporting**: `uscg-ci/.github/workflows/pipeline-report.yml`
- **Keycloak config**: `oil-keycloak/config/clients/pipeline-portal.json`

## License

Private - Oasys Innovation Lab
