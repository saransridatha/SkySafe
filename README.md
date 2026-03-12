# SkySafe: Aviation Risk Intelligence Platform

SkySafe is an advanced risk assessment and situational awareness platform designed for aviation analysts and security professionals. It provides a unified, context-aware intelligence layer by synthesizing disparate data vectors into actionable safety insights for commercial flight operations.

## Core Capabilities

The platform integrates multi-source intelligence to evaluate flight safety through the following analytical engines:

*   **Generative Risk Synthesis**: Utilizes Google Gemini 2.0 (Flash) to perform cross-domain analysis of geopolitical, mechanical, and operational factors, producing a weighted risk index (1-10) with detailed explanations.
*   **Geospatial Conflict Mapping**: Dynamically evaluates flight trajectories against real-time conflict zones and high-risk airspaces using Leaflet-based visualization and great-circle route generation.
*   **Intelligence Aggregation**: Monitors global news cycles and security feeds to detect emerging geopolitical threats related to points of departure, arrival, and transit.
*   **Fleet and Carrier Profiling**: Analyzes historical safety performance, hull loss metrics, and maintenance records of specific aircraft models and airline operators.
*   **Interactive Visualization**: Provides high-fidelity mapping and data visualization using Recharts and Three.js (React Three Fiber) for spatial orientation and threat identification.
*   **Resilient Data Pipeline**: Implements a highly durable, multi-tiered caching strategy utilizing LRU (in-memory), SQLite (local persistent), and MongoDB (distributed) to ensure low-latency performance and rate-limit protection for external APIs like AviationStack.

## Technical Architecture

SkySafe is architected for scalability and reliability, employing a modern micro-services-oriented approach within a Next.js framework.

### Infrastructure and Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript 5 (Strict Mode)
*   **Artificial Intelligence**: Google Generative AI (Gemini 2.0 Flash)
*   **Database/Cache**: Better-SQLite3 & MongoDB
*   **Mapping & 3D**: Leaflet / React-Leaflet, Three.js / React Three Fiber
*   **Data Validation**: Zod
*   **Styling**: Tailwind CSS with Glassmorphism / HUD principles

## Development Operations

### Prerequisites

*   Node.js (Version 20.x or higher)
*   NPM
*   Docker / Podman (for containerized deployment)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd skysafe
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Environment Configuration:
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    AVIATIONSTACK_API_KEY=your_aviationstack_key
    GNEWS_API_KEY=your_gnews_key
    NEWSAPI_KEY=your_newsapi_key
    MONGODB_URI=your_mongodb_connection_string
    ```

### Execution

*   **Development**: `npm run dev`
*   **Production Build**: `npm run build`
*   **Static Analysis**: `npm run typecheck`

### Containerization & Deployment

The platform is fully containerized for production deployment and includes automated CI/CD via GitHub Actions.

Run locally using Docker Compose:
```bash
docker compose up --build -d
```

**VPS Deployment**:
The repository includes a GitHub Action (`.github/workflows/deploy.yml`) configured to automatically deploy to a VPS via SSH using `podman-compose` when changes are pushed to the `main` branch.

## Directory Taxonomy

| Directory | Responsibility |
| :--- | :--- |
| `/app` | Application routing and server-side page logic. |
| `/components` | Modular UI components and visualization modules. |
| `/lib/services` | Domain-specific logic and external API orchestrators. |
| `/lib/cache` | Performance optimization (LRU) and SQLite persistence layers. |
| `/lib/db` | MongoDB integration and distributed data layer. |
| `/data` | Static datasets for baseline safety profiling, flights, and conflict zones. |
| `/styles` | Global and component-level CSS definitions. |
| `/.github` | CI/CD workflows for automated Podman deployments. |

## Disclaimer

SkySafe is provided for analytical and informational purposes only. Aviation safety profiles and geopolitical situations are subject to rapid change. This platform does not supersede official directives from civil aviation authorities, government travel advisories, or airline safety communications.

## License

This project is licensed under the MIT License.
