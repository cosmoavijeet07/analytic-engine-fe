"""
Ambiguity Resolution API Resources for Blue Sherpa Analytics Engine
FIXED: All classes have required methods, proper state handling
"""

from flask_restful import Resource
from flask import request, session
from datetime import datetime
import time

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth
from config import Config

class AmbiguityResolve(Resource):
    """Start ambiguity resolution process for a session"""

    def _clean_duplicate_questions(self, session_id, domain):
        """Clean up any duplicate questions in existing ambiguity data"""
        ambiguity_data = db_service.get_ambiguity_data(session_id)
        if not ambiguity_data:
            return

        current_questions = ambiguity_data.get_questions()
        if len(current_questions) == 0:
            return

        # Remove duplicates while preserving order
        cleaned_questions = list(dict.fromkeys(current_questions))

        # If we removed duplicates, update the data
        if len(cleaned_questions) != len(current_questions):
            print(f"DEBUG: Cleaned {len(current_questions) - len(cleaned_questions)} duplicate questions for session {session_id}")

            # Adjust current_question_index if needed
            answers_count = len(ambiguity_data.get_answers())
            new_index = min(answers_count, len(cleaned_questions) - 1) if len(cleaned_questions) > 0 else 0

            db_service.update_ambiguity_data(session_id, {
                'questions': cleaned_questions,
                'current_question_index': new_index
            })

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

            action = data.get('action')  # 'start_analysis' or 'continue_resolving'

            if action == 'start_analysis':
                return self._start_analysis(session_id, session_dict)
            elif action == 'continue_resolving':
                return self._continue_resolving(session_id, session_dict)
            else:
                return error_response('Invalid action', 400)

        except Exception as e:
            return error_response(f'Ambiguity resolution failed: {str(e)}', 500)

    def _start_analysis(self, session_id, session_data):
        """Start the analysis process after ambiguity resolution"""

        # Update session to processing step
        db_service.update_session(session_id, {
            'current_step': 'processing'
        })

        # Mark ambiguity as completed
        db_service.update_ambiguity_data(session_id, {
            'status': 'completed',
            'completed_at': datetime.utcnow()
        })

        return success_response({
            'message': 'Analysis started',
            'session_step': 'processing'
        })

    def _continue_resolving(self, session_id, session_data):
        """Continue with additional ambiguity questions"""

        # FIRST: Clean up any existing duplicate questions
        self._clean_duplicate_questions(session_id, session_data['domain'])

        ambiguity_data = db_service.get_ambiguity_data(session_id)
        if not ambiguity_data:
            return error_response('No ambiguity data found', 404)

        current_questions = ambiguity_data.get_questions()
        current_answers = ambiguity_data.get_answers()
        additional_questions = Config.ADDITIONAL_QUESTIONS

        # ROBUST FIX: Clean up existing questions and add additional ones properly
        # Get initial domain questions count
        domain = session_data['domain']
        initial_questions = Config.DOMAIN_AMBIGUITY_QUESTIONS.get(domain, [])
        initial_count = len(initial_questions)

        # Remove any duplicates and ensure we only have initial + additional questions (once)
        cleaned_questions = list(dict.fromkeys(current_questions))  # Remove duplicates while preserving order

        # Check if we already have additional questions (length > initial)
        if len(cleaned_questions) <= initial_count:
            # Haven't added additional questions yet, add them now
            unique_additional = []
            for q in additional_questions:
                if q not in cleaned_questions:
                    unique_additional.append(q)

            extended_questions = cleaned_questions + unique_additional
            print(f"DEBUG: Added {len(unique_additional)} new unique questions. Total now: {len(extended_questions)}")
        else:
            # Additional questions already exist, use cleaned list
            extended_questions = cleaned_questions
            print(f"DEBUG: Questions already extended and cleaned. Total questions: {len(extended_questions)}")

        # Set status back to active and update questions
        db_service.update_ambiguity_data(session_id, {
            'questions': extended_questions,
            'status': 'active'
        })

        # Update session back to ambiguity step
        db_service.update_session(session_id, {
            'current_step': 'ambiguity'
        })

        # Get the next question to ask (based on current answers count)
        next_question_index = len(current_answers)
        if next_question_index < len(extended_questions):
            current_question = extended_questions[next_question_index]
        else:
            # All questions already answered, create a follow-up question
            current_question = "What additional analysis details would you like to specify?"

        print(f"DEBUG: Continue resolving - answers: {len(current_answers)}, next index: {next_question_index}")
        print(f"DEBUG: Current question: {current_question}")

        # Update the ambiguity message back to active with new question
        self._update_ambiguity_message(session_id, {
            'currentQuestion': current_question,
            'answeredQuestions': len(current_answers),
            'totalQuestions': len(extended_questions),
            'status': 'active'
        })

        return success_response({
            'message': 'Continuing ambiguity resolution',
            'current_question': current_question,
            'total_questions': len(extended_questions),
            'answered_questions': len(current_answers)
        })

    def _update_ambiguity_message(self, session_id, updates):
        """Update the ambiguity message with new status/question"""
        messages = db_service.get_session_messages(session_id)

        # Find the ambiguity message and update it
        for message in messages:
            message_dict = message.to_dict() if hasattr(message, 'to_dict') else message
            if message_dict['type'] == 'ambiguity':
                # Update message fields
                update_data = {}
                if 'currentQuestion' in updates:
                    update_data['current_question'] = updates['currentQuestion']
                if 'answeredQuestions' in updates:
                    update_data['answered_questions'] = updates['answeredQuestions']
                if 'totalQuestions' in updates:
                    update_data['total_questions'] = updates['totalQuestions']
                if 'status' in updates:
                    update_data['status'] = updates['status']

                if update_data:
                    db_service.update_message(message.id if hasattr(message, 'id') else message['id'], update_data)
                break

class AmbiguityQuestions(Resource):
    """Get ambiguity questions for a session"""

    @require_auth
    def get(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            ambiguity_data = db_service.get_ambiguity_data(session_id)
            if not ambiguity_data:
                return error_response('No ambiguity data found', 404)

            ambiguity_dict = ambiguity_data.to_dict()
            return success_response({
                'questions': ambiguity_dict['questions'],
                'current_index': ambiguity_dict['current_question_index'],
                'answers': ambiguity_dict['answers'],
                'status': ambiguity_dict['status'],
                'total_questions': len(ambiguity_dict['questions'])
            })

        except Exception as e:
            return error_response(f'Failed to get questions: {str(e)}', 500)

class AmbiguityAnswer(Resource):
    """Submit answer to ambiguity question"""

    @require_auth
    def post(self, session_id):
        try:
            # Verify session access
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

            # Support both single answer and multiple answers
            if 'answers' in data:
                # Multiple answers submitted at once (batch mode)
                answers_batch = data.get('answers', [])
                if not answers_batch or not isinstance(answers_batch, list):
                    return error_response('Answers array is required', 400)

                # Validate all answers are non-empty
                valid_answers = []
                for ans in answers_batch:
                    ans_str = str(ans).strip()
                    if ans_str:
                        valid_answers.append(ans_str)

                if not valid_answers:
                    return error_response('At least one valid answer is required', 400)

                return self._handle_batch_answers(session_id, valid_answers)
            else:
                # Single answer (legacy mode)
                answer = data.get('answer', '').strip()
                if not answer:
                    return error_response('Answer is required', 400)

                return self._handle_single_answer(session_id, answer)

        except Exception as e:
            return error_response(f'Failed to submit answer: {str(e)}', 500)

    def _handle_single_answer(self, session_id, answer):
        """Handle a single answer submission"""
        ambiguity_data = db_service.get_ambiguity_data(session_id)
        if not ambiguity_data:
            return error_response('No ambiguity data found', 404)

        # FIXED: Robust answer handling logic
        current_answers = ambiguity_data.get_answers()
        current_questions = ambiguity_data.get_questions()

        # CRITICAL FIX: Use answers length as the true current question index
        actual_current_index = len(current_answers)

        # Add the answer - answers list length determines current question
        new_answers = current_answers + [answer]
        new_index = len(new_answers)

        # Log for debugging
        print(f"DEBUG: Added answer '{answer}' - now {len(new_answers)} total answers")
        print(f"DEBUG: Questions: {len(current_questions)}, Answered: {len(new_answers)}")

        # Check if more questions remain
        if len(new_answers) < len(current_questions):
            # Move to next question
            next_question_index = len(new_answers)
            next_question = current_questions[next_question_index]

            # Update database with new answer and index
            db_service.update_ambiguity_data(session_id, {
                'answers': new_answers,
                'current_question_index': new_index
            })

            print(f"DEBUG: Moving to question {next_question_index}: {next_question}")

            # Update the ambiguity message with new question
            self._update_ambiguity_message(session_id, {
                'currentQuestion': next_question,
                'answeredQuestions': len(new_answers),
                'totalQuestions': len(current_questions),
                'status': 'active'
            })

            return success_response({
                'message': 'Answer recorded',
                'next_question': next_question,
                'current_index': next_question_index,
                'answered_questions': len(new_answers),
                'total_questions': len(current_questions),
                'status': 'active'
            })
        else:
            # All questions answered - move to context confirmation
            db_service.update_ambiguity_data(session_id, {
                'answers': new_answers,
                'current_question_index': new_index,
                'status': 'context_confirmation',
                'completed_questions_at': datetime.utcnow()
            })

            print(f"DEBUG: All {len(new_answers)} questions answered - context confirmation")

            # Update the ambiguity message to context_confirmation status
            self._update_ambiguity_message(session_id, {
                'status': 'context_confirmation',
                'answeredQuestions': len(new_answers),
                'totalQuestions': len(current_questions),
                'currentQuestion': None  # Clear current question
            })

            # Update session step to context
            db_service.update_session(session_id, {
                'current_step': 'context'
            })

            return success_response({
                'message': 'All questions answered',
                'status': 'context_confirmation',
                'total_answered': len(new_answers),
                'ready_for_confirmation': True
            })

    def _handle_batch_answers(self, session_id, answers_batch):
        """Handle multiple answers submitted at once"""
        ambiguity_data = db_service.get_ambiguity_data(session_id)
        if not ambiguity_data:
            return error_response('No ambiguity data found', 404)

        current_answers = ambiguity_data.get_answers()
        current_questions = ambiguity_data.get_questions()

        # Add all new answers
        new_answers = current_answers + answers_batch
        new_index = len(new_answers)

        print(f"DEBUG: Added {len(answers_batch)} answers in batch - now {len(new_answers)} total answers")

        # Check if all questions are now answered
        if len(new_answers) >= len(current_questions):
            # All questions answered - move to context confirmation
            db_service.update_ambiguity_data(session_id, {
                'answers': new_answers[:len(current_questions)],  # Don't exceed question count
                'current_question_index': len(current_questions),
                'status': 'context_confirmation',
                'completed_questions_at': datetime.utcnow()
            })

            # Update the ambiguity message to context_confirmation status
            self._update_ambiguity_message(session_id, {
                'status': 'context_confirmation',
                'answeredQuestions': len(current_questions),
                'totalQuestions': len(current_questions),
                'currentQuestion': None
            })

            # Update session step to context
            db_service.update_session(session_id, {
                'current_step': 'context'
            })

            return success_response({
                'message': 'All questions answered',
                'status': 'context_confirmation',
                'total_answered': len(current_questions),
                'ready_for_confirmation': True
            })
        else:
            # Still have questions remaining
            next_question_index = len(new_answers)
            next_question = current_questions[next_question_index]

            db_service.update_ambiguity_data(session_id, {
                'answers': new_answers,
                'current_question_index': new_index
            })

            # Update the ambiguity message with new question
            self._update_ambiguity_message(session_id, {
                'currentQuestion': next_question,
                'answeredQuestions': len(new_answers),
                'totalQuestions': len(current_questions),
                'status': 'active'
            })

            return success_response({
                'message': f'{len(answers_batch)} answers recorded',
                'next_question': next_question,
                'current_index': next_question_index,
                'answered_questions': len(new_answers),
                'total_questions': len(current_questions),
                'status': 'active'
            })

    def _update_ambiguity_message(self, session_id, updates):
        """Update the ambiguity message with new status/question"""
        messages = db_service.get_session_messages(session_id)

        # Find the ambiguity message and update it
        for message in messages:
            message_dict = message.to_dict() if hasattr(message, 'to_dict') else message
            if message_dict['type'] == 'ambiguity':
                # Update message fields
                update_data = {}
                if 'currentQuestion' in updates:
                    update_data['current_question'] = updates['currentQuestion']
                if 'answeredQuestions' in updates:
                    update_data['answered_questions'] = updates['answeredQuestions']
                if 'totalQuestions' in updates:
                    update_data['total_questions'] = updates['totalQuestions']
                if 'status' in updates:
                    update_data['status'] = updates['status']

                if update_data:
                    db_service.update_message(message.id if hasattr(message, 'id') else message['id'], update_data)
                break

class AmbiguityContext(Resource):
    """Get or confirm the resolved context"""

    @require_auth
    def get(self, session_id):
        """Get the current context resolution"""
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            ambiguity_data = db_service.get_ambiguity_data(session_id)
            if not ambiguity_data:
                return error_response('No ambiguity data found', 404)

            # Generate context summary
            domain = session_dict['domain']
            answers = ambiguity_data.get_answers()
            ambiguity_dict = ambiguity_data.to_dict()

            context_summary = self._generate_context_summary(domain, answers)

            return success_response({
                'domain_context': context_summary,
                'questions_answered': len(answers),
                'status': ambiguity_dict['status'],
                'questions': ambiguity_data.get_questions(),
                'answers': answers
            })

        except Exception as e:
            return error_response(f'Failed to get context: {str(e)}', 500)

    @require_auth
    def post(self, session_id):
        """Confirm the resolved context"""
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            # Mark context as confirmed
            db_service.update_ambiguity_data(session_id, {
                'status': 'confirmed',
                'completed_at': datetime.utcnow()
            })

            return success_response({
                'message': 'Context confirmed',
                'status': 'confirmed'
            })

        except Exception as e:
            return error_response(f'Failed to confirm context: {str(e)}', 500)

    def _generate_context_summary(self, domain, answers):
        """Generate a context summary based on domain and answers"""

        # This is a simplified context generation for demo purposes
        # In a real system, this would use AI to generate contextual summaries

        context_summaries = {
            'Finance': {
                'domain_context': 'Finance - Sales Performance Analysis',
                'scope': 'Q4 vs Q3 comparison • Regional focus',
                'regions': 'North America, Europe, Asia-Pacific',
                'metrics': 'Revenue growth, CAC, conversion rates, product categories'
            },
            'Marketing': {
                'domain_context': 'Marketing - Campaign Performance Analysis',
                'scope': 'Multi-channel campaign effectiveness • Audience segmentation',
                'regions': 'Global markets with regional breakdown',
                'metrics': 'ROI, engagement rates, conversion metrics, audience reach'
            },
            'Sales': {
                'domain_context': 'Sales - Territory Performance Analysis',
                'scope': 'Regional sales performance • Trend analysis',
                'regions': 'Sales territories and geographic segments',
                'metrics': 'Revenue, volume, conversion rates, pipeline metrics'
            },
            'Customer Service': {
                'domain_context': 'Customer Service - Service Quality Analysis',
                'scope': 'Service metrics analysis • Response optimization',
                'regions': 'All service channels and territories',
                'metrics': 'Response time, resolution rate, customer satisfaction'
            }
        }

        return context_summaries.get(domain, context_summaries['Finance'])

class AmbiguityCleanup(Resource):
    """Development endpoint to clean corrupted ambiguity data"""

    @require_auth
    def post(self, session_id):
        """Clean all ambiguity data for a session"""
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            session_dict = session_data.to_dict()

            user_id = session.get('user_id')
            if session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            # Remove ambiguity data for this session
            db_service.delete_ambiguity_data(session_id)

            # Also clear any processing data
            db_service.delete_processing_status(session_id)
            db_service.delete_processing_logs(session_id)

            return success_response({
                'message': f'Cleaned all data for session {session_id}',
                'session_id': session_id
            })

        except Exception as e:
            return error_response(f'Failed to clean data: {str(e)}', 500)