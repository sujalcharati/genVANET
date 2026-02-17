# GenVANET - Local Setup Guide (Windows)

A Generative AI-based decision support system for vehicular networks. This guide will help you set up and run the entire project on Windows.

## Prerequisites

You need to install these 4 things:

| # | Software | Download Link |
|---|----------|--------------|
| 1 | **Python 3.10+** | https://www.python.org/downloads/ |
| 2 | **Node.js 18+** | https://nodejs.org/ |
| 3 | **SUMO 1.18+** | https://sumo.dlr.de/docs/Downloads.php |
| 4 | **Ollama** | https://ollama.com/download |
| 5 | **Git** | https://git-scm.com/downloads |

---

## Step 1: Clone the Repository

```bash
git clone <repo-url>
cd genVANET
```

---

## Step 2: Set Up SUMO

### Install SUMO
- Download the Windows installer from https://sumo.dlr.de/docs/Downloads.php
- Run the installer (use default settings)

### Set SUMO_HOME Environment Variable
After installing, you MUST set the `SUMO_HOME` environment variable:

1. Open **Start Menu** -> search **"Environment Variables"** -> click **"Edit the system environment variables"**
2. Click **"Environment Variables"** button
3. Under **System variables**, click **"New"**
4. Set:
   - Variable name: `SUMO_HOME`
   - Variable value: `C:\Program Files (x86)\Eclipse\Sumo` (or wherever you installed it)
5. Also add SUMO to your **PATH**:
   - Find `Path` in System variables -> click **Edit**
   - Add: `C:\Program Files (x86)\Eclipse\Sumo\bin`
6. Click OK on everything and **restart your terminal**

### Verify SUMO Installation
Open a **new** Command Prompt or PowerShell:
```bash
sumo --version
```
You should see something like: `Eclipse SUMO sumo Version 1.18.0`

### Test the Network
```bash
sumo-gui -c genvanet.sumocfg
```
This should open the SUMO GUI showing the road network.

---

## Step 3: Set Up the Backend (Python + FastAPI)

### Create a Virtual Environment
```bash
cd backend
python -m venv venv
```

### Activate the Virtual Environment
```bash
# Windows Command Prompt
venv\Scripts\activate

# Windows PowerShell
venv\Scripts\Activate.ps1
```

### Install Python Dependencies
```bash
pip install fastapi uvicorn requests
```

### Install SUMO Python Tools (TraCI)
```bash
pip install traci
```

If `pip install traci` doesn't work, try:
```bash
pip install eclipse-sumo
```

Or manually point to SUMO's Python tools:
```bash
set PYTHONPATH=%SUMO_HOME%\tools
```

### Start the Backend Server
From the project root (not the backend folder):
```bash
cd ..
uvicorn backend.app.main:app --reload --port 8000
```

### Verify Backend
Open browser: http://localhost:8000/docs

You should see the Swagger UI with these endpoints:
- `GET /simulate/options`
- `POST /simulate`
- `POST /predict`

---

## Step 4: Set Up Ollama (AI Model)

### Install Ollama
- Download from https://ollama.com/download
- Run the installer

### Pull the TinyLlama Model
Open a terminal and run:
```bash
ollama pull tinyllama
```
This downloads ~637 MB.

### Verify Ollama is Running
```bash
ollama list
```
You should see `tinyllama` in the list.

### Test the Model
```bash
ollama run tinyllama "Hello, predict traffic for me"
```

### Important: Keep Ollama Running
Ollama needs to be running in the background when using the app. If it's not running:
```bash
ollama serve
```

---

## Step 5: Set Up the Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at: http://localhost:5173

---

## Running the Full Application

You need **3 terminals** running simultaneously:

### Terminal 1: Ollama (AI Model)
```bash
ollama serve
```
(Skip if Ollama is already running in the background)

### Terminal 2: Backend (FastAPI)
From the project root:
```bash
uvicorn backend.app.main:app --reload --port 8000
```

### Terminal 3: Frontend (React)
```bash
cd frontend
npm run dev
```

### Open the App
Go to: http://localhost:5173

---

## How to Use

1. Select a **traffic scenario** (density, vehicle mix, pattern)
2. Click **Run Simulation** to see SUMO traffic data
3. Use the **Predict** feature to get AI-generated traffic predictions
   - Choose vehicle type (car / ambulance)
   - Choose objective (fast / safe)
   - The system runs SUMO -> sends data to TinyLlama -> validates -> shows results

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/simulate/options` | Get available scenario options |
| POST | `/simulate` | Run SUMO simulation, return traffic data |
| POST | `/predict` | Run simulation + AI prediction + validation |

### Example: Test /predict with curl
```bash
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"density\": \"high\", \"vehicle_type\": \"car\", \"objective\": \"fast\"}"
```

---

## Project Structure

```
genVANET/
├── genvanet.net.xml          # SUMO road network
├── genvanet.rou.xml          # SUMO default route file
├── genvanet.sumocfg          # SUMO configuration
│
├── backend/
│   └── app/
│       ├── main.py           # FastAPI server (/simulate, /predict)
│       ├── ai_model.py       # Ollama/TinyLlama integration
│       ├── validator.py      # Rule-based validation
│       └── traci/
│           ├── main.py       # SUMO TraCI connector
│           └── scenario.py   # Dynamic scenario generator
│
└── frontend/
    └── src/
        ├── App.jsx           # Main React component
        ├── api.js            # API client
        └── components/
            ├── ScenarioForm.jsx
            ├── Summary.jsx
            ├── StepSlider.jsx
            ├── EdgeTable.jsx
            └── VehicleTable.jsx
```

---

## Troubleshooting

### "sumo: command not found"
- Make sure SUMO is installed and `SUMO_HOME` is set
- Make sure SUMO's `bin` folder is in your PATH
- Restart your terminal after setting environment variables

### "Cannot connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check if it's listening: open http://localhost:11434 in browser

### "traci module not found"
```bash
pip install traci
```
Or set PYTHONPATH:
```bash
set PYTHONPATH=%SUMO_HOME%\tools
```

### "CORS error in frontend"
- Make sure the backend is running on port 8000
- The backend already has CORS configured to allow all origins

### "Simulation produced no data"
- Make sure your SUMO network file (genvanet.net.xml) is valid
- Try running: `sumo -c genvanet.sumocfg` to check for errors

### Frontend not loading
```bash
cd frontend
npm install
npm run dev
```
Make sure Node.js 18+ is installed: `node --version`
