import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class KnowledgeContent(Base):
    __tablename__ = "KnowledgeContent"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    category = Column(String, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=False)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    questions = relationship("KnowledgeQuestion", back_populates="content", cascade="all, delete-orphan")
    answers = relationship("KnowledgeAnswer", back_populates="content", cascade="all, delete-orphan")


class KnowledgeQuestion(Base):
    __tablename__ = "KnowledgeQuestion"

    id = Column(String, primary_key=True, default=generate_uuid)
    contentId = Column(String, ForeignKey("KnowledgeContent.id", ondelete="CASCADE"), nullable=False)
    questionText = Column(String, nullable=False)
    embeddingOpenAI = Column(Vector(1536), nullable=True)
    embeddingLocal = Column(Vector(128), nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=False)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    content = relationship("KnowledgeContent", back_populates="questions")


class KnowledgeAnswer(Base):
    __tablename__ = "KnowledgeAnswer"

    id = Column(String, primary_key=True, default=generate_uuid)
    contentId = Column(String, ForeignKey("KnowledgeContent.id", ondelete="CASCADE"), nullable=False)
    answerText = Column(String, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=False)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    content = relationship("KnowledgeContent", back_populates="answers")
