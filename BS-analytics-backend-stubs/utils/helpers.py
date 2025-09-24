"""
Utility helper functions for Blue Sherpa Analytics Engine
"""

import re
from functools import wraps
from flask import session, jsonify
from datetime import datetime, timedelta

def success_response(data, status_code=200):
    """Create a standardized success response"""
    response_data = {
        'success': True,
        'timestamp': datetime.now().isoformat(),
        'data': data
    }
    return response_data, status_code  # ✅ Return dict instead of Response

def error_response(message, status_code=400, error_code=None):
    """Create a standardized error response"""
    response_data = {
        'success': False,
        'timestamp': datetime.now().isoformat(),
        'error': {
            'message': message,
            'code': error_code or f'ERROR_{status_code}',
            'status_code': status_code
        }
    }
    return response_data, status_code  # ✅ Return dict instead of Response

def require_auth(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request
        import logging
        logger = logging.getLogger(__name__)

        # Debug session information
        logger.debug(f"Auth check for {request.method} {request.path}")
        logger.debug(f"Session contents: {dict(session)}")
        logger.debug(f"Session logged_in: {session.get('logged_in')}")
        logger.debug(f"Session user_id: {session.get('user_id')}")

        if not session.get('logged_in'):
            logger.warning(f"Authentication required for {request.path} - no logged_in flag")
            return error_response('Authentication required', 401, 'AUTH_REQUIRED')

        if not session.get('user_id'):
            logger.warning(f"Invalid session for {request.path} - no user_id")
            return error_response('Invalid session', 401, 'INVALID_SESSION')

        return f(*args, **kwargs)
    return decorated_function

def validate_email(email):
    """Validate email address format"""
    if not email or not isinstance(email, str):
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.lower()) is not None

def sanitize_filename(filename):
    """Sanitize filename for safe file operations"""
    if not filename:
        return 'untitled'
    
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = re.sub(r'\s+', '_', filename)  # Replace spaces with underscores
    filename = filename.strip('._')  # Remove leading/trailing dots and underscores
    
    # Limit length
    if len(filename) > 100:
        filename = filename[:100]
    
    return filename or 'untitled'

def format_datetime(dt, format_string='%Y-%m-%d %H:%M:%S'):
    """Format datetime object to string"""
    if not dt:
        return None
    
    if isinstance(dt, str):
        return dt
    
    return dt.strftime(format_string)

def parse_datetime(date_string):
    """Parse datetime string to datetime object"""
    if not date_string:
        return None
    
    if isinstance(date_string, datetime):
        return date_string
    
    # Try different datetime formats
    formats = [
        '%Y-%m-%dT%H:%M:%S.%fZ',  # ISO format with microseconds
        '%Y-%m-%dT%H:%M:%SZ',     # ISO format without microseconds
        '%Y-%m-%dT%H:%M:%S',      # ISO format without timezone
        '%Y-%m-%d %H:%M:%S',      # Standard format
        '%Y-%m-%d',               # Date only
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    raise ValueError(f"Unable to parse datetime string: {date_string}")

def calculate_time_ago(dt):
    """Calculate human-readable time ago string"""
    if not dt:
        return "Unknown"
    
    if isinstance(dt, str):
        dt = parse_datetime(dt)
    
    now = datetime.now()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:  # Less than 1 hour
        minutes = int(seconds // 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:  # Less than 1 day
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:  # Less than 1 week
        days = int(seconds // 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        weeks = int(seconds // 604800)
        if weeks < 4:
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            return dt.strftime('%b %d, %Y')

def truncate_text(text, max_length=100, suffix='...'):
    """Truncate text to specified length"""
    if not text:
        return ''
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def validate_session_id(session_id):
    """Validate session ID format"""
    if not session_id or not isinstance(session_id, str):
        return False
    
    # Check if it matches the expected format (prefix_uuid)
    pattern = r'^session_[a-f0-9-]{36}$'
    return bool(re.match(pattern, session_id))

def validate_processing_config(config):
    """Validate processing configuration parameters"""
    from config import Config
    
    errors = []
    
    if 'processing_time' in config:
        time_val = config['processing_time']
        if not isinstance(time_val, (int, float)) or time_val < Config.MIN_PROCESSING_TIME or time_val > Config.MAX_PROCESSING_TIME:
            errors.append(f"Processing time must be between {Config.MIN_PROCESSING_TIME} and {Config.MAX_PROCESSING_TIME} minutes")
    
    if 'analytics_depth' in config:
        if config['analytics_depth'] not in Config.ANALYSIS_DEPTHS:
            errors.append(f"Analytics depth must be one of: {', '.join(Config.ANALYSIS_DEPTHS)}")
    
    if 'reporting_style' in config:
        if config['reporting_style'] not in Config.REPORT_FORMATS:
            errors.append(f"Reporting style must be one of: {', '.join(Config.REPORT_FORMATS)}")
    
    if 'cross_validation' in config:
        if config['cross_validation'] not in Config.VALIDATION_LEVELS:
            errors.append(f"Cross validation must be one of: {', '.join(Config.VALIDATION_LEVELS)}")
    
    return errors

def get_user_from_session():
    """Get user information from current session"""
    if not session.get('logged_in'):
        return None
    
    return {
        'id': session.get('user_id'),
        'email': session.get('user_email'),
        'logged_in': True
    }

def log_api_request(endpoint, method, user_id=None, status_code=None, duration=None):
    """Log API request for monitoring (placeholder for actual logging)"""
    # In a real application, this would log to a proper logging system
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'endpoint': endpoint,
        'method': method,
        'user_id': user_id,
        'status_code': status_code,
        'duration_ms': duration
    }
    
    # For now, just print to console
    print(f"API Request: {log_data}")

class APIRateLimiter:
    """Simple rate limiter for API endpoints"""
    
    def __init__(self):
        self.requests = {}  # user_id -> {timestamp: request_count}
    
    def is_allowed(self, user_id, limit_per_minute=60):
        """Check if user is within rate limit"""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        if user_id not in self.requests:
            self.requests[user_id] = {}
        
        # Clean old requests
        user_requests = self.requests[user_id]
        self.requests[user_id] = {
            timestamp: count for timestamp, count in user_requests.items()
            if timestamp > minute_ago
        }
        
        # Count requests in last minute
        total_requests = sum(self.requests[user_id].values())
        
        if total_requests >= limit_per_minute:
            return False
        
        # Add current request
        current_minute = now.replace(second=0, microsecond=0)
        self.requests[user_id][current_minute] = self.requests[user_id].get(current_minute, 0) + 1
        
        return True

# Global rate limiter instance
rate_limiter = APIRateLimiter()