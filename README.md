# SkySafe: Aviation Risk Intelligence Platform

SkySafe is an advanced risk assessment and situational awareness platform designed for aviation analysts and security professionals. It provides a unified, context-aware intelligence layer by synthesizing disparate data vectors into actionable safety insights for commercial flight operations.

## Core Capabilities

The platform integrates multi-source intelligence to evaluate flight safety through the following analytical engines:

*   **Generative Risk Synthesis**: Utilizes Google Gemini 2.0 (Flash) to perform cross-domain analysis of geopolitical, mechanical, and operational factors, producing a weighted risk index (1-10).
*   **Geospatial Conflict Mapping**: Dynamically evaluates flight trajectories against real-time conflict zones and high-risk airspaces using Leaflet-based visualization.
*   **Intelligence Aggregation**: Monitors global news cycles and security feeds (via GNews and NewsAPI) to detect emerging threats related to points of departure, arrival, and transit.
*   **Fleet and Carrier Profiling**: Analyzes historical safety performance, hull loss metrics, and maintenance records of specific aircraft models and airline operators.
*   **Interactive Visualization**: Provides high-fidelity mapping and data visualization (Recharts) for spatial orientation and threat identification.
*   **Distributed Caching Layer**: Implements a hybrid caching strategy using LRU (in-memory) and SQLite (persistent) to ensure low-latency performance and API efficiency.

## Risk Scoring Engine

The platform calculates a Safety Risk Score (1-10) by processing five primary data vectors:

1.  **Flight Trajectory**: Real-time position and planned path.
2.  **Aircraft Profile**: Historical hull loss rates and mechanical reliability.
3.  **Carrier Performance**: Airline safety ranking and operational risk band.
4.  **Geospatial Risk**: Proximity to conflict zones and restricted airspaces.
5.  **Signal Intelligence**: Real-time geopolitical threat levels derived from global news headlines.

The Gemini 2.0 model synthesizes these inputs to provide a confidence-scored risk assessment, including an explanation of primary risk drivers.

## Technical Architecture

SkySafe is architected for scalability and reliability, employing a modern micro-services-oriented approach within a Next.js framework.

### Infrastructure and Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript 5 (Strict Mode)
*   **Artificial Intelligence**: Google Generative AI (Gemini 2.0 Flash)
*   **Database/Cache**: Better-SQLite3
*   **Mapping Engine**: Leaflet / React-Leaflet
*   **Data Validation**: Zod
*   **Styling**: Modular CSS with Glassmorphism principles

### API Surface

The platform exposes several internal API endpoints for data orchestration:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/flight/search` | GET | Search for real-time flight data by number or route. |
| `/api/risk/score` | POST | Generate a Gemini-powered risk assessment for a specific flight. |
| `/api/path/analyze` | POST | Perform geospatial analysis of a flight path against conflict zones. |
| `/api/news` | GET | Retrieve filtered geopolitical intelligence for specific regions. |
| `/api/aircraft/[icaoType]` | GET | Retrieve safety profiles for specific aircraft models. |

## Development Operations

### Prerequisites

*   Node.js (Version 20.x or higher)
*   NPM or Yarn package manager
*   Docker and Docker Compose (optional for containerized deployment)

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
    ```

### Execution

*   **Development**: `npm run dev`
*   **Production Build**: `npm run build`
*   **Static Analysis**: `npm run typecheck`

### Containerization

The platform is fully containerized for production deployment:

```bash
docker compose up --build -d
```

The Dockerfile utilizes a multi-stage build process to optimize image size and includes native build tools for `better-sqlite3`.

## Directory Taxonomy

| Directory | Responsibility |
| :--- | :--- |
| `/app` | Application routing and server-side page logic. |
| `/components` | Modular UI components and visualization modules. |
| `/lib/services` | Domain-specific logic and external API orchestrators. |
| `/lib/cache` | Performance optimization and data persistence layers. |
| `/lib/schemas` | Zod validation schemas for API requests and responses. |
| `/data` | Static datasets for baseline safety profiling and conflict zones. |
| `/styles` | Global and component-level CSS definitions. |

## Disclaimer

SkySafe is provided for analytical and informational purposes only. Aviation safety profiles and geopolitical situations are subject to rapid change. This platform does not supersede official directives from civil aviation authorities, government travel advisories, or airline safety communications.

## License

This project is licensed under the MIT License.
