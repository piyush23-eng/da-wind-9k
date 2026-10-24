# WindScope Video Demo Scripts (Max 10 Minutes Total)

This document contains two distinct, timed walkthrough scripts designed for your video submission:
1. **Part 1: Customer & Business Presentation** (4.5 minutes) — Aimed at the energy utility procurement team.
2. **Part 2: Technical & Architecture Walkthrough** (4.5 minutes) — Aimed at the Lead Software Engineer.

---

## PART 1: CUSTOMER PRESENTATION (Max 5 Minutes)
**Target Audience:** Energy Utility Day-Ahead Power Traders & Procurement Managers.  
**Tone:** Professional, commercially minded, concise, and focused on risk management.

### [0:00 - 0:45] 1. The Business Problem & Market Context
- *"Hello everyone. Today I'm presenting **WindScope**, an energy-trading intelligence platform developed specifically for your day-ahead power purchasing operations."*
- *"As a UK energy utility, your goal is to meet consumer power demand across 48 settlement periods each day. A massive share of Great Britain's supply comes from wind power. Because wind is weather-dependent, your procurement team must decide how much supplemental thermal power to buy in the wholesale Day-Ahead auction on Day D-1."*
- *"If you over-rely on a wind forecast that doesn't materialize, you are caught short and hit with expensive imbalance cashout penalties. If you under-procure, you dump excess power into the grid at depressed prices."*
- *"WindScope was built to solve two exact needs: first, to give you full transparency into the latest wind forecasts available at your decision cutoff; and second, to quantitatively evaluate historical forecast accuracy so you can hedge with confidence."*

### [0:45 - 1:45] 2. Dashboard Overview & Decision-Cutoff Control
- *(Screen action: Show header, KPI cards, and cutoff selector)*
- *"Let's look at the WindScope interface. Designed as a high-density, dark trading terminal, it provides instant clarity without clutter."*
- *"Notice the **Cutoff Selector** in the header. In wholesale trading, day-ahead auction bids close on Day D-1—for example, at 11:00 UTC for EPEX SPOT or 17:00 UTC at standard market close. WindScope allows you to configure your exact cutoff."*
- *"Our matching algorithm strictly ignores any intra-day updates published after your cutoff. This guarantees that what you see is the true state of knowledge your team had when committing capital."*
- *"At a glance, our four **Executive KPI Cards** summarize performance across the selected delivery period in January 2026:*
  - *Mean Absolute Error (MAE): 1,984 MW, representing your average procurement deviation magnitude.*
  - *Root Mean Squared Error (RMSE): 2,448 MW, which penalizes severe tail risk.*
  - *Systematic Bias: +1,817 MW, highlighting a consistent overforecast tendency.*
  - *Match Coverage: 99.9%, covering 1,487 out of 1,488 half-hour settlement periods."*

### [1:45 - 2:45] 3. Time-Series Inspection & Real January 2026 Finding
- *(Screen action: Hover over the Main Time-Series Chart, show tooltips and toggle actual vs forecast)*
- *"Here on the main time-series chart, the solid green area is actual wind power delivered from Elexon FUELHH. The dashed cyan line is the day-ahead forecast from Elexon WINDFOR."*
- *"Hovering over any interval reveals the exact delivery time, Settlement Period, actual output, forecast output, and the exact publication timestamp of that forecast on Day D-1."*
- *"**Now look at the real empirical finding from January 2026:** across the month, the forecast line consistently floats *above* the actual generation area. Specifically, **87.7% of all intervals were overforecasted** (1,304 overforecast intervals vs only 183 underforecast). In extreme storm transitions, we observed single-interval overforecast spikes exceeding 7,000 MW!"*

### [2:45 - 3:45] 4. Supporting Day-Ahead Purchasing Decisions
- *(Screen action: Switch to the Error Distribution tab, then scroll down to the Interval Table)*
- *"How does your trading desk use this intelligence tomorrow?*
  - *First, by understanding that national forecasts have a +1,800 MW overforecast bias during winter wind conditions, your risk desk should apply a defensive discount factor before entering the day-ahead auction.*
  - *Second, looking at the **Error Distribution Histogram**, you can see the skew: errors are heavily clustered in the positive (overforecast) zone.*
  - *Third, our **Interval Ledger** gives your analysts an auditable, sortable record of every single half-hour period, with an instant **CSV Export** button to feed directly into your proprietary risk models."*

### [3:45 - 4:30] 5. Scope & Limitations
- *"A brief note on operational scope:*
  - *WindScope focuses on national wind power. Consumer demand, transmission constraints, and other generation types (like nuclear and solar) are tracked separately.*
  - *All values are power in Megawatts (MW). To convert to half-hourly energy (MWh), multiply by 0.5 hours.*
- *"Thank you. WindScope turns raw Elexon weather data into actionable procurement alpha. Now let's dive into the technical implementation."*

