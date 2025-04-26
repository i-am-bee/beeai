# Copyright 2025 © BeeAI a Series of LF Projects, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


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
