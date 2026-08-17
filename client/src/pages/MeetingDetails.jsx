import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { actionService } from '../services/actionService';
import AIProgressOverlay from '../components/common/AIProgressOverlay';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  Sparkles,
  Calendar,
  Users,
  Edit3,
  Trash2,
  PlusCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Source text grounding & highlighting
  const [highlightedQuote, setHighlightedQuote] = useState('');
  const transcriptRef = useRef(null);

  // Add Action Item Inline Modal state
  const [newActionModal, setNewActionModal] = useState(false);
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Unassigned');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionPriority, setNewActionPriority] = useState('Medium');
  const [newActionEvidence, setNewActionEvidence] = useState('');
  const [actionSaving, setActionSaving] = useState(false);

  // Delete action item confirmation
  const [deleteActionId, setDeleteActionId] = useState(null);
  const [deletingAction, setDeletingAction] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const res = await meetingService.getMeetingById(id);
      setMeeting(res.data.meeting);
    } catch (err) {
      console.error('Failed to load meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAI = async () => {
    try {
      setProcessingAI(true);
      setAiError('');
      const res = await meetingService.processMeetingAI(id);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMeeting(res.data.meeting);
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to analyze transcript with AI.');
    } finally {
      setProcessingAI(false);
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      setDeleting(true);
      await meetingService.deleteMeeting(id);
      navigate('/meetings');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete meeting.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleUpdateActionStatus = async (actionId, newStatus) => {
    try {
      await actionService.updateActionItem(actionId, { status: newStatus });
      setMeeting((prev) => ({
        ...prev,
        actionItems: prev.actionItems.map((item) =>
          item.id === actionId ? { ...item, status: newStatus } : item
        )
      }));
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  const handleDeleteActionItem = async () => {
    if (!deleteActionId) return;
    try {
      setDeletingAction(true);
      await actionService.deleteActionItem(deleteActionId);
      setMeeting((prev) => ({
        ...prev,
        actionItems: prev.actionItems.filter((item) => item.id !== deleteActionId)
      }));
      setDeleteActionId(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete action item.');
    } finally {
      setDeletingAction(false);
    }
  };

  const handleCreateActionItem = async (e) => {
    e.preventDefault();
    if (!newActionTask.trim()) return;

    try {
      setActionSaving(true);
      const res = await actionService.createActionItem({
        meetingId: id,
        task: newActionTask,
        owner: newActionOwner || 'Unassigned',
        dueDate: newActionDueDate || null,
        priority: newActionPriority,
        evidence: newActionEvidence || newActionTask
      });

      setMeeting((prev) => ({
        ...prev,
        actionItems: [res.data.actionItem, ...prev.actionItems]
      }));

      setNewActionModal(false);
      setNewActionTask('');
      setNewActionOwner('Unassigned');
      setNewActionDueDate('');
      setNewActionPriority('Medium');
      setNewActionEvidence('');
    } catch (err) {
      console.error('Failed to create action item:', err);
    } finally {
      setActionSaving(false);
    }
  };

  const handleViewInTranscript = (quote) => {
    if (!quote) return;
    const cleaned = quote.replace(/^["']|["']$/g, '').trim();
    setHighlightedQuote(cleaned);
    setShowTranscript(true);
    setTimeout(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const renderTranscriptWithHighlights = (transcriptText) => {
    if (!highlightedQuote || !transcriptText) return transcriptText;

    const lowerTranscript = transcriptText.toLowerCase();
    const lowerQuote = highlightedQuote.toLowerCase();
    const matchIndex = lowerTranscript.indexOf(lowerQuote);

    if (matchIndex === -1) return transcriptText;

    const before = transcriptText.slice(0, matchIndex);
    const match = transcriptText.slice(matchIndex, matchIndex + highlightedQuote.length);
    const after = transcriptText.slice(matchIndex + highlightedQuote.length);

    return (
      <>
        {before}
        <mark style={{
          backgroundColor: '#fef08a',
          color: '#1e293b',
          fontWeight: '700',
          padding: '0.15rem 0.35rem',
          borderRadius: '4px',
          boxShadow: '0 0 0 2px #eab308'
        }}>
          {match}
        </mark>
        {after}
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading meeting details...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2>Meeting Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>The requested meeting does not exist or you do not have permission to view it.</p>
        <Link to="/meetings" className="btn btn-primary">Back to Meetings</Link>
      </div>
    );
  }

  const hasAIAnalysis = Boolean(meeting.summary || (meeting.decisions && meeting.decisions.length > 0));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <AIProgressOverlay isOpen={processingAI} />

      {/* Delete Confirmation Modal for Meeting */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMeeting}
        title="Delete Meeting Record"
        message="Are you sure you want to delete this meeting? All transcript data and associated action items will be permanently removed."
        confirmText="Delete Meeting"
        loading={deleting}
      />

      {/* Delete Action Item Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteActionId)}
        onClose={() => setDeleteActionId(null)}
        onConfirm={handleDeleteActionItem}
        title="Delete Action Item"
        message="Are you sure you want to delete this action item from the tracker?"
        confirmText="Delete Item"
        loading={deletingAction}
      />

      {/* Top Header & Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/meetings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} />
          <span>Back to Meetings</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleProcessAI} disabled={processingAI} style={{ gap: '0.5rem' }}>
            <Sparkles size={16} />
            <span>{processingAI ? 'Analyzing...' : hasAIAnalysis ? 'Re-Analyze AI' : 'Analyze with AI'}</span>
          </button>

          <Link to={`/meetings/${id}/edit`} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <Edit3 size={15} />
            <span>Edit</span>
          </Link>

          <button className="btn btn-danger" onClick={() => setDeleteModalOpen(true)} title="Delete Meeting">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Meeting Title & Meta Banner */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span className="meeting-type-chip">{meeting.meetingType}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created {new Date(meeting.createdAt).toLocaleDateString()}</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', lineHeight: '1.3' }}>{meeting.title}</h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Date: <strong>{new Date(meeting.meetingDate).toLocaleDateString()}</strong></span>
          </div>
          {meeting.participants && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={16} style={{ color: 'var(--info)' }} />
              <span>Participants: <strong>{meeting.participants}</strong></span>
            </div>
          )}
        </div>

        {aiError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginTop: '1rem'
          }}>
            <AlertTriangle size={18} />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* AI Analysis Grid Banner */}
      {!hasAIAnalysis ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem', borderStyle: 'dashed', borderColor: 'var(--accent-primary)' }}>
          <Sparkles size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Processing Ready</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.925rem' }}>
            Click "Analyze with AI" above to extract structured summaries, key decisions, risks, unanswered questions, and action items automatically from your transcript.
          </p>
          <button className="btn btn-primary" onClick={handleProcessAI} disabled={processingAI}>
            <Sparkles size={18} />
            <span>Analyze Transcript Now</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2rem' }}>
          {/* Executive Summary */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Sparkles size={20} />
                <h3 style={{ fontSize: '1.15rem' }}>Executive Summary</h3>
              </div>
              <span className="badge badge-completed" style={{ gap: '0.25rem' }}>
                <ShieldCheck size={13} />
                <span>Source-backed</span>
              </span>
            </div>
            <p style={{ fontSize: '0.975rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              {meeting.summary}
            </p>
          </div>

          {/* Key Discussion Points & Decisions Row */}
          <div className="grid-cols-2">
            {/* Discussion Points */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--info)' }}>
                <MessageSquare size={20} />
                <h3 style={{ fontSize: '1.15rem' }}>Discussion Points</h3>
              </div>
              {meeting.discussionPoints && meeting.discussionPoints.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.925rem' }}>
                  {meeting.discussionPoints.map((point, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No explicit discussion points extracted.</p>
              )}
            </div>

            {/* Key Decisions */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                <CheckCircle size={20} />
                <h3 style={{ fontSize: '1.15rem' }}>Key Decisions</h3>
              </div>
              {meeting.decisions && meeting.decisions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {meeting.decisions.map((dec, idx) => {
                    const isObj = typeof dec === 'object' && dec !== null;
                    const text = isObj ? dec.text : dec;
                    const evidence = isObj ? dec.evidence : text;

                    return (
                      <div key={idx} style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{text}</span>
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem', gap: '0.2rem', padding: '0.15rem 0.4rem' }}>
                            <ShieldCheck size={11} />
                            <span>Source-backed</span>
                          </span>
                        </div>
                        {evidence && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.775rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              "{evidence.slice(0, 75)}{evidence.length > 75 ? '...' : ''}"
                            </span>
                            <button
                              onClick={() => handleViewInTranscript(evidence)}
                              style={{ color: 'var(--accent-primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}
                            >
                              <span>View in transcript</span>
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No decisions were formally concluded in this meeting.</p>
              )}
            </div>
          </div>

          {/* Risks & Unanswered Questions Row */}
          <div className="grid-cols-2">
            {/* Risks / Concerns */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--warning)' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '1.15rem' }}>Risks & Concerns</h3>
              </div>
              {meeting.risks && meeting.risks.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.925rem' }}>
                  {meeting.risks.map((r, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No explicit risks or concerns identified.</p>
              )}
            </div>

            {/* Unanswered Questions */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                <HelpCircle size={20} />
                <h3 style={{ fontSize: '1.15rem' }}>Unanswered Questions</h3>
              </div>
              {meeting.unansweredQuestions && meeting.unansweredQuestions.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.925rem' }}>
                  {meeting.unansweredQuestions.map((q, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No unanswered questions recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Items Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Extracted Action Items</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage and assign tasks extracted from this meeting</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setNewActionModal(true)}>
            <PlusCircle size={16} />
            <span>Add Action Item</span>
          </button>
        </div>

        {!meeting.actionItems || meeting.actionItems.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>No action items assigned to this meeting yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {meeting.actionItems.map((item) => {
              const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() && item.status !== 'Completed' : false;

              return (
                <div key={item.id} style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isOverdue ? 'var(--danger-bg)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: item.evidence ? '0.5rem' : 0
                  }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.task}</span>
                        {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
                        {item.evidence && (
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem', gap: '0.2rem', padding: '0.15rem 0.4rem' }}>
                            <ShieldCheck size={11} />
                            <span>Source-backed</span>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Owner: <strong style={{ color: 'var(--text-secondary)' }}>{item.owner}</strong></span>
                        <span>Due: <strong style={{ color: 'var(--text-secondary)' }}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not specified'}</strong></span>
                        <span>Priority: <strong style={{ color: 'var(--text-secondary)' }}>{item.priority}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateActionStatus(item.id, e.target.value)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        onClick={() => setDeleteActionId(item.id)}
                        style={{ color: 'var(--danger)', padding: '0.35rem' }}
                        title="Delete action item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {item.evidence && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.775rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Source: "{item.evidence}"
                      </span>
                      <button
                        onClick={() => handleViewInTranscript(item.evidence)}
                        style={{ color: 'var(--accent-primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}
                      >
                        <span>View in transcript</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transcript Accordion / Card */}
      <div className="card" ref={transcriptRef}>
        <div
          onClick={() => setShowTranscript(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.15rem' }}>Full Meeting Transcript</h3>
            {highlightedQuote && (
              <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                Highlight Active
              </span>
            )}
          </div>
          <button style={{ color: 'var(--text-secondary)' }}>
            {showTranscript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showTranscript && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {renderTranscriptWithHighlights(meeting.transcript)}
            </pre>
          </div>
        )}
      </div>

      {/* Inline Add Action Item Modal */}
      {newActionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Add Action Item</h3>
            <form onSubmit={handleCreateActionItem}>
              <div className="form-group">
                <label>Task Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Prepare API specification draft"
                  value={newActionTask}
                  onChange={(e) => setNewActionTask(e.target.value)}
                  required
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Owner</label>
                  <input
                    type="text"
                    placeholder="Unassigned"
                    value={newActionOwner}
                    onChange={(e) => setNewActionOwner(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newActionDueDate}
                    onChange={(e) => setNewActionDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newActionPriority}
                  onChange={(e) => setNewActionPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Supporting Evidence / Transcript Quote</label>
                <input
                  type="text"
                  placeholder="Optional quote from transcript"
                  value={newActionEvidence}
                  onChange={(e) => setNewActionEvidence(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewActionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionSaving}>
                  {actionSaving ? 'Saving...' : 'Create Action Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetails;
