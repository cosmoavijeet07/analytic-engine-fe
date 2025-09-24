"""
Sharing and Export API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session
from datetime import datetime, timedelta

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth, validate_email

class ShareCreate(Resource):
    """Create shareable links for analytics sessions"""
    
    @require_auth
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return error_response('No data provided', 400)
            
            session_id = data.get('session_id', '').strip()
            access_level = data.get('access_level', 'VIEW').upper()
            emails = data.get('emails', [])
            
            if not session_id:
                return error_response('Session ID is required', 400)
            
            if access_level not in ['VIEW', 'COMMENT', 'EDIT']:
                return error_response('Invalid access level', 400)
            
            # Verify session exists and user has access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            # Validate emails if provided
            invalid_emails = []
            if emails:
                for email in emails:
                    if not validate_email(email):
                        invalid_emails.append(email)
                
                if invalid_emails:
                    return error_response(f'Invalid email addresses: {", ".join(invalid_emails)}', 400)
            
            # Create share link (simulated for demo)
            import uuid
            share_token = str(uuid.uuid4())

            # Note: In a real implementation, you would store this in the database
            # For now, we'll return a demo response
            
            # Generate shareable URL
            share_url = f"https://analytics.bluesherpa.com/share/{share_token}"
            
            return success_response({
                'message': 'Share link created successfully',
                'share_token': share_token,
                'share_url': share_url,
                'access_level': access_level,
                'expires_at': (datetime.now() + timedelta(days=30)).isoformat(),
                'invited_emails': emails,
                'session': {
                    'id': session_dict['id'],
                    'title': session_dict['title'],
                    'domain': session_dict['domain']
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to create share link: {str(e)}', 500)

class ShareAccess(Resource):
    """Access shared analytics session"""
    
    def get(self, token):
        """Access a shared session via token"""
        try:
            # For demo purposes, we'll simulate share access
            # In a real implementation, you would look up the share token in the database
            return error_response('Share functionality not fully implemented in demo', 501)
            
            # Format messages based on access level
            formatted_messages = []
            for msg in messages:
                message_data = {
                    'id': msg['id'],
                    'type': msg['type'],
                    'content': msg['content'],
                    'timestamp': msg['timestamp'].isoformat(),
                    'status': msg.get('status')
                }
                
                # Include additional data based on access level
                if access_level in ['COMMENT', 'EDIT']:
                    message_data.update({
                        'interactions': msg.get('interactions'),
                        'domain': msg.get('domain'),
                        'scope': msg.get('scope')
                    })
                
                formatted_messages.append(message_data)
            
            return success_response({
                'share_info': {
                    'token': token,
                    'access_level': access_level,
                    'accessed_count': share_data['accessed_count'],
                    'created_at': share_data['created_at'].isoformat()
                },
                'session': {
                    'id': session_data['id'],
                    'title': session_data['title'],
                    'domain': session_data['domain'],
                    'created_at': session_data['created_at'].isoformat(),
                    'current_step': session_data['current_step'],
                    'status': session_data['status'],
                    'messages': formatted_messages
                },
                'permissions': {
                    'can_view': True,
                    'can_comment': access_level in ['COMMENT', 'EDIT'],
                    'can_edit': access_level == 'EDIT'
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to access shared session: {str(e)}', 500)
    
    @require_auth
    def delete(self, token):
        """Revoke a share link"""
        try:
            # For demo purposes, we'll simulate share revocation
            # In a real implementation, you would look up and delete the share token from the database
            return success_response({
                'message': 'Share link revoked successfully (demo)'
            })
            
        except Exception as e:
            return error_response(f'Failed to revoke share link: {str(e)}', 500)