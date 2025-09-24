"""
Message Management API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session
from datetime import datetime
import time

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth
from config import Config

class MessagesList(Resource):
    """Get messages for a session"""
    
    @require_auth
    def get(self, session_id):
        try:
            # Verify session exists and user has access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)

            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            # Get messages
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
                    'totalQuestions': msg_dict.get('total_questions'),
                    'regions': msg_dict.get('regions'),
                    'metrics': msg_dict.get('metrics'),
                    'conversationalContext': msg_dict.get('conversationalContext')
                })
            
            return success_response({
                'messages': formatted_messages,
                'total_count': len(formatted_messages)
            })
            
        except Exception as e:
            return error_response(f'Failed to get messages: {str(e)}', 500)

class MessagesCreate(Resource):
    """Create a new message in a session"""
    
    @require_auth
    def post(self, session_id):
        try:
            # Verify session exists and user has access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)

            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            data = request.get_json()
            if not data:
                return error_response('No data provided', 400)
            
            message_type = data.get('type', 'user')
            content = data.get('content', '').strip()
            
            if not content:
                return error_response('Message content is required', 400)
            
            # Add delay for realism
            time.sleep(0.5)
            
            # Create user message
            user_message_data = {
                'type': 'user',
                'content': content,
                'status': 'completed'
            }
            
            user_message = db_service.add_message(session_id, user_message_data)
            user_message_dict = user_message.to_dict()
            
            # Handle different conversation steps
            current_step = session_dict.get('current_step', 'query')
            response_messages = []

            if current_step == 'query':
                # First user message - trigger ambiguity resolution
                response_messages = self._handle_initial_query(session_id, content, session_dict)

            elif current_step == 'ambiguity':
                # User responding to ambiguity questions
                response_messages = self._handle_ambiguity_response(session_id, content, session_dict)

            elif current_step == 'completed':
                # Follow-up question
                response_messages = self._handle_followup_query(session_id, content, session_dict)
            
            # Format all messages for response
            all_new_messages = [user_message_dict] + response_messages
            formatted_messages = []

            for msg in all_new_messages:
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
                'messages': formatted_messages,
                'session_updated': True
            })
            
        except Exception as e:
            return error_response(f'Failed to create message: {str(e)}', 500)
    
    def _handle_initial_query(self, session_id, content, session_data):
        """Handle the first user query and trigger ambiguity resolution"""

        # Create conversation cycle for this query
        cycle_type = 'initial' if session_data.get('messages_count', 0) == 0 else 'followup'
        conversation_cycle = db_service.create_conversation_cycle(session_id, cycle_type, content)

        print(f"DEBUG: Created conversation cycle {conversation_cycle.id} (#{conversation_cycle.cycle_number}) for session {session_id}")

        # Update session step
        db_service.update_session(session_id, {
            'current_step': 'ambiguity'
        })

        # Update conversation cycle to ambiguity step
        db_service.update_conversation_cycle(conversation_cycle.id, {
            'current_step': 'ambiguity'
        })
        
        # Get domain-specific ambiguity questions
        domain = session_data['domain']
        ambiguity_questions = Config.DOMAIN_AMBIGUITY_QUESTIONS.get(
            domain, Config.DOMAIN_AMBIGUITY_QUESTIONS['Finance']
        )

        print(f"DEBUG: Domain: {domain}")
        print(f"DEBUG: Ambiguity questions for {domain}: {ambiguity_questions}")
        print(f"DEBUG: Total questions count: {len(ambiguity_questions)}")

        # Initialize ambiguity resolution data in database
        db_service.create_ambiguity_data(session_id, ambiguity_questions, domain)
        
        # Add delay for realism
        time.sleep(1)
        
        # Create ambiguity message with all questions
        ambiguity_message_data = {
            'type': 'ambiguity',
            'content': 'I need to clarify a few domain-specific terms to ensure accurate analysis:',
            'status': 'active',
            'current_question': ambiguity_questions[0],
            'expanded': True,
            'answered_questions': 0,
            'total_questions': len(ambiguity_questions),
            # Add all questions for frontend processing
            'all_questions': ambiguity_questions
        }
        
        ambiguity_message = db_service.add_message(session_id, ambiguity_message_data)
        ambiguity_message_dict = ambiguity_message.to_dict()

        return [ambiguity_message_dict]
    
    def _handle_ambiguity_response(self, session_id, content, session_data):
        """Handle user response to ambiguity questions"""
        
        # This method is no longer used since ambiguity handling is now done through API endpoints
        return []
        
        time.sleep(1)
        
        if current_index < len(ambiguity_data['questions']) - 1:
            # More questions to ask
            next_index = current_index + 1
            ambiguity_data['current_question_index'] = next_index
            # Ambiguity data now handled through database
            
            # Update ambiguity message
            updated_message_data = {
                'type': 'ambiguity',
                'content': 'I need to clarify a few domain-specific terms to ensure accurate analysis:',
                'status': 'active',
                'currentQuestion': ambiguity_data['questions'][next_index],
                'expanded': True,
                'answeredQuestions': len(ambiguity_data['answers']),  # FIXED: Use actual count of answers
                'totalQuestions': len(ambiguity_data['questions'])
            }
            
            # Update the existing ambiguity message
            # Messages now handled through database
            for i, msg in enumerate(messages):
                if msg['type'] == 'ambiguity':
                    messages[i].update(updated_message_data)
                    messages[i]['timestamp'] = datetime.now()
                    break
            
            # Messages now handled through database
            return []
            
        else:
            # All questions answered - show context confirmation
            ambiguity_data['status'] = 'context_confirmation'
            # Ambiguity data now handled through database
            
            # Update session step
            db_service.update_session(session_id, {
                'current_step': 'context',
                'updated_at': datetime.now()
            })
            
            # Update ambiguity message to show confirmation
            # Messages now handled through database
            for i, msg in enumerate(messages):
                if msg['type'] == 'ambiguity':
                    messages[i].update({
                        'status': 'context_confirmation',
                        'expanded': True,
                        'answeredQuestions': len(ambiguity_data['answers']),  # FIXED: Use actual count of answers
                        'totalQuestions': len(ambiguity_data['questions']),
                        'currentQuestion': None  # Clear current question
                    })
                    messages[i]['timestamp'] = datetime.now()
                    break
            
            # Messages now handled through database
            return []
    
    def _handle_followup_query(self, session_id, content, session_data):
        """Handle follow-up questions after analysis is complete"""
        
        # Add delay for realism
        time.sleep(2)
        
        # Create a simple follow-up response
        assistant_message_data = {
            'type': 'assistant',
            'content': f'Thank you for your follow-up question: "{content}". This functionality would typically provide additional insights based on your query and the previous analysis context. The system would analyze your question in relation to the completed analytics session and provide relevant additional information or clarifications.',
            'status': 'completed'
        }
        
        assistant_message = db_service.add_message(session_id, assistant_message_data)
        return [assistant_message]