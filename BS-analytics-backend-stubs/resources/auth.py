"""
Authentication API Resources for Blue Sherpa Analytics Engine
FIXED: Corrected JSON serialization issues in Flask-RESTful responses
"""

from flask_restful import Resource
from flask import request, session, jsonify
from datetime import datetime
import time
import logging

from db_service import db_service
from utils.helpers import success_response, error_response, validate_email

logger = logging.getLogger(__name__)

class AuthLogin(Resource):
    """Handle user authentication"""
    
    def post(self):
        try:
            data = request.get_json()
            
            if not data:
                return error_response('No data provided', 400)
            
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not email or not password:
                return error_response('Email and password are required', 400)
            
            if not validate_email(email):
                return error_response('Invalid email format', 400)
            
            # Simulate authentication delay
            time.sleep(1)
            
            # Check if user exists (for demo, any valid email works)
            user_data = db_service.get_user_by_email(email)

            if not user_data:
                # For demo purposes, create user if doesn't exist
                user_data = db_service.create_user({
                    'id': db_service.generate_id('user'),
                    'name': email.split('@')[0].replace('.', ' ').title(),
                    'email': email,
                    'role': 'Data Analyst',
                    'profile_image': None
                })
            else:
                # Update last login
                user_data.last_login = datetime.utcnow()
                from models import db
                db.session.commit()

            # Set session
            session.permanent = True
            user_dict = user_data.to_dict() if hasattr(user_data, 'to_dict') else user_data
            session['user_id'] = user_dict['id']
            session['user_email'] = user_dict['email']
            session['logged_in'] = True

            # Log session details for debugging
            logger.debug(f"Session created for user {user_dict['email']}: {dict(session)}")

            # Create response with session data
            response_data = success_response({
                'message': 'Login successful',
                'user': {
                    'id': user_dict['id'],
                    'name': user_dict['name'],
                    'email': user_dict['email'],
                    'role': user_dict['role'],
                    'profile_image': user_dict['profile_image']
                }
            })

            logger.info(f"Login successful for user {user_dict['email']}, session set: {dict(session)}")

            return response_data
            
        except Exception as e:
            return error_response(f'Login failed: {str(e)}', 500)

class AuthLogout(Resource):
    """Handle user logout"""
    
    def post(self):
        try:
            if 'user_id' in session:
                session.clear()
                return success_response({'message': 'Logout successful'})
            else:
                return error_response('No active session found', 400)
                
        except Exception as e:
            return error_response(f'Logout failed: {str(e)}', 500)

class AuthProfile(Resource):
    """Get current user profile information"""
    
    def get(self):
        try:
            # Debug session information
            logger.debug(f"Profile request - Session contents: {dict(session)}")
            logger.debug(f"Session logged_in: {session.get('logged_in')}")
            logger.debug(f"Session user_id: {session.get('user_id')}")
            logger.debug(f"Session user_email: {session.get('user_email')}")
            logger.debug(f"Request headers: {dict(request.headers)}")

            if not session.get('logged_in'):
                logger.warning("Profile access denied - not logged in")
                return error_response('Not authenticated', 401)

            user_email = session.get('user_email')
            if not user_email:
                logger.warning("Profile access denied - no user email in session")
                return error_response('Invalid session', 401)
            
            user_data = db_service.get_user_by_email(user_email)
            if not user_data:
                return error_response('User not found', 404)

            user_dict = user_data.to_dict()
            return success_response({
                'user': {
                    'id': user_dict['id'],
                    'name': user_dict['name'],
                    'email': user_dict['email'],
                    'role': user_dict['role'],
                    'profile_image': user_dict['profile_image'],
                    'last_login': user_dict['last_login']
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to get profile: {str(e)}', 500)
    
    def put(self):
        """Update user profile"""
        try:
            if not session.get('logged_in'):
                return error_response('Not authenticated', 401)
            
            data = request.get_json()
            if not data:
                return error_response('No data provided', 400)
            
            user_email = session.get('user_email')
            user_data = db_service.get_user_by_email(user_email)

            if not user_data:
                return error_response('User not found', 404)

            # Update allowed fields
            update_data = {}
            allowed_fields = ['name', 'profile_image']
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]

            if update_data:
                for key, value in update_data.items():
                    setattr(user_data, key, value)
                from models import db
                db.session.commit()

            user_dict = user_data.to_dict()
            return success_response({
                'message': 'Profile updated successfully',
                'user': {
                    'id': user_dict['id'],
                    'name': user_dict['name'],
                    'email': user_dict['email'],
                    'role': user_dict['role'],
                    'profile_image': user_dict['profile_image']
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to update profile: {str(e)}', 500)