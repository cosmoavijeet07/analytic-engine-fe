"""
Configuration settings for Blue Sherpa Analytics Engine
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'blue-sherpa-analytics-secret-key-2025'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Processing configuration
    MIN_PROCESSING_TIME = 3  # minutes (increased for demo visibility)
    MAX_PROCESSING_TIME = 30  # minutes
    DEFAULT_PROCESSING_TIME = 6  # minutes (increased for better demo)
    
    # Analytics configuration
    SUPPORTED_DOMAINS = [
        'Finance',
        'Marketing', 
        'Operations',
        'Sales',
        'Human Resources',
        'Technology',
        'Customer Service',
        'Product Management',
        'Supply Chain',
        'Legal'
    ]
    
    ANALYSIS_DEPTHS = ['basic', 'moderate', 'deep']
    REPORT_FORMATS = ['executive', 'detailed', 'visual']
    VALIDATION_LEVELS = ['low', 'medium', 'high']
    
    # LLM Models
    AVAILABLE_MODELS = [
        {'value': 'gpt-4', 'label': 'GPT-4'},
        {'value': 'gpt-3.5-turbo', 'label': 'GPT-3.5 Turbo'},
        {'value': 'claude-3', 'label': 'Claude 3'},
        {'value': 'gemini-pro', 'label': 'Gemini Pro'}
    ]
    
    # Processing stages configuration
    PROCESSING_STAGES = [
        {'id': 'planning', 'name': 'Planning', 'icon': 'Database', 'duration': 15},
        {'id': 'coding', 'name': 'Coding', 'icon': 'Code', 'duration': 25},
        {'id': 'verification', 'name': 'In-conversation Verification', 'icon': 'TrendingUp', 'duration': 20},
        {'id': 'execution', 'name': 'Execution', 'icon': 'FileText', 'duration': 20},
        {'id': 'fixing', 'name': 'Code-fixing', 'icon': 'Code', 'duration': 10},
        {'id': 'optimization', 'name': 'Plan Optimization', 'icon': 'TrendingUp', 'duration': 5},
        {'id': 'summarization', 'name': 'Summarization', 'icon': 'FileText', 'duration': 5}
    ]
    
    # Ambiguity questions by domain (2 initial questions)
    DOMAIN_AMBIGUITY_QUESTIONS = {
        'Finance': [
            'By "regional differences" - do you mean geographical regions, sales territories, or market segments?',
            'For "customer acquisition metrics" - should I include CAC, LTV, or specific conversion rates?'
        ],
        'Marketing': [
            'By "campaign performance" - do you mean ROI, engagement rates, or conversion metrics?',
            'For "audience segmentation" - should I focus on demographics, behavior, or psychographics?'
        ],
        'Sales': [
            'By "sales performance" - do you mean revenue, volume, or conversion rates?',
            'For "territory analysis" - should I segment by geography, industry, or account size?'
        ],
        'Operations': [
            'By "operational efficiency" - do you mean cost reduction, time optimization, or quality metrics?',
            'For "process analysis" - should I focus on bottlenecks, resource allocation, or workflow optimization?'
        ],
        'Human Resources': [
            'By "employee performance" - do you mean productivity, satisfaction, or retention metrics?',
            'For "workforce analysis" - should I segment by department, role level, or tenure?'
        ],
        'Technology': [
            'By "system performance" - do you mean response time, throughput, or reliability metrics?',
            'For "technology stack analysis" - should I focus on infrastructure, applications, or security?'
        ],
        'Customer Service': [
            'By "service quality" - do you mean response time, resolution rate, or customer satisfaction?',
            'For "channel analysis" - should I include phone, email, chat, or all support channels?'
        ],
        'Product Management': [
            'By "product performance" - do you mean usage metrics, feature adoption, or user satisfaction?',
            'For "product analysis" - should I focus on individual features, product lines, or entire portfolio?'
        ],
        'Supply Chain': [
            'By "supply chain efficiency" - do you mean cost, delivery time, or inventory optimization?',
            'For "vendor analysis" - should I focus on performance, cost, or risk assessment?'
        ],
        'Legal': [
            'By "legal analysis" - do you mean compliance metrics, case outcomes, or risk assessment?',
            'For "regulatory focus" - should I prioritize specific jurisdictions or regulations?'
        ]
    }
    
    # Additional ambiguity questions for extended resolution (flexible count)
    ADDITIONAL_QUESTIONS = [
        'Should I include seasonal adjustments in the analysis?',
        'Do you want to segment by product categories or customer types?',
        'Are there any specific constraints or limitations to consider?'
    ]

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}