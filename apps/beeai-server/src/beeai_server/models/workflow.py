"""
Workflow models.

This module defines the database models related to workflows.
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON

from beeai_server.models import Base


class WorkflowModel(Base):
    """
    Database model for workflows.
    
    Represents a saved workflow with its steps and metadata.
    """
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    steps = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    def __repr__(self):
        return f"<WorkflowModel(id='{self.id}', name='{self.name}')>" 
