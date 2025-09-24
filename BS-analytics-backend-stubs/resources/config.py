"""
Configuration API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session
from datetime import datetime

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth
from config import Config

class ConfigDomains(Resource):
    """Manage analytics domains configuration"""
    
    @require_auth
    def get(self):
        """Get all available domains"""
        try:
            domains = db_service.get_domains()

            # Format domains for response
            domains_list = []
            for domain_data in domains:
                domain_dict = domain_data.to_dict() if hasattr(domain_data, 'to_dict') else domain_data
                domains_list.append({
                    'id': domain_dict['id'],
                    'name': domain_dict['name'],
                    'description': domain_dict['description'],
                    'usage_count': domain_dict['usage_count'],
                    'created_at': domain_dict['created_at']
                })
            
            # Sort by usage count and name
            domains_list.sort(key=lambda x: (-x['usage_count'], x['name']))
            
            return success_response({
                'domains': domains_list,
                'total_count': len(domains_list),
                'default_domains': Config.SUPPORTED_DOMAINS
            })
            
        except Exception as e:
            return error_response(f'Failed to get domains: {str(e)}', 500)
    
    @require_auth
    def post(self):
        """Add a new domain"""
        try:
            data = request.get_json()
            if not data:
                return error_response('No data provided', 400)
            
            domain_name = data.get('name', '').strip()
            description = data.get('description', '').strip()
            
            if not domain_name:
                return error_response('Domain name is required', 400)
            
            # Check if domain already exists
            domain_id = domain_name.lower().replace(' ', '_')
            domains = db_service.get_domains()
            existing_domain = any(d.id == domain_id for d in domains)

            if existing_domain:
                return error_response('Domain already exists', 409)

            # Create new domain
            domain_data = db_service.create_domain({
                'id': domain_id,
                'name': domain_name,
                'description': description or f'{domain_name} analytics and insights'
            })

            domain_dict = domain_data.to_dict()
            return success_response({
                'message': 'Domain created successfully',
                'domain': {
                    'id': domain_dict['id'],
                    'name': domain_dict['name'],
                    'description': domain_dict['description'],
                    'created_at': domain_dict['created_at']
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to create domain: {str(e)}', 500)

class ConfigModels(Resource):
    """Get available LLM models configuration"""
    
    @require_auth
    def get(self):
        """Get all available LLM models"""
        try:
            return success_response({
                'models': Config.AVAILABLE_MODELS,
                'default_model': 'gpt-4',
                'analysis_depths': Config.ANALYSIS_DEPTHS,
                'report_formats': Config.REPORT_FORMATS,
                'validation_levels': Config.VALIDATION_LEVELS,
                'processing_time_range': {
                    'min': Config.MIN_PROCESSING_TIME,
                    'max': Config.MAX_PROCESSING_TIME,
                    'default': Config.DEFAULT_PROCESSING_TIME
                }
            })
            
        except Exception as e:
            return error_response(f'Failed to get models configuration: {str(e)}', 500)