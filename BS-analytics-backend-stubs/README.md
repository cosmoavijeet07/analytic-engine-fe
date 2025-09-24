# Blue Sherpa Analytics Engine - Backend API

## Project Structure

```
blue-sherpa-backend/
├── app.py                 # Main Flask application entry point
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── data/
│   └── store.py          # In-memory data storage
├── resources/
│   ├── __init__.py       # Empty file to make it a package
│   ├── auth.py           # Authentication endpoints
│   ├── sessions.py       # Session management endpoints
│   ├── messages.py       # Message handling endpoints
│   ├── ambiguity.py      # Ambiguity resolution endpoints
│   ├── processing.py     # Processing pipeline endpoints
│   ├── analytics.py      # Analytics results endpoints
│   ├── config.py         # Configuration endpoints
│   ├── sharing.py        # Sharing and collaboration endpoints
│   └── export.py         # Export functionality endpoints
├── utils/
│   ├── __init__.py       # Empty file to make it a package
│   └── helpers.py        # Utility helper functions
└── README.md             # Project documentation
```

## Setup Instructions

### 1. Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### 2. Installation

1. **Create project directory:**
   ```bash
   mkdir blue-sherpa-backend
   cd blue-sherpa-backend
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create package directories:**
   ```bash
   mkdir data resources utils
   touch resources/__init__.py utils/__init__.py
   ```

5. **Copy all the code files** to their respective locations as shown in the project structure above.

### 3. Running the Application

1. **Start the Flask server:**
   ```bash
   python app.py
   ```

2. **The API will be available at:**
   ```
   http://localhost:5000
   ```

3. **API Health Check:**
   ```
   GET http://localhost:5000/api/health
   ```

### 4. Frontend Integration

Update your Next.js frontend to point to the Flask backend:

1. **Update API base URL in your frontend:**
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. **Example API calls from frontend:**
   ```javascript
   // Login
   const response = await fetch(`${API_BASE_URL}/auth/login`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     credentials: 'include', // Important for session cookies
     body: JSON.stringify({ email, password })
   });

   // Create session
   const sessionResponse = await fetch(`${API_BASE_URL}/sessions/create`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     credentials: 'include',
     body: JSON.stringify({ title, domain })
   });
   ```

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Session Management
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/list` - Get user sessions
- `GET /api/sessions/{id}` - Get session details
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session

### Messages
- `GET /api/sessions/{id}/messages` - Get session messages
- `POST /api/sessions/{id}/messages/create` - Create new message

### Ambiguity Resolution
- `POST /api/ambiguity/resolve/{session_id}` - Start/continue resolution
- `GET /api/ambiguity/questions/{session_id}` - Get questions
- `POST /api/ambiguity/answer/{session_id}` - Submit answer
- `GET /api/ambiguity/context/{session_id}` - Get context

### Processing
- `POST /api/processing/start/{session_id}` - Start processing
- `GET /api/processing/status/{session_id}` - Get status
- `POST /api/processing/stop/{session_id}` - Force stop
- `GET /api/processing/logs/{session_id}` - Get logs

### Analytics Results
- `GET /api/results/{session_id}` - Get results
- `GET /api/results/{session_id}/export` - Export results
- `POST /api/results/{session_id}/verify` - Verify results

### Configuration
- `GET /api/config/domains` - Get domains
- `POST /api/config/domains` - Add domain
- `GET /api/config/models` - Get models config

### Sharing & Export
- `POST /api/share/create` - Create share link
- `GET /api/share/{token}` - Access shared session
- `GET /api/export/{session_id}/pdf` - Export PDF
- `GET /api/export/{session_id}/logs` - Export logs

## Key Features Implemented

### ✅ Complete Functionality Coverage
- **Authentication**: Login/logout with session management
- **Session Management**: CRUD operations for analytics sessions
- **Message System**: User messages, ambiguity resolution, assistant responses
- **Ambiguity Resolution**: Domain-specific questions, progressive answers, context confirmation
- **Processing Pipeline**: Multi-stage simulation with realistic progress and logs
- **Analytics Results**: Configurable markdown results with verification
- **Export System**: PDF, CSV, JSON export options
- **Sharing**: Shareable links with access control
- **Configuration**: Dynamic domains, LLM models, processing parameters

### ✅ Realistic Simulation
- **Progressive Processing**: Multi-stage pipeline with realistic timing
- **Live Logs**: Real-time log generation during processing
- **Verification System**: Random verification badges (verified/partial/failed)
- **Force Stop**: Ability to interrupt processing
- **Context Generation**: Domain-specific ambiguity questions and context summaries

### ✅ Frontend Integration Ready
- **CORS Enabled**: Cross-origin requests supported
- **RESTful APIs**: Standard HTTP methods and status codes
- **JSON Responses**: Consistent response format
- **Session Support**: Cookie-based authentication
- **Error Handling**: Proper error messages and codes

## Development Notes

### Data Persistence
- All data is stored in memory using thread-safe dictionaries
- Data will be lost when the server restarts
- For production, replace with a proper database

### Authentication
- Simple email/password authentication (any valid email works for demo)
- Sessions are stored server-side
- For production, implement proper password hashing and validation

### Processing Simulation
- Uses background threads to simulate processing
- Configurable timing based on processing time parameter
- Generates realistic logs and progress updates

### Testing the Backend
You can test the API endpoints using tools like:
- **Postman** - GUI-based API testing
- **curl** - Command line HTTP client  
- **Python requests** - Programmatic testing

Example curl command:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@bluesherpa.com", "password": "password123"}' \
  -c cookies.txt

curl -X GET http://localhost:5000/api/sessions/list \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

This backend provides a fully functional API that supports all the frontend components and user workflows described in your system documentation.