import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import RichTextEditor from '../components/common/RichTextEditor';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

const MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other'
];

const EditMeeting = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingType, setMeetingType] = useState('Project Meeting');
  const [participants, setParticipants] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const res = await meetingService.getMeetingById(id);
      const m = res.data.meeting;
      setTitle(m.title);
      setMeetingDate(m.meetingDate ? new Date(m.meetingDate).toISOString().split('T')[0] : '');
      setMeetingType(m.meetingType);
      setParticipants(m.participants || '');
      setTranscript(m.transcript || '');
      setSummary(m.summary || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meeting details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    try {
      setSaving(true);
      await meetingService.updateMeeting(id, {
        title,
        meetingDate,
        meetingType,
        participants,
        transcript,
        summary
      });
      navigate(`/meetings/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update meeting.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to={`/meetings/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} />
          <span>Back to Meeting Details</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Edit Meeting</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Update meeting details, notes, or transcript text.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Meeting Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid-cols-2" style={{ gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="meetingDate">Meeting Date *</label>
              <input
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingType">Meeting Type</label>
              <select
                id="meetingType"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
              >
                {MEETING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="participants">Participants</label>
            <input
              id="participants"
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="summary">Executive Summary</label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary generated by AI or edited manually..."
            />
          </div>

          <div className="form-group">
            <label>Meeting Transcript</label>
            <RichTextEditor
              value={transcript}
              onChange={setTranscript}
              placeholder="Meeting transcript..."
              minHeight="220px"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <Link to={`/meetings/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '0.5rem' }}>
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeeting;
