"""
Database Models for Blue Sherpa Analytics Engine
SQLAlchemy models with proper relationships and constraints
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy import PickleType

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(50), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(100), default='Data Analyst')
    profile_image = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    sessions = db.relationship('Session', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Session(db.Model):
    __tablename__ = 'sessions'

    id = db.Column(db.String(100), primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    domain = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    current_step = db.Column(db.String(50), default='query')  # query, ambiguity, context, processing, completed
    status = db.Column(db.String(50), default='active')  # active, processing, completed, stopped
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = db.relationship('Message', backref='session', lazy=True, cascade='all, delete-orphan')
    ambiguity_data = db.relationship('AmbiguityData', backref='session', uselist=False, cascade='all, delete-orphan')
    processing_status = db.relationship('ProcessingStatus', backref='session', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'domain': self.domain,
            'user_id': self.user_id,
            'current_step': self.current_step,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'messages_count': len(self.messages) if self.messages else 0
        }

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(100), primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('sessions.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # user, assistant, ambiguity
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=True)  # active, completed, context_confirmation
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Ambiguity-specific fields
    current_question = db.Column(db.Text, nullable=True)
    answered_questions = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=0)
    all_questions = db.Column(db.Text, nullable=True)  # JSON string of all questions

    # Additional metadata
    domain = db.Column(db.String(100), nullable=True)
    scope = db.Column(db.Text, nullable=True)
    regions = db.Column(db.Text, nullable=True)
    metrics = db.Column(db.Text, nullable=True)
    expanded = db.Column(db.Boolean, default=False)

    def to_dict(self):
        # Parse all_questions from JSON if available
        all_questions_list = []
        if self.all_questions:
            try:
                all_questions_list = json.loads(self.all_questions)
            except:
                all_questions_list = []

        return {
            'id': self.id,
            'session_id': self.session_id,
            'type': self.type,
            'content': self.content,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'current_question': self.current_question,
            'answered_questions': self.answered_questions,
            'total_questions': self.total_questions,
            'all_questions': all_questions_list,
            'domain': self.domain,
            'scope': self.scope,
            'regions': self.regions,
            'metrics': self.metrics,
            'expanded': self.expanded,
            'interactions': None,
            'conversationalContext': None
        }

class AmbiguityData(db.Model):
    __tablename__ = 'ambiguity_data'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('sessions.id'), nullable=False, unique=True)
    questions = db.Column(db.Text, nullable=False)  # JSON string of questions list
    answers = db.Column(db.Text, nullable=False, default='[]')  # JSON string of answers list
    current_question_index = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='active')  # active, context_confirmation, completed
    questions_extended = db.Column(db.Boolean, default=False)  # Track if additional questions added
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_questions_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def get_questions(self):
        """Parse questions from JSON string"""
        try:
            return json.loads(self.questions) if self.questions else []
        except:
            return []

    def set_questions(self, questions_list):
        """Set questions as JSON string"""
        self.questions = json.dumps(questions_list)

    def get_answers(self):
        """Parse answers from JSON string"""
        try:
            return json.loads(self.answers) if self.answers else []
        except:
            return []

    def set_answers(self, answers_list):
        """Set answers as JSON string"""
        self.answers = json.dumps(answers_list)

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'questions': self.get_questions(),
            'answers': self.get_answers(),
            'current_question_index': self.current_question_index,
            'status': self.status,
            'questions_extended': self.questions_extended,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_questions_at': self.completed_questions_at.isoformat() if self.completed_questions_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class ProcessingStatus(db.Model):
    __tablename__ = 'processing_status'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('sessions.id'), nullable=False, unique=True)
    status = db.Column(db.String(50), default='initializing')  # initializing, processing, completed, stopped, failed
    current_stage = db.Column(db.Integer, default=0)
    overall_progress = db.Column(db.Float, default=0.0)
    stages = db.Column(db.Text, nullable=False)  # JSON string of stages
    config = db.Column(db.Text, nullable=False)  # JSON string of config
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    estimated_completion = db.Column(db.DateTime, nullable=True)
    error = db.Column(db.Text, nullable=True)

    # Relationships
    logs = db.relationship('ProcessingLog', backref='processing_status', lazy=True, cascade='all, delete-orphan')

    def get_stages(self):
        """Parse stages from JSON string"""
        try:
            return json.loads(self.stages) if self.stages else []
        except:
            return []

    def set_stages(self, stages_list):
        """Set stages as JSON string"""
        self.stages = json.dumps(stages_list)

    def get_config(self):
        """Parse config from JSON string"""
        try:
            return json.loads(self.config) if self.config else {}
        except:
            return {}

    def set_config(self, config_dict):
        """Set config as JSON string"""
        self.config = json.dumps(config_dict)

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'status': self.status,
            'current_stage': self.current_stage,
            'overall_progress': self.overall_progress,
            'stages': self.get_stages(),
            'config': self.get_config(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'estimated_completion': self.estimated_completion.isoformat() if self.estimated_completion else None,
            'error': self.error
        }

class ProcessingLog(db.Model):
    __tablename__ = 'processing_logs'

    id = db.Column(db.String(100), primary_key=True)
    processing_status_id = db.Column(db.Integer, db.ForeignKey('processing_status.id'), nullable=False)
    session_id = db.Column(db.String(100), nullable=False)  # Denormalized for easy querying
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')  # info, success, error, warning
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'message': self.message,
            'type': self.type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Domain(db.Model):
    __tablename__ = 'domains'

    id = db.Column(db.String(100), primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ConversationCycle(db.Model):
    """Track conversation cycles within a session"""
    __tablename__ = 'conversation_cycles'

    id = db.Column(db.String(100), primary_key=True)  # cycle_uuid
    session_id = db.Column(db.String(100), db.ForeignKey('sessions.id'), nullable=False)
    cycle_number = db.Column(db.Integer, nullable=False)  # 1, 2, 3, etc. within session
    cycle_type = db.Column(db.String(50), nullable=False)  # 'initial', 'followup', 'clarification'

    # Conversation state tracking
    current_step = db.Column(db.String(50), default='query')  # query, ambiguity, context, processing, completed
    ambiguity_status = db.Column(db.String(50))  # active, context_confirmation, completed
    processing_status = db.Column(db.String(50))  # initializing, processing, completed, failed

    # Question tracking
    initial_query = db.Column(db.Text)
    total_questions_asked = db.Column(db.Integer, default=0)
    total_questions_answered = db.Column(db.Integer, default=0)
    questions_extended = db.Column(db.Boolean, default=False)

    # State metadata
    context_confirmed = db.Column(db.Boolean, default=False)
    processing_completed = db.Column(db.Boolean, default=False)
    results_generated = db.Column(db.Boolean, default=False)

    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ambiguity_started_at = db.Column(db.DateTime)
    context_confirmed_at = db.Column(db.DateTime)
    processing_started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Relationships
    session = db.relationship('Session', backref='conversation_cycles')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'cycle_number': self.cycle_number,
            'cycle_type': self.cycle_type,
            'current_step': self.current_step,
            'ambiguity_status': self.ambiguity_status,
            'processing_status': self.processing_status,
            'initial_query': self.initial_query,
            'total_questions_asked': self.total_questions_asked,
            'total_questions_answered': self.total_questions_answered,
            'questions_extended': self.questions_extended,
            'context_confirmed': self.context_confirmed,
            'processing_completed': self.processing_completed,
            'results_generated': self.results_generated,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ambiguity_started_at': self.ambiguity_started_at.isoformat() if self.ambiguity_started_at else None,
            'context_confirmed_at': self.context_confirmed_at.isoformat() if self.context_confirmed_at else None,
            'processing_started_at': self.processing_started_at.isoformat() if self.processing_started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }