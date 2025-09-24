"""
Blue Sherpa Analytics Engine - Backend API
Main Flask Application Entry Point with SQLite Database
"""

from flask import Flask
from flask_cors import CORS
from flask_restful import Api
from datetime import timedelta
import os
import logging
from models import db, User, Session, Message, AmbiguityData, ProcessingStatus, ProcessingLog, Domain, ConversationCycle

# Import all resource modules
from resources.auth import AuthLogin, AuthLogout, AuthProfile
from resources.sessions import SessionsList, SessionsDetail, SessionsCreate, SessionConversationCycles
from resources.messages import MessagesList, MessagesCreate
from resources.ambiguity import (
    AmbiguityResolve, AmbiguityQuestions,
    AmbiguityAnswer, AmbiguityContext, AmbiguityCleanup
)
from resources.processing import (
    ProcessingStart, ProcessingStatus,
    ProcessingStop, ProcessingLogs, ProcessingComplete
)
from resources.analytics import (
    AnalyticsResults, AnalyticsExport, 
    AnalyticsVerify
)
from resources.config import ConfigDomains, ConfigModels
from resources.sharing import ShareCreate, ShareAccess
from resources.export import ExportPDF, ExportLogs

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
database_path = os.path.join(basedir, 'analytics_engine.db')

app.config['SECRET_KEY'] = 'blue-sherpa-analytics-secret-key-2025'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session configuration for localhost development
app.config['SESSION_COOKIE_SECURE'] = False  # Must be False for localhost without HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Set to False for debugging
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # More permissive for localhost
app.config['SESSION_COOKIE_DOMAIN'] = None  # Let Flask handle domain automatically

# Initialize database
db.init_app(app)

# ENHANCED CORS configuration - FIXED for credentials and multiple origins
CORS(app,
     supports_credentials=True,
     # Specific origins for both development and production
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "http://localhost:3001",  # backup port
         "http://127.0.0.1:3001",
         "https://analytics.bluesherpa.com",  # production domain
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=[
         "Content-Type",
         "Authorization",
         "Accept",
         "Origin",
         "X-Requested-With",
         "Access-Control-Request-Method",
         "Access-Control-Request-Headers",
         "Cookie"
     ],
     expose_headers=[
         "Content-Type",
         "Authorization",
         "Access-Control-Allow-Origin",
         "Access-Control-Allow-Credentials",
         "Set-Cookie"
     ]
)

# Initialize Flask-RESTful API
api = Api(app)

# Authentication Routes
api.add_resource(AuthLogin, '/api/auth/login')
api.add_resource(AuthLogout, '/api/auth/logout')
api.add_resource(AuthProfile, '/api/auth/profile')

# Session Management Routes
api.add_resource(SessionsCreate, '/api/sessions/create')
api.add_resource(SessionsList, '/api/sessions/list')
api.add_resource(SessionsDetail, '/api/sessions/<string:session_id>')
api.add_resource(SessionConversationCycles, '/api/sessions/<string:session_id>/cycles')

# Message Routes
api.add_resource(MessagesList, '/api/sessions/<string:session_id>/messages')
api.add_resource(MessagesCreate, '/api/sessions/<string:session_id>/messages/create')

# Ambiguity Resolution Routes
api.add_resource(AmbiguityResolve, '/api/ambiguity/resolve/<string:session_id>')
api.add_resource(AmbiguityQuestions, '/api/ambiguity/questions/<string:session_id>')
api.add_resource(AmbiguityAnswer, '/api/ambiguity/answer/<string:session_id>')
api.add_resource(AmbiguityContext, '/api/ambiguity/context/<string:session_id>')
api.add_resource(AmbiguityCleanup, '/api/ambiguity/cleanup/<string:session_id>')

# Processing Routes
api.add_resource(ProcessingStart, '/api/processing/start/<string:session_id>')
api.add_resource(ProcessingStatus, '/api/processing/status/<string:session_id>')
api.add_resource(ProcessingStop, '/api/processing/stop/<string:session_id>')
api.add_resource(ProcessingComplete, '/api/processing/complete/<string:session_id>')
api.add_resource(ProcessingLogs, '/api/processing/logs/<string:session_id>')

# Analytics Results Routes
api.add_resource(AnalyticsResults, '/api/results/<string:session_id>')
api.add_resource(AnalyticsExport, '/api/results/<string:session_id>/export')
api.add_resource(AnalyticsVerify, '/api/results/<string:session_id>/verify')

# Configuration Routes
api.add_resource(ConfigDomains, '/api/config/domains')
api.add_resource(ConfigModels, '/api/config/models')

# Sharing Routes
api.add_resource(ShareCreate, '/api/share/create')
api.add_resource(ShareAccess, '/api/share/<string:token>')

# Export Routes
api.add_resource(ExportPDF, '/api/export/<string:session_id>/pdf')
api.add_resource(ExportLogs, '/api/export/<string:session_id>/logs')

@app.route('/')
def index():
    return {
        'message': 'Blue Sherpa Analytics Engine API',
        'version': '1.0.0',
        'status': 'running'
    }

@app.route('/api/health')
def health_check():
    return {
        'status': 'healthy',
        'service': 'analytics-engine-api'
    }

@app.route('/api/test-session')
def test_session():
    """Test endpoint to check session functionality"""
    from flask import session

    # Set a test value in session
    session['test'] = 'session_working'
    session.permanent = True

    logger.info(f"Test session set: {dict(session)}")

    return {
        'message': 'Session test',
        'session_data': dict(session),
        'session_id': session.get('_permanent', 'No session ID')
    }

# Add error handlers for better debugging
@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return {
        'success': False,
        'error': {
            'message': 'Internal server error',
            'code': 'INTERNAL_ERROR',
            'status_code': 500
        }
    }, 500

@app.errorhandler(404)
def not_found_error(error):
    return {
        'success': False,
        'error': {
            'message': 'Resource not found',
            'code': 'NOT_FOUND',
            'status_code': 404
        }
    }, 404

# Add preflight CORS handler and request logging
@app.before_request
def handle_preflight():
    from flask import request, session

    # Log all requests for debugging
    logger.debug(f"Request: {request.method} {request.path}")
    logger.debug(f"Origin: {request.headers.get('Origin')}")
    logger.debug(f"Cookies: {request.cookies}")
    logger.debug(f"Session before: {dict(session)}")

    if request.method == "OPTIONS":
        # Handle preflight request
        response = app.make_default_options_response()
        headers = response.headers
        headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,Origin,X-Requested-With'
        headers['Access-Control-Allow-Credentials'] = 'true'
        return response

def init_database():
    """Initialize database with seed data"""
    with app.app_context():
        # Create all tables
        db.create_all()

        # Add default users if they don't exist
        if not User.query.filter_by(email='sarah.johnson@bluesherpa.com').first():
            user1 = User(
                id='user_1',
                email='sarah.johnson@bluesherpa.com',
                name='Sarah Johnson',
                role='Data Analyst'
            )
            db.session.add(user1)

        if not User.query.filter_by(email='admin@bluesherpa.com').first():
            admin = User(
                id='user_admin',
                email='admin@bluesherpa.com',
                name='Admin User',
                role='Administrator'
            )
            db.session.add(admin)

        # Add default domains
        from config import Config
        for domain in Config.SUPPORTED_DOMAINS:
            domain_id = domain.lower().replace(' ', '_')
            if not Domain.query.filter_by(id=domain_id).first():
                domain_obj = Domain(
                    id=domain_id,
                    name=domain,
                    description=f'{domain} analytics and insights'
                )
                db.session.add(domain_obj)

        try:
            db.session.commit()
            print("Database initialized successfully")
        except Exception as e:
            db.session.rollback()
            print(f"Error initializing database: {e}")

if __name__ == '__main__':
    init_database()
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True
    )