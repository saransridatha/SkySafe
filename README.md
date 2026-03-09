# SkySafe: Aviation Risk Intelligence Platform

SkySafe is an advanced risk assessment and situational awareness platform designed for aviation analysts and security professionals. It provides a unified, context-aware intelligence layer by synthesizing disparate data vectors into actionable safety insights for commercial flight operations.

## Core Capabilities

The platform integrates multi-source intelligence to evaluate flight safety through the following analytical engines:

*   **Generative Risk Synthesis**: Utilizes Google Gemini 2.0 to perform cross-domain analysis of geopolitical, mechanical, and operational factors, producing a weighted risk index.
*   **Geospatial Conflict Mapping**: Dynamically evaluates flight trajectories against real-time conflict zones and high-risk airspaces.
*   **Intelligence Aggregation**: Monitors global news cycles and security feeds to detect emerging threats related to points of departure, arrival, and transit.
*   **Fleet and Carrier Profiling**: Analyzes historical safety performance, hull loss metrics, and maintenance records of specific aircraft models and airline operators.
*   **Interactive Visualization**: Provides high-fidelity mapping and data visualization for spatial orientation and threat identification.
*   **Distributed Caching Layer**: Implements a hybrid caching strategy using LRU (in-memory) and SQLite (persistent) to ensure low-latency performance and API efficiency.

## Technical Architecture

SkySafe is architected for scalability and reliability, employing a modern micro-services-oriented approach within a monolithic Next.js framework.

### Infrastructure and Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript 5 (Strict Mode)
*   **Artificial Intelligence**: Google Generative AI (Gemini Pro)
*   **Database/Cache**: Better-SQLite3
*   **Mapping Engine**: Leaflet / React-Leaflet
*   **Data Validation**: Zod
*   **Styling**: Modular CSS with Glassmorphism principles

### External Integrations

*   **AviationStack**: Real-time flight tracking and scheduling data.
*   **GNews / NewsAPI**: Global security and geopolitical news streams.

## Development Operations

### Prerequisites

*   Node.js (LTS Version 18.x or higher)
*   NPM or Yarn package manager

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
    Create a `.env` file in the root directory with the following parameters:
    ```env
    GEMINI_API_KEY=your_api_key
    AVIATIONSTACK_API_KEY=your_api_key
    GNEWS_API_KEY=your_api_key
    NEWSAPI_KEY=your_api_key
    ```

### Execution

*   **Development**: `npm run dev`
*   **Production Build**: `npm run build`
*   **Static Analysis**: `npm run typecheck`

## Directory Taxonomy

| Directory | Responsibility |
| :--- | :--- |
| `/app` | Application routing and server-side page logic. |
| `/components` | Modular UI components and visualization modules. |
| `/lib/services` | Domain-specific logic and external API orchestrators. |
| `/lib/cache` | Performance optimization and data persistence layers. |
| `/lib/utils` | Shared utility functions and risk calculation algorithms. |
| `/data` | Static datasets for baseline safety profiling. |
| `/styles` | Global and component-level CSS definitions. |

## Disclaimer

SkySafe is provided for analytical and informational purposes only. Aviation safety profiles and geopolitical situations are subject to rapid change. This platform does not supersede official directives from civil aviation authorities, government travel advisories, or airline safety communications.

## License

This project is licensed under the MIT License.