---

## PART 2: TECHNICAL WALKTHROUGH (Max 5 Minutes)
**Target Audience:** Internal Technical Lead & Engineering Reviewers.  
**Tone:** Technical, clear, architectural, and grounded in engineering best practices.

### [4:30 - 5:30] 1. Architecture & Technology Stack
- *"Hello. In this technical walkthrough, I will explain the architecture, data pipeline, forecast matching logic, testing, and deployment setup for WindScope."*
- *"Our stack was chosen for performance, type safety, and maintainability:*
  - **Backend:** Python with **FastAPI** for high-throughput asynchronous REST endpoints, and **Pandas / NumPy** for vectorized time-series processing.
  - **Frontend:** **React 18** bootstrapped with **Vite**, styled with a custom dark-navy **Tailwind CSS** theme, and visualized using **Recharts** and **Lucide Icons**.
  - **Data Source:** Official **Elexon BMRS API** via streaming endpoints for `FUELHH` and `WINDFOR`."*
- *"To ensure sub-50ms API responses, our backend implements a local disk cache under `backend/data_cache/` that pre-fetches January 2026 data in 5-day chunks, with an automatic fallback to synthetic fixtures if the external API ever experiences downtime."*

### [5:30 - 6:45] 2. Elexon Integration, Resolution Differences & Cutoff Engine
- *(Screen action: Show `backend/app/services/forecast_matcher.py` in your code editor)*
- *"Let's look at the core business logic in `forecast_matcher.py`. There are two critical engineering nuances we resolved:*
  - *First, **Look-Ahead Bias Prevention**: For any delivery interval on Day D, we compute the D-1 cutoff datetime `(D - 1 day) at {cutoff_time}`. We filter all forecasts targeting that interval where `publishTime <= cutoff_dt`, and deterministically select the row with `max(publishTime)`. Any forecast issued after the cutoff is strictly excluded.*
  - *Second, **Resolution Harmonization**: Elexon `FUELHH` outturns are published at 30-minute intervals (48 SPs/day), but Elexon `WINDFOR` forecasts are published at hourly resolution (`:00`). To provide complete half-hourly utility scheduling, our matcher defaults to `hourly_persistence` mode, where the hourly forecast covers both 30-minute periods of that hour. This achieves 99.9% coverage (1,487 / 1,488 intervals). We also support strict `exact` matching which aligns the 744 top-of-hour intervals."*

### [6:45 - 7:45] 3. Analytics, Hand-Calculated Verification & Testing
- *(Screen action: Open terminal and show `pytest tests/` output)*
- *"Code quality and data integrity are backed by a comprehensive Pytest suite containing 10 passing tests across three test modules:*
  - *`test_forecast_matcher.py` verifies cutoff filtering, rejection of post-cutoff forecasts, and deduplication.*
  - *`test_metrics.py` includes a known **hand-calculated benchmark test**: with three intervals having errors of +200, -100, and +150 MW, it verifies that MAE is exactly 150.00 MW, RMSE is 155.46 MW, and Mean Error is +83.33 MW.*
  - *`test_api_endpoints.py` tests FastAPI route contracts, status codes, and interval pagination.*
- *"Running `pytest` executes in under 3 seconds with 100% passing results."*

### [7:45 - 8:45] 4. Docker Containerization & Deployment Architecture
- *(Screen action: Show `docker-compose.yml` and `frontend/Dockerfile`)*
- *"For deployment and local execution, we provide complete containerization:*
  - *The **Backend Dockerfile** uses `python:3.11-slim`, installs pinned requirements, sets up the FastAPI daemon on port 8000, and includes a native curl health check on `/api/health`.*
  - *The **Frontend Dockerfile** uses a multi-stage build: Stage 1 compiles the Vite bundle with `node:20-alpine`, and Stage 2 serves the optimized static assets via an **Nginx** alpine image with reverse proxying for `/api/`.*
  - *`docker-compose.yml` orchestrates both services with health check dependencies, allowing any engineer to spin up the entire application with a single command: `docker-compose up --build`."*
- *"For cloud hosting, the frontend is deployed to **Vercel** with SPA routing, while the backend is deployed on a Python web service container host with environment variables configuring CORS and API endpoints."*

### [8:45 - 9:30] 5. Trade-Offs, Limitations & Next Steps
- *"Finally, engineering trade-offs:*
  - *We intentionally avoided an external relational database like PostgreSQL for this MVP. With only 1,488 intervals in January, in-memory vectorized Pandas operations deliver sub-20ms response times without database connection latency or operational overhead.*
  - *Next steps would include: integrating Elexon system cashout prices (SSP/SBP) to convert MW errors directly into financial (£) balancing penalties, and adding regional zonal wind tracking for transmission constraint analysis."*
- *"Thank you for your time. The repository and documentation are fully open for review."*
