"""
Processing Management API Resources for Blue Sherpa Analytics Engine
"""

from flask_restful import Resource
from flask import request, session, current_app
from datetime import datetime, timedelta
import threading
import time
import random

from db_service import db_service
from utils.helpers import success_response, error_response, require_auth
from config import Config

class ProcessingStart(Resource):
    """Start the analytics processing pipeline"""
    
    @require_auth
    def post(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            session_dict = session_data.to_dict() if session_data else {}
            if session_data and session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            data = request.get_json()
            processing_config = data.get('config', {}) if data else {}
            
            # Extract processing parameters
            processing_time = processing_config.get('processing_time', Config.DEFAULT_PROCESSING_TIME)
            analytics_depth = processing_config.get('analytics_depth', 'moderate')
            reporting_style = processing_config.get('reporting_style', 'detailed')
            cross_validation = processing_config.get('cross_validation', 'medium')
            
            # Validate processing time
            if processing_time < Config.MIN_PROCESSING_TIME or processing_time > Config.MAX_PROCESSING_TIME:
                processing_time = Config.DEFAULT_PROCESSING_TIME
            
            # Create processing status
            config_data = {
                'processing_time': processing_time,
                'analytics_depth': analytics_depth,
                'reporting_style': reporting_style,
                'cross_validation': cross_validation
            }
            
            # Delete any existing processing status and logs to avoid UNIQUE constraint error
            existing_processing = db_service.get_processing_status(session_id)
            if existing_processing:
                db_service.delete_processing_status(session_id)
                # Also clear any existing logs
                db_service.clear_processing_logs(session_id)

            processing_data = db_service.create_processing_status(session_id, config_data)
            print(f"✅ Created processing status for session {session_id}")

            # Start processing in background thread with app context
            processing_thread = threading.Thread(
                target=self._process_analytics_with_context,
                args=(session_id, processing_time)
            )
            processing_thread.daemon = True
            processing_thread.start()
            print(f"🧵 Started background processing thread for session {session_id}")

            # Update session status and close ambiguity resolution
            db_service.update_session(session_id, {
                'current_step': 'processing',
                'status': 'processing',
            })

            # Mark ambiguity resolution as completed to hide buttons
            db_service.complete_ambiguity_resolution(session_id)

            # Add a small delay to ensure the processing status is available when frontend polls
            time.sleep(0.1)
            
            return success_response({
                'message': 'Processing started',
                'processing_id': session_id,
                'estimated_duration': f"{processing_time} minutes",
                'config': config_data
            })
            
        except Exception as e:
            return error_response(f'Failed to start processing: {str(e)}', 500)

    def _process_analytics_with_context(self, session_id, total_time_minutes):
        """Wrapper to run processing with Flask app context"""
        try:
            print(f"🔄 Processing thread started for session {session_id}")
            with current_app.app_context():
                self._process_analytics(session_id, total_time_minutes)
            print(f"✅ Processing thread completed for session {session_id}")
        except Exception as e:
            print(f"❌ Processing thread error for session {session_id}: {str(e)}")
            # Try to update status to failed even if there's an error
            try:
                with current_app.app_context():
                    db_service.update_processing_status(session_id, {
                        'status': 'failed',
                        'error': str(e)
                    })
            except Exception as db_error:
                print(f"❌ Failed to update error status: {db_error}")

    def _process_analytics(self, session_id, total_time_minutes):
        """Background processing simulation"""
        try:
            # Log the start of processing
            print(f"🚀 Starting background processing for session {session_id} with {total_time_minutes} minutes")
            total_seconds = total_time_minutes * 60
            stages = Config.PROCESSING_STAGES
            
            # Add initial logs with better messaging
            db_service.add_processing_log(
                session_id,
                "🚀 Initializing BLUE SHERPA cognitive processing pipeline",
                "info"
            )
            time.sleep(0.5)
            db_service.add_processing_log(
                session_id,
                "🧠 Loading analytical models and domain expertise",
                "info"
            )

            processing_data = db_service.get_processing_status(session_id)
            if not processing_data:
                return
            
            # Process each stage
            for stage_index, stage_config in enumerate(stages):
                stage_duration = (stage_config['duration'] / 100) * total_seconds
                
                # Update stage to processing
                stages_list = processing_data.get_stages()
                stages_list[stage_index]['status'] = 'processing'
                stages_list[stage_index]['started_at'] = datetime.utcnow().isoformat()
                stages_list[stage_index]['progress'] = 0
                db_service.update_processing_status(session_id, {
                    'stages': stages_list,
                    'current_stage': stage_index
                })
                
                # Add stage start log
                db_service.add_processing_log(
                    session_id,
                    f"Starting {stage_config['name']}...",
                    "info"
                )
                
                # Simulate stage processing with progress updates
                steps = 10  # Number of progress updates per stage (reduced for smoother demo)
                step_duration = max(stage_duration / steps, 1.0)  # Minimum 1.0 seconds per step for better visibility
                
                for step in range(steps + 1):
                    # Check if processing was stopped
                    current_status = db_service.get_processing_status(session_id)
                    if not current_status or current_status.status == 'stopped':
                        return
                    
                    progress = (step / steps) * 100
                    stages_list[stage_index]['progress'] = progress

                    # Calculate overall progress more accurately
                    completed_weight = sum(stages[i]['duration'] for i in range(stage_index) if stages_list[i]['status'] == 'completed')
                    current_stage_contribution = (progress / 100) * stage_config['duration']
                    total_weight = sum(stage['duration'] for stage in stages)
                    overall_progress = ((completed_weight + current_stage_contribution) / total_weight) * 100

                    db_service.update_processing_status(session_id, {
                        'stages': stages_list,
                        'overall_progress': min(overall_progress, 100)
                    })

                    # Add progress logs every 25% of stage completion
                    if step > 0 and step % (steps // 4) == 0 and step < steps:
                        progress_percent = int(progress)
                        db_service.add_processing_log(
                            session_id,
                            f"📊 {stage_config['name']} - {progress_percent}% completed",
                            "info"
                        )

                    time.sleep(step_duration)
                
                # Complete stage
                stages_list[stage_index]['status'] = 'completed'
                stages_list[stage_index]['progress'] = 100
                stages_list[stage_index]['completed_at'] = datetime.utcnow().isoformat()
                db_service.update_processing_status(session_id, {
                    'stages': stages_list
                })

                # Add stage completion log
                db_service.add_processing_log(
                    session_id,
                    f"{stage_config['name']} completed successfully",
                    "success"
                )
                
                # Add some realistic processing logs with better timing
                stage_logs = self._get_stage_logs(stage_config['name'])
                for i, log_msg in enumerate(stage_logs):
                    # Check if processing was stopped
                    current_status = db_service.get_processing_status(session_id)
                    if not current_status or current_status.status == 'stopped':
                        return

                    db_service.add_processing_log(session_id, log_msg, "info")
                    time.sleep(1.0 if i == 0 else 0.8)  # Slightly longer pauses for better readability
            
            # Mark processing as completed
            db_service.update_processing_status(session_id, {
                'status': 'completed',
                'overall_progress': 100,
                'completed_at': datetime.utcnow()
            })

            # Add final completion logs
            db_service.add_processing_log(
                session_id,
                "✨ All processing stages completed successfully",
                "success"
            )
            time.sleep(0.5)
            db_service.add_processing_log(
                session_id,
                "🎉 BLUE SHERPA analytics processing complete - results ready",
                "success"
            )
            time.sleep(0.5)
            db_service.add_processing_log(
                session_id,
                "📤 Preparing final analysis report...",
                "info"
            )
            
            # Update session status and add assistant message
            db_service.update_session(session_id, {
                'current_step': 'completed',
                'status': 'completed',
            })
            
            # Generate analytics results based on domain
            session = db_service.get_session(session_id)
            domain = session.domain if session else 'Finance'
            analytics_result = self._generate_analytics_result(domain)

            # Add assistant response message with results
            assistant_message_data = {
                'type': 'assistant',
                'content': analytics_result,
                'status': 'completed'
            }
            db_service.add_message(session_id, assistant_message_data)

            # Update ambiguity message status to completed for this conversation cycle
            db_service.update_message_status(session_id, 'ambiguity', 'completed')
            
        except Exception as e:
            # Handle processing errors (already within app context)
            print(f"❌ Processing error for session {session_id}: {str(e)}")
            try:
                db_service.add_processing_log(
                    session_id,
                    f"Processing error: {str(e)}",
                    "error"
                )

                db_service.update_processing_status(session_id, {
                    'status': 'failed',
                    'error': str(e)
                })
            except Exception as db_error:
                print(f"Failed to log processing error: {db_error}")
    
    def _get_stage_logs(self, stage_name):
        """Get realistic log messages for each processing stage"""
        stage_logs = {
            'Planning': [
                "🔍 Loading domain-specific knowledge base",
                "📊 Parsing user query and extracting key entities",
                "🎯 Generating analytical strategy framework",
                "✅ Planning phase complete - strategy defined"
            ],
            'Coding': [
                "💻 Generating data analysis scripts",
                "⚡ Optimizing query structures for performance",
                "🔧 Validating code syntax and logic",
                "✅ Code generation complete - algorithms ready"
            ],
            'In-conversation Verification': [
                "🔗 Cross-referencing user context with generated code",
                "📋 Validating analytical approach against requirements",
                "🎯 Performing contextual accuracy checks",
                "✅ Verification complete - context aligned"
            ],
            'Execution': [
                "🚀 Executing analytical algorithms",
                "⚙️ Processing data with applied filters and constraints",
                "📈 Calculating statistical measures and metrics",
                "✅ Execution complete - results generated"
            ],
            'Code-fixing': [
                "🔍 Reviewing code execution results",
                "🛠️ Applying optimization corrections",
                "✨ Finalizing computational accuracy",
                "✅ Code refinement complete - optimized"
            ],
            'Plan Optimization': [
                "📊 Cross-referencing results with historical patterns",
                "🎯 Optimizing analytical insights delivery",
                "📋 Preparing result synthesis",
                "✅ Optimization complete - insights enhanced"
            ],
            'Summarization': [
                "📝 Generating insights and recommendations",
                "🎨 Formatting results for presentation",
                "📊 Finalizing analytical report structure",
                "✅ Summarization complete - report ready"
            ]
        }

        return stage_logs.get(stage_name, ["🔄 Processing " + stage_name.lower()])

    def _generate_analytics_result(self, domain):
        """Generate domain-specific analytics results"""
        results = {
            'Finance': """# Financial Performance Analysis Report

## Executive Summary
The analysis reveals significant growth trends across key financial metrics with notable improvements in revenue generation and cost optimization.

## Key Findings

### Revenue Performance
- **Total Revenue**: $12.4M (+18% YoY)
- **Quarterly Growth**: 22% increase from Q3 to Q4
- **Regional Distribution**:
  - North America: $6.2M (50%)
  - Europe: $3.7M (30%)
  - Asia-Pacific: $2.5M (20%)

### Cost Analysis
- **Customer Acquisition Cost (CAC)**: $450 (-15% from previous quarter)
- **Operating Expenses**: $8.1M (65% of revenue)
- **EBITDA Margin**: 35% (+5 percentage points YoY)

### Product Category Performance
| Category | Revenue | Growth | Market Share |
|----------|---------|--------|-------------|
| Enterprise | $5.8M | +25% | 47% |
| Mid-Market | $4.1M | +15% | 33% |
| SMB | $2.5M | +12% | 20% |

### Conversion Metrics
- **Lead-to-Customer Rate**: 24% (+6% improvement)
- **Average Deal Size**: $125K (+10% increase)
- **Sales Cycle**: 45 days (-5 days reduction)

## Recommendations
1. **Increase investment** in North American market given strong performance
2. **Optimize CAC** further through improved targeting
3. **Focus on Enterprise segment** for higher margins
4. **Implement pricing optimization** for Mid-Market segment

## Risk Assessment
- Currency fluctuation impact on international revenue
- Increasing competition in SMB segment
- Dependency on top 10 customers (35% of revenue)

---
*Analysis completed using BLUE SHERPA Cognitive Engine v2.0*""",

            'Marketing': """# Marketing Campaign Performance Analysis

## Campaign Overview
Multi-channel marketing analysis reveals strong digital performance with opportunities for traditional channel optimization.

## Performance Metrics

### Digital Marketing
- **Overall ROI**: 312% (+45% vs target)
- **Total Reach**: 2.4M unique users
- **Engagement Rate**: 8.2% (industry avg: 5.1%)
- **Conversion Rate**: 3.8%

### Channel Performance
| Channel | Spend | Revenue | ROI | Conversions |
|---------|-------|---------|-----|-------------|
| Google Ads | $250K | $1.1M | 440% | 2,840 |
| Social Media | $180K | $650K | 361% | 1,920 |
| Email | $45K | $380K | 844% | 1,450 |
| Content | $120K | $480K | 400% | 890 |

### Audience Insights
- **Top Performing Segments**:
  - Tech Professionals (CTR: 12.4%)
  - Decision Makers (Conv: 6.2%)
  - Early Adopters (LTV: $3,200)

### Campaign Effectiveness
- **Brand Awareness**: +34% lift
- **Consideration**: +28% increase
- **Purchase Intent**: +41% improvement

## Recommendations
1. **Scale email marketing** given exceptional ROI
2. **Refine social targeting** to tech professionals
3. **Test new creative formats** for display ads
4. **Implement attribution modeling** for better insights

---
*Powered by BLUE SHERPA Analytics Engine*""",

            'Sales': """# Sales Territory Performance Analysis

## Territory Overview
Comprehensive analysis of sales performance across all territories with focus on pipeline health and rep productivity.

## Territory Performance

### Regional Results
| Territory | Revenue | Target | Achievement | Pipeline |
|-----------|---------|--------|-------------|----------|
| Northeast | $3.2M | $2.8M | 114% | $8.5M |
| Southwest | $2.8M | $2.5M | 112% | $7.2M |
| Central | $2.4M | $2.6M | 92% | $6.1M |
| Pacific | $2.1M | $2.0M | 105% | $5.8M |

### Sales Rep Performance
- **Top Performers**: 8 reps exceeding 120% of quota
- **Average Quota Attainment**: 106%
- **New Rep Ramp Time**: 3.2 months (improved from 4.5)

### Pipeline Analysis
- **Total Pipeline Value**: $27.6M
- **Pipeline Coverage**: 3.2x (healthy)
- **Win Rate**: 28% (+3% QoQ)
- **Average Deal Size**: $95K

### Activity Metrics
- **Calls per Rep**: 48/day (+15%)
- **Meetings Booked**: 12/week
- **Proposals Sent**: 8/week
- **Close Rate**: 24%

## Key Insights
1. Northeast territory exceeding all metrics
2. Central territory needs additional support
3. Strong pipeline coverage indicates Q1 success
4. Win rates improving across all segments

## Recommendations
1. **Replicate Northeast** best practices
2. **Provide coaching** for Central territory
3. **Invest in sales enablement** tools
4. **Implement territory rebalancing** for Q2

---
*Analysis by BLUE SHERPA Sales Intelligence*""",

            'Customer Service': """# Customer Service Quality Analysis

## Service Performance Overview
Comprehensive analysis of customer service metrics revealing opportunities for response time optimization and satisfaction improvement.

## Key Metrics

### Response Performance
- **Average Response Time**: 2.4 hours (Target: 3 hours) ✅
- **First Contact Resolution**: 72% (+8% improvement)
- **Escalation Rate**: 12% (-3% reduction)
- **SLA Compliance**: 94%

### Channel Analysis
| Channel | Volume | Avg Response | CSAT | Resolution Rate |
|---------|--------|--------------|------|----------------|
| Phone | 8,420 | 3.2 min | 88% | 78% |
| Email | 12,350 | 4.1 hours | 82% | 68% |
| Chat | 15,680 | 45 seconds | 91% | 74% |
| Social | 3,240 | 1.8 hours | 85% | 65% |

### Customer Satisfaction
- **Overall CSAT**: 86% (+4% YoY)
- **NPS Score**: 52 (Excellent)
- **Customer Effort Score**: 3.2/5
- **Repeat Contact Rate**: 18%

### Agent Performance
- **Average Handle Time**: 6.8 minutes
- **Tickets per Agent**: 45/day
- **Quality Score**: 92%
- **Training Completion**: 96%

## Trending Issues
1. Password reset requests (18% of volume)
2. Billing inquiries (15%)
3. Feature requests (12%)
4. Technical support (35%)

## Recommendations
1. **Implement self-service** for password resets
2. **Enhance chat bot** capabilities
3. **Create knowledge base** for common issues
4. **Optimize email response** workflows

---
*BLUE SHERPA Service Analytics Platform*"""
        }

        return results.get(domain, results['Finance'])

class ProcessingStatus(Resource):
    """Get current processing status"""
    
    @require_auth
    def get(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            session_dict = session_data.to_dict() if session_data else {}
            if session_data and session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            processing_data = db_service.get_processing_status(session_id)
            if not processing_data:
                return error_response('No processing data found', 404)

            processing_dict = processing_data.to_dict()

            # Format stages for response
            formatted_stages = []
            for stage in processing_dict['stages']:
                formatted_stages.append({
                    'id': stage['id'],
                    'name': stage['name'],
                    'icon': stage['icon'],
                    'status': stage['status'],
                    'progress': stage['progress'],
                    'started_at': stage.get('started_at'),
                    'completed_at': stage.get('completed_at')
                })

            return success_response({
                'session_id': processing_dict['session_id'],
                'status': processing_dict['status'],
                'current_stage': processing_dict['current_stage'],
                'overall_progress': processing_dict['overall_progress'],
                'stages': formatted_stages,
                'started_at': processing_dict['started_at'],
                'estimated_completion': processing_dict.get('estimated_completion'),
                'config': processing_dict['config']
            })
            
        except Exception as e:
            return error_response(f'Failed to get processing status: {str(e)}', 500)

class ProcessingStop(Resource):
    """Force stop processing"""
    
    @require_auth
    def post(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            session_dict = session_data.to_dict() if session_data else {}
            if session_data and session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            processing_data = db_service.get_processing_status(session_id)
            if not processing_data:
                return error_response('No processing data found', 404)

            if processing_data.status != 'processing':
                return error_response('Processing is not active', 400)

            # Mark as stopped
            stages_list = processing_data.get_stages()
            # Mark all non-completed stages as stopped
            for stage in stages_list:
                if stage['status'] == 'processing':
                    stage['status'] = 'stopped'
                    stage['completed_at'] = datetime.utcnow().isoformat()

                elif stage['status'] == 'queued':
                    stage['status'] = 'cancelled'

            db_service.update_processing_status(session_id, {
                'status': 'stopped',
                'stages': stages_list
            })

            # Add stop log
            db_service.add_processing_log(
                session_id,
                "Processing was manually stopped by user",
                "warning"
            )
            
            # Update session status
            db_service.update_session(session_id, {
                'current_step': 'completed',
                'status': 'stopped',
            })
            
            # Add assistant message about stopping
            assistant_message_data = {
                'type': 'assistant',
                'content': 'Analysis Stopped - Processing was manually interrupted',
                'status': 'completed'
            }
            db_service.add_message(session_id, assistant_message_data)
            
            return success_response({
                'message': 'Processing stopped successfully',
                'status': 'stopped'
            })
            
        except Exception as e:
            return error_response(f'Failed to stop processing: {str(e)}', 500)

class ProcessingLogs(Resource):
    """Get processing logs for a session"""
    
    @require_auth
    def get(self, session_id):
        try:
            # Verify session access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)
            
            user_id = session.get('user_id')
            session_dict = session_data.to_dict() if session_data else {}
            if session_data and session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)
            
            logs = db_service.get_processing_logs(session_id)

            # Format logs for response
            formatted_logs = []
            for log in logs:
                log_dict = log.to_dict() if hasattr(log, 'to_dict') else log
                formatted_logs.append({
                    'id': log_dict['id'],
                    'timestamp': log_dict['timestamp'],
                    'message': log_dict['message'],
                    'type': log_dict['type']
                })
            
            return success_response({
                'logs': formatted_logs,
                'total_count': len(formatted_logs)
            })
            
        except Exception as e:
            return error_response(f'Failed to get processing logs: {str(e)}', 500)

class ProcessingComplete(Resource):
    """Complete processing and generate final result"""

    @require_auth
    def post(self, session_id):
        try:
            # Verify session exists and user has access
            session_data = db_service.get_session(session_id)
            if not session_data:
                return error_response('Session not found', 404)

            user_id = session.get('user_id')
            session_dict = session_data.to_dict() if session_data else {}
            if session_data and session_dict['user_id'] != user_id:
                return error_response('Access denied', 403)

            print(f"🎯 Completing processing for session {session_id}")

            # Populate dummy logs for this session
            self._populate_dummy_logs(session_id)

            # Mark processing as completed
            db_service.update_processing_status(session_id, {
                'status': 'completed',
                'overall_progress': 100,
                'completed_at': datetime.utcnow()
            })

            # Update session status and add assistant message
            db_service.update_session(session_id, {
                'current_step': 'completed',
                'status': 'completed',
            })

            # Generate analytics results based on domain
            domain = session_dict['domain'] if session_dict else 'Finance'
            analytics_result = self._generate_analytics_result(domain)

            # Add assistant response message with results
            assistant_message_data = {
                'type': 'assistant',
                'content': analytics_result,
                'status': 'completed'
            }
            db_service.add_message(session_id, assistant_message_data)

            # Update ambiguity message status to completed for this conversation cycle
            db_service.update_message_status(session_id, 'ambiguity', 'completed')

            return success_response({
                'message': 'Processing completed successfully',
                'session_id': session_id,
                'status': 'completed'
            })

        except Exception as e:
            print(f"❌ Failed to complete processing: {str(e)}")
            return error_response(f'Failed to complete processing: {str(e)}', 500)

    def _populate_dummy_logs(self, session_id):
        """Populate database with dummy logs for the session"""
        try:
            # Clear existing logs first
            db_service.clear_processing_logs(session_id)

            # Add realistic processing logs
            dummy_logs = [
                "🚀 Initializing BLUE SHERPA cognitive processing pipeline",
                "🧠 Loading analytical models and domain expertise",
                "🔍 Loading domain-specific knowledge base",
                "📊 Parsing user query and extracting key entities",
                "🎯 Generating analytical strategy framework",
                "✅ Planning phase complete - strategy defined",
                "💻 Generating data analysis scripts",
                "⚡ Optimizing query structures for performance",
                "🔧 Validating code syntax and logic",
                "✅ Code generation complete - algorithms ready",
                "🔗 Cross-referencing user context with generated code",
                "📋 Validating analytical approach against requirements",
                "🎯 Performing contextual accuracy checks",
                "✅ Verification complete - context aligned",
                "🚀 Executing analytical algorithms",
                "⚙️ Processing data with applied filters and constraints",
                "📈 Calculating statistical measures and metrics",
                "✅ Execution complete - results generated",
                "🔍 Reviewing code execution results",
                "🛠️ Applying optimization corrections",
                "✨ Finalizing computational accuracy",
                "✅ Code refinement complete - optimized",
                "📊 Cross-referencing results with historical patterns",
                "🎯 Optimizing analytical insights delivery",
                "📋 Preparing result synthesis",
                "✅ Optimization complete - insights enhanced",
                "📝 Generating insights and recommendations",
                "🎨 Formatting results for presentation",
                "📊 Finalizing analytical report structure",
                "✅ Summarization complete - report ready",
                "✨ All processing stages completed successfully",
                "🎉 BLUE SHERPA analytics processing complete - results ready",
                "📤 Preparing final analysis report..."
            ]

            for i, log_message in enumerate(dummy_logs):
                db_service.add_processing_log(session_id, log_message, "info")

            print(f"✅ Populated {len(dummy_logs)} dummy logs for session {session_id}")

        except Exception as e:
            print(f"❌ Failed to populate dummy logs: {str(e)}")

    def _generate_analytics_result(self, domain):
        """Generate domain-specific analytics results"""
        results = {
            'Finance': """# Financial Performance Analysis Report

## Executive Summary
The analysis reveals significant growth trends across key financial metrics with notable improvements in revenue generation and cost optimization.

## Key Findings

### Revenue Performance
- **Total Revenue**: $12.4M (+18% YoY)
- **Quarterly Growth**: 22% increase from Q3 to Q4
- **Regional Distribution**:
  - North America: $6.2M (50%)
  - Europe: $3.7M (30%)
  - Asia-Pacific: $2.5M (20%)

### Cost Analysis
- **Customer Acquisition Cost (CAC)**: $450 (-15% from previous quarter)
- **Operating Expenses**: $8.1M (65% of revenue)
- **EBITDA Margin**: 35% (+5 percentage points YoY)

### Product Category Performance
| Category | Revenue | Growth | Market Share |
|----------|---------|--------|-------------|
| Enterprise | $5.8M | +25% | 47% |
| Mid-Market | $4.1M | +15% | 33% |
| SMB | $2.5M | +12% | 20% |

### Conversion Metrics
- **Lead-to-Customer Rate**: 24% (+6% improvement)
- **Average Deal Size**: $125K (+10% increase)
- **Sales Cycle**: 45 days (-5 days reduction)

## Recommendations
1. **Increase investment** in North American market given strong performance
2. **Optimize CAC** further through improved targeting
3. **Focus on Enterprise segment** for higher margins
4. **Implement pricing optimization** for Mid-Market segment

## Risk Assessment
- Currency fluctuation impact on international revenue
- Increasing competition in SMB segment
- Dependency on top 10 customers (35% of revenue)

*Generated by BLUE SHERPA Analytics Engine*""",

            'Marketing': """# Marketing Performance Analysis Report

## Executive Summary
Comprehensive analysis of marketing effectiveness reveals strong digital performance with opportunities for channel optimization.

## Key Metrics

### Campaign Performance
- **Total Campaigns**: 45 active campaigns
- **Average CTR**: 3.2% (+0.8% improvement)
- **Conversion Rate**: 12.5% (+2.1% YoY)
- **Cost Per Lead**: $35 (-12% optimization)

### Channel Analysis
- **Digital Channels**: 68% of total leads
- **Organic Search**: 34% of conversions
- **Paid Social**: 22% of conversions
- **Email Marketing**: 18% ROI

### Audience Insights
- **Primary Demographics**: 25-45 age group (62%)
- **Geographic Focus**: Urban markets (78%)
- **Engagement Rate**: 15.3% across channels

## Strategic Recommendations
1. **Expand organic search** investment
2. **Optimize social media** targeting
3. **Enhance email** personalization
4. **Develop mobile-first** strategies

*Generated by BLUE SHERPA Analytics Engine*""",

            'Operations': """# Operational Efficiency Analysis Report

## Executive Summary
Analysis reveals strong operational performance with identified optimization opportunities in process efficiency and resource allocation.

## Performance Metrics

### Efficiency Indicators
- **Overall Equipment Effectiveness**: 84% (+6% improvement)
- **Process Cycle Time**: 2.3 hours (-15% reduction)
- **Quality Rate**: 98.7% (+1.2% improvement)
- **Resource Utilization**: 89% (+4% optimization)

### Cost Analysis
- **Operational Costs**: $5.2M (-8% YoY)
- **Productivity Index**: 125 (+12 points)
- **Waste Reduction**: 23% decrease

### Process Optimization
- **Automation Level**: 67% of processes
- **Digital Transformation**: 78% completion
- **Staff Efficiency**: +19% productivity gain

## Strategic Initiatives
1. **Implement advanced automation** for remaining manual processes
2. **Optimize supply chain** logistics
3. **Enhance workforce** training programs
4. **Deploy predictive maintenance** systems

*Generated by BLUE SHERPA Analytics Engine*"""
        }

        return results.get(domain, results['Finance'])