"""
Database Service Layer for Blue Sherpa Analytics Engine
Provides data access methods using SQLAlchemy models
"""

from models import db, User, Session, Message, AmbiguityData, ProcessingStatus, ProcessingLog, Domain
from datetime import datetime
import uuid
import json

class DatabaseService:
    """Service layer for database operations"""

    @staticmethod
    def generate_id(prefix=''):
        """Generate unique ID with optional prefix"""
        unique_id = str(uuid.uuid4())
        return f"{prefix}_{unique_id}" if prefix else unique_id

    # User operations
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        return User.query.filter_by(email=email).first()

    @staticmethod
    def create_user(user_data):
        """Create new user"""
        user = User(**user_data)
        db.session.add(user)
        db.session.commit()
        return user

    # Session operations
    @staticmethod
    def create_session(title, domain, user_id):
        """Create new analytics session"""
        session_id = DatabaseService.generate_id('session')
        session = Session(
            id=session_id,
            title=title,
            domain=domain,
            user_id=user_id
        )
        db.session.add(session)
        db.session.commit()

        # Update domain usage
        domain_obj = Domain.query.filter_by(name=domain).first()
        if domain_obj:
            domain_obj.usage_count += 1
            db.session.commit()

        return session

    @staticmethod
    def get_session(session_id):
        """Get session by ID with messages"""
        return Session.query.filter_by(id=session_id).first()

    @staticmethod
    def update_session(session_id, updates):
        """Update session"""
        session = Session.query.filter_by(id=session_id).first()
        if session:
            for key, value in updates.items():
                setattr(session, key, value)
            session.updated_at = datetime.utcnow()
            db.session.commit()
        return session

    @staticmethod
    def get_user_sessions(user_id, limit=50):
        """Get user sessions ordered by updated_at"""
        return Session.query.filter_by(user_id=user_id)\
                          .order_by(Session.updated_at.desc())\
                          .limit(limit).all()

    @staticmethod
    def search_sessions(user_id, query):
        """Search user sessions by title or domain"""
        if not query:
            return DatabaseService.get_user_sessions(user_id)

        return Session.query.filter_by(user_id=user_id)\
                          .filter(
                              db.or_(
                                  Session.title.ilike(f'%{query}%'),
                                  Session.domain.ilike(f'%{query}%')
                              )
                          )\
                          .order_by(Session.updated_at.desc()).all()

    # Message operations
    @staticmethod
    def add_message(session_id, message_data):
        """Add message to session"""
        message_id = DatabaseService.generate_id('msg')

        # Handle JSON serialization for all_questions
        if 'all_questions' in message_data and isinstance(message_data['all_questions'], list):
            message_data = message_data.copy()
            message_data['all_questions'] = json.dumps(message_data['all_questions'])

        message = Message(
            id=message_id,
            session_id=session_id,
            **message_data
        )
        db.session.add(message)

        # Update session
        session = Session.query.filter_by(id=session_id).first()
        if session:
            session.updated_at = datetime.utcnow()

        db.session.commit()
        return message

    @staticmethod
    def get_session_messages(session_id):
        """Get all messages for a session"""
        return Message.query.filter_by(session_id=session_id)\
                          .order_by(Message.timestamp.asc()).all()

    @staticmethod
    def update_message(message_id, updates):
        """Update message"""
        message = Message.query.filter_by(id=message_id).first()
        if message:
            for key, value in updates.items():
                setattr(message, key, value)
            db.session.commit()
        return message

    @staticmethod
    def update_message_status(session_id, message_type, status):
        """Update the status of a specific message type in session"""
        message = Message.query.filter_by(session_id=session_id, type=message_type).first()
        if message:
            message.status = status
            db.session.commit()
            return True
        return False

    # Ambiguity data operations
    @staticmethod
    def create_ambiguity_data(session_id, questions, domain):
        """Create ambiguity data for session"""
        ambiguity_data = AmbiguityData(
            session_id=session_id,
            questions=json.dumps(questions),
            answers=json.dumps([]),
            current_question_index=0,
            status='active'
        )
        db.session.add(ambiguity_data)
        db.session.commit()
        return ambiguity_data

    @staticmethod
    def get_ambiguity_data(session_id):
        """Get ambiguity data for session"""
        return AmbiguityData.query.filter_by(session_id=session_id).first()

    @staticmethod
    def update_ambiguity_data(session_id, updates):
        """Update ambiguity data"""
        ambiguity_data = AmbiguityData.query.filter_by(session_id=session_id).first()
        if ambiguity_data:
            for key, value in updates.items():
                if key == 'questions' and isinstance(value, list):
                    ambiguity_data.set_questions(value)
                elif key == 'answers' and isinstance(value, list):
                    ambiguity_data.set_answers(value)
                else:
                    setattr(ambiguity_data, key, value)
            db.session.commit()
        return ambiguity_data

    @staticmethod
    def delete_ambiguity_data(session_id):
        """Delete ambiguity data for session"""
        ambiguity_data = AmbiguityData.query.filter_by(session_id=session_id).first()
        if ambiguity_data:
            db.session.delete(ambiguity_data)
            db.session.commit()
            return True
        return False

    @staticmethod
    def complete_ambiguity_resolution(session_id):
        """Mark ambiguity resolution as completed to hide buttons"""
        ambiguity_data = AmbiguityData.query.filter_by(session_id=session_id).first()
        if ambiguity_data:
            ambiguity_data.status = 'completed'
            ambiguity_data.completed_at = datetime.utcnow()
            db.session.commit()
            return True
        return False

    # Processing operations
    @staticmethod
    def create_processing_status(session_id, config):
        """Create processing status for session"""
        from config import Config

        # Initialize stages
        stages = []
        for i, stage_config in enumerate(Config.PROCESSING_STAGES):
            stage_data = {
                'id': stage_config['id'],
                'name': stage_config['name'],
                'icon': stage_config['icon'],
                'status': 'queued',
                'progress': 0,
                'started_at': None,
                'completed_at': None
            }
            stages.append(stage_data)

        processing_status = ProcessingStatus(
            session_id=session_id,
            status='processing',
            current_stage=0,
            overall_progress=0.0
        )
        processing_status.set_stages(stages)
        processing_status.set_config(config)

        db.session.add(processing_status)
        db.session.commit()
        return processing_status

    @staticmethod
    def get_processing_status(session_id):
        """Get processing status for session"""
        return ProcessingStatus.query.filter_by(session_id=session_id).first()

    @staticmethod
    def update_processing_status(session_id, updates):
        """Update processing status"""
        processing_status = ProcessingStatus.query.filter_by(session_id=session_id).first()
        if processing_status:
            for key, value in updates.items():
                if key == 'stages' and isinstance(value, list):
                    processing_status.set_stages(value)
                elif key == 'config' and isinstance(value, dict):
                    processing_status.set_config(value)
                else:
                    setattr(processing_status, key, value)
            db.session.commit()
        return processing_status

    @staticmethod
    def delete_processing_status(session_id):
        """Delete processing status for session"""
        processing_status = ProcessingStatus.query.filter_by(session_id=session_id).first()
        if processing_status:
            db.session.delete(processing_status)
            db.session.commit()
            return True
        return False

    # Processing logs operations
    @staticmethod
    def add_processing_log(session_id, message, log_type='info'):
        """Add processing log entry"""
        log_id = DatabaseService.generate_id('log')

        # Get processing status
        processing_status = ProcessingStatus.query.filter_by(session_id=session_id).first()
        if not processing_status:
            return None

        log_entry = ProcessingLog(
            id=log_id,
            processing_status_id=processing_status.id,
            session_id=session_id,
            message=message,
            type=log_type
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry

    @staticmethod
    def get_processing_logs(session_id):
        """Get processing logs for session"""
        return ProcessingLog.query.filter_by(session_id=session_id)\
                                .order_by(ProcessingLog.timestamp.asc()).all()

    @staticmethod
    def delete_processing_logs(session_id):
        """Delete processing logs for session"""
        logs = ProcessingLog.query.filter_by(session_id=session_id).all()
        for log in logs:
            db.session.delete(log)
        db.session.commit()
        return len(logs)

    @staticmethod
    def clear_processing_logs(session_id):
        """Alias for delete_processing_logs"""
        return DatabaseService.delete_processing_logs(session_id)

    # Domain operations
    @staticmethod
    def get_domains():
        """Get all domains"""
        return Domain.query.all()

    @staticmethod
    def create_domain(domain_data):
        """Create new domain"""
        domain = Domain(**domain_data)
        db.session.add(domain)
        db.session.commit()
        return domain

    # Conversation Cycle Management
    def create_conversation_cycle(self, session_id, cycle_type, initial_query):
        """Create a new conversation cycle within a session"""
        from models import ConversationCycle
        import uuid

        try:
            # Get the next cycle number for this session
            last_cycle = ConversationCycle.query.filter_by(session_id=session_id)\
                .order_by(ConversationCycle.cycle_number.desc()).first()
            next_cycle_number = (last_cycle.cycle_number + 1) if last_cycle else 1

            cycle_id = f"cycle_{str(uuid.uuid4())}"
            cycle = ConversationCycle(
                id=cycle_id,
                session_id=session_id,
                cycle_number=next_cycle_number,
                cycle_type=cycle_type,
                initial_query=initial_query
            )

            db.session.add(cycle)
            db.session.commit()
            return cycle
        except Exception as e:
            db.session.rollback()
            print(f"Error creating conversation cycle: {e}")
            raise e

    def get_current_conversation_cycle(self, session_id):
        """Get the current active conversation cycle for a session"""
        from models import ConversationCycle

        return ConversationCycle.query.filter_by(session_id=session_id)\
            .order_by(ConversationCycle.cycle_number.desc()).first()

    def update_conversation_cycle(self, cycle_id, updates):
        """Update a conversation cycle with new state"""
        from models import ConversationCycle
        from datetime import datetime

        try:
            cycle = ConversationCycle.query.get(cycle_id)
            if not cycle:
                raise ValueError(f"Conversation cycle {cycle_id} not found")

            for key, value in updates.items():
                if hasattr(cycle, key):
                    setattr(cycle, key, value)

            # Auto-update timestamps based on state changes
            if 'current_step' in updates:
                now = datetime.utcnow()
                if updates['current_step'] == 'ambiguity' and not cycle.ambiguity_started_at:
                    cycle.ambiguity_started_at = now
                elif updates['current_step'] == 'processing' and not cycle.processing_started_at:
                    cycle.processing_started_at = now
                elif updates['current_step'] == 'completed' and not cycle.completed_at:
                    cycle.completed_at = now

            if 'context_confirmed' in updates and updates['context_confirmed'] and not cycle.context_confirmed_at:
                cycle.context_confirmed_at = datetime.utcnow()

            db.session.commit()
            return cycle
        except Exception as e:
            db.session.rollback()
            print(f"Error updating conversation cycle: {e}")
            raise e

    def get_session_conversation_cycles(self, session_id):
        """Get all conversation cycles for a session"""
        from models import ConversationCycle

        return ConversationCycle.query.filter_by(session_id=session_id)\
            .order_by(ConversationCycle.cycle_number.asc()).all()

    def get_conversation_cycle_summary(self, session_id):
        """Get a summary of conversation cycles for a session"""
        cycles = self.get_session_conversation_cycles(session_id)

        summary = {
            'total_cycles': len(cycles),
            'current_cycle': None,
            'cycles': []
        }

        for cycle in cycles:
            cycle_data = cycle.to_dict()
            summary['cycles'].append(cycle_data)

            # The most recent cycle is the current one
            if cycle == cycles[-1]:
                summary['current_cycle'] = cycle_data

        return summary

# Create global service instance
db_service = DatabaseService()