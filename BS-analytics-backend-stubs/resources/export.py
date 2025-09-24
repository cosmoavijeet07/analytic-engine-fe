"""
Export API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session, send_file, make_response
from datetime import datetime, timedelta
import json
import io

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth

class ExportPDF(Resource):
    """Export analytics session as PDF"""
    
    @require_auth
    def get(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            if session_data['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            if session_data['current_step'] != 'completed':
                return error_response('Analysis not completed yet', 400)
            
            # Generate PDF data (simulated)
            pdf_data = self._generate_pdf_data(session_data)
            
            return success_response({
                'session_id': session_id,
                'export_type': 'pdf',
                'filename': pdf_data['filename'],
                'size': pdf_data['size'],
                'download_ready': True,
                'download_url': f'/api/export/{session_id}/pdf/download',
                'generated_at': datetime.now().isoformat(),
                'expires_at': (datetime.now() + timedelta(hours=24)).isoformat() 
            })
            
        except Exception as e:
            return error_response(f'Failed to export PDF: {str(e)}', 500)
    
    def _generate_pdf_data(self, session_data):
        """Generate PDF export data"""
        filename = f"{session_data['title'].replace(' ', '_')}_analytics_report.pdf"
        
        return {
            'filename': filename,
            'size': '2.4 MB',
            'pages': 15,
            'sections': [
                'Executive Summary',
                'Analysis Overview',
                'Key Findings',
                'Detailed Results', 
                'Recommendations',
                'Appendix'
            ],
            'charts': 8,
            'tables': 12
        }

class ExportLogs(Resource):
    """Export processing logs"""
    
    @require_auth
    def get(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            if session_data['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            # Get processing logs
            logs = db_service.get_processing_logs(session_id)
            
            export_format = request.args.get('format', 'json').lower()
            
            if export_format == 'json':
                return self._export_logs_json(session_data, logs)
            elif export_format == 'csv':
                return self._export_logs_csv(session_data, logs)
            elif export_format == 'txt':
                return self._export_logs_txt(session_data, logs)
            else:
                return error_response('Unsupported export format', 400)
            
        except Exception as e:
            return error_response(f'Failed to export logs: {str(e)}', 500)
    
    def _export_logs_json(self, session_data, logs):
        """Export logs as JSON"""
        formatted_logs = []
        for log in logs:
            log_dict = log.to_dict() if hasattr(log, 'to_dict') else log
            formatted_logs.append({
                'id': log_dict['id'],
                'timestamp': log_dict['timestamp'].isoformat() if hasattr(log_dict['timestamp'], 'isoformat') else str(log_dict['timestamp']),
                'message': log_dict['message'],
                'type': log_dict['type']
            })
        
        session_dict = session_data.to_dict() if hasattr(session_data, 'to_dict') else session_data
        export_data = {
            'session': {
                'id': session_dict['id'],
                'title': session_dict['title'],
                'domain': session_dict['domain'],
                'created_at': session_dict['created_at'].isoformat() if hasattr(session_dict['created_at'], 'isoformat') else str(session_dict['created_at'])
            },
            'logs': formatted_logs,
            'export_info': {
                'format': 'json',
                'total_logs': len(formatted_logs),
                'exported_at': datetime.now().isoformat()
            }
        }
        
        return success_response({
            'export_data': export_data,
            'filename': f"{session_dict['title']}_processing_logs.json",
            'format': 'json',
            'size': f"{len(json.dumps(export_data))} bytes"
        })
    
    def _export_logs_csv(self, session_data, logs):
        """Export logs as CSV"""
        csv_data = "Timestamp,Type,Message\n"

        for log in logs:
            log_dict = log.to_dict() if hasattr(log, 'to_dict') else log
            timestamp = log_dict['timestamp'].strftime('%Y-%m-%d %H:%M:%S') if hasattr(log_dict['timestamp'], 'strftime') else str(log_dict['timestamp'])
            log_type = log_dict['type']
            message = log_dict['message'].replace('"', '""')  # Escape quotes
            csv_data += f'"{timestamp}","{log_type}","{message}"\n'
        
        session_dict = session_data.to_dict() if hasattr(session_data, 'to_dict') else session_data
        return success_response({
            'export_data': csv_data,
            'filename': f"{session_dict['title']}_processing_logs.csv",
            'format': 'csv',
            'rows': len(logs) + 1,  # +1 for header
            'size': f"{len(csv_data)} bytes"
        })
    
    def _export_logs_txt(self, session_data, logs):
        """Export logs as plain text"""
        session_dict = session_data.to_dict() if hasattr(session_data, 'to_dict') else session_data
        txt_data = f"Processing Logs for: {session_dict['title']}\n"
        txt_data += f"Domain: {session_dict['domain']}\n"
        txt_data += f"Session ID: {session_dict['id']}\n"
        txt_data += f"Created: {session_dict['created_at'].strftime('%Y-%m-%d %H:%M:%S') if hasattr(session_dict['created_at'], 'strftime') else str(session_dict['created_at'])}\n"
        txt_data += "=" * 50 + "\n\n"

        for log in logs:
            log_dict = log.to_dict() if hasattr(log, 'to_dict') else log
            timestamp = log_dict['timestamp'].strftime('%Y-%m-%d %H:%M:%S') if hasattr(log_dict['timestamp'], 'strftime') else str(log_dict['timestamp'])
            txt_data += f"[{timestamp}] [{log_dict['type'].upper()}] {log_dict['message']}\n"
        
        return success_response({
            'export_data': txt_data,
            'filename': f"{session_dict['title']}_processing_logs.txt",
            'format': 'txt',
            'lines': len(logs) + 5,  # +5 for header lines
            'size': f"{len(txt_data)} bytes"
        })