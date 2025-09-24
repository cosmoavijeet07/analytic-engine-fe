"""
Session Management API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session
from datetime import datetime

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth
from config import Config

class SessionsCreate(Resource):
    """Create a new analytics session"""
    
    @require_auth
    def post(self):
        try:
            data = request.get_json()
            
            if not data:
                return error_response('No data provided', 400)
            
            title = data.get('title', '').strip()
            domain = data.get('domain', '').strip()
            
            if not title:
                return error_response('Title is required', 400)
            
            if not domain:
                return error_response('Domain is required', 400)
            
            # Validate domain - add new domain if it doesn't exist
            if domain not in Config.SUPPORTED_DOMAINS:
                # Check if domain exists in database
                domains = db_service.get_domains()
                domain_exists = any(d.name == domain for d in domains)
                if not domain_exists:
                    db_service.create_domain({
                        'id': domain.lower().replace(' ', '_'),
                        'name': domain,
                        'description': f'{domain} analytics and insights'
                    })
            
            user_id = session.get('user_id')
            
            # Create new session
            session_data = db_service.create_session(title, domain, user_id)
            session_dict = session_data.to_dict()
            
            return success_response({
                'message': 'Session created successfully',
                'session': {
                    'id': session_dict['id'],
                    'title': session_dict['title'],
                    'domain': session_dict['domain'],
                    'created_at': session_dict['created_at'],
                    'current_step': session_dict['current_step'],
                    'status': session_dict['status']
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to create session: {str(e)}', 500)

class SessionsList(Resource):
    """Get list of user's analytics sessions"""
    
    @require_auth
    def get(self):
        try:
            # Get query parameters
            search_query = request.args.get('search', '').strip()
            limit = min(int(request.args.get('limit', 50)), 100)
            
            user_id = session.get('user_id')
            
            if search_query:
                sessions_list = db_service.search_sessions(user_id, search_query)
            else:
                sessions_list = db_service.get_user_sessions(user_id, limit)

            # Format sessions for response
            formatted_sessions = []
            for sess in sessions_list:
                session_dict = sess.to_dict() if hasattr(sess, 'to_dict') else sess
                formatted_sessions.append({
                    'id': session_dict['id'],
                    'title': session_dict['title'],
                    'domain': session_dict['domain'],
                    'created_at': session_dict['created_at'],
                    'updated_at': session_dict['updated_at'],
                    'current_step': session_dict['current_step'],
                    'status': session_dict['status'],
                    'messages_count': session_dict['messages_count']
                })
            
            return success_response({
                'sessions': formatted_sessions,
                'total_count': len(formatted_sessions)
            })
            
        except Exception as e:
            return error_response(f'Failed to get sessions: {str(e)}', 500)

class SessionsDetail(Resource):
    """Get, update, or delete a specific session"""
    
    @require_auth
    def get(self, session_id):
        """Get session details"""
        try:
            session_data = db_service.get_session(session_id)

            if not session_data:
                return error_response('Session not found', 404)

            session_dict = session_data.to_dict()

            # Check if user owns this session
            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            # Get session messages
            messages = db_service.get_session_messages(session_id)
            
            # Format messages for response
            formatted_messages = []
            for msg in messages:
                msg_dict = msg.to_dict() if hasattr(msg, 'to_dict') else msg
                formatted_messages.append({
                    'id': msg_dict['id'],
                    'type': msg_dict['type'],
                    'content': msg_dict['content'],
                    'timestamp': msg_dict['timestamp'],
                    'status': msg_dict.get('status'),
                    'interactions': msg_dict.get('interactions'),
                    'domain': msg_dict.get('domain'),
                    'scope': msg_dict.get('scope'),
                    'expanded': msg_dict.get('expanded'),
                    'currentQuestion': msg_dict.get('current_question'),
                    'answeredQuestions': msg_dict.get('answered_questions'),
                    'totalQuestions': msg_dict.get('total_questions')
                })
            
            return success_response({
                'session': {
                    'id': session_dict['id'],
                    'title': session_dict['title'],
                    'domain': session_dict['domain'],
                    'created_at': session_dict['created_at'],
                    'updated_at': session_dict['updated_at'],
                    'current_step': session_dict['current_step'],
                    'status': session_dict['status'],
                    'messages': formatted_messages
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to get session: {str(e)}', 500)
    
    @require_auth
    def put(self, session_id):
        """Update session details"""
        try:
            session_data = db_service.get_session(session_id)

            if not session_data:
                return error_response('Session not found', 404)

            session_dict = session_data.to_dict()
            
            # Check if user owns this session
            user_id = session.get('user_id')
            if session_data['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            data = request.get_json()
            if not data:
                return error_response('No data provided', 400)
            
            # Update allowed fields
            allowed_fields = ['title', 'current_step', 'status']
            updates = {}
            
            for field in allowed_fields:
                if field in data:
                    updates[field] = data[field]
            
            if updates:
                updates['updated_at'] = datetime.now()
                db_service.update_session(session_id, updates)
            
            updated_session = db_service.get_session(session_id)
            updated_session_dict = updated_session.to_dict() if updated_session else {}
            
            return success_response({
                'message': 'Session updated successfully',
                'session': {
                    'id': updated_session['id'],
                    'title': updated_session['title'],
                    'domain': updated_session['domain'],
                    'current_step': updated_session['current_step'],
                    'status': updated_session['status'],
                    'updated_at': updated_session['updated_at'].isoformat()
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to update session: {str(e)}', 500)
    
    @require_auth
    def delete(self, session_id):
        """Delete a session"""
        try:
            session_data = db_service.get_session(session_id)
            session_dict = session_data.to_dict() if session_data else {}
            
            if not session_data:
                return error_response('Session not found', 404)
            
            # Check if user owns this session
            user_id = session.get('user_id')
            if session_data['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            # Delete related data
            # Database cascade deletes will handle related records
            from models import db
            db.session.delete(session_data)
            db.session.commit()
            
            return success_response({
                'message': 'Session deleted successfully'
            })

        except Exception as e:
            return error_response(f'Failed to delete session: {str(e)}', 500)

class SessionConversationCycles(Resource):
    """Get conversation cycles for a session"""

    @require_auth
    def get(self, session_id):
        """Get conversation cycle summary for a session"""
        try:
            # Verify session exists and user has access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)

            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            # Get conversation cycle summary
            cycle_summary = db_service.get_conversation_cycle_summary(session_id)

            return success_response({
                'session_id': session_id,
                'conversation_cycles': cycle_summary
            })

        except Exception as e:
            return error_response(f'Failed to get conversation cycles: {str(e)}', 500)