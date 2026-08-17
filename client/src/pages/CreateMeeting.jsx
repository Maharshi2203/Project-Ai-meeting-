import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import RichTextEditor from '../components/common/RichTextEditor';
import { ArrowLeft, Save, Upload, FileText, AlertCircle, File, Loader2 } from 'lucide-react';

const MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other'
];

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CreateMeeting = () => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(getTodayLocalDate());
  const [meetingType, setMeetingType] = useState('Project Meeting');
  const [participants, setParticipants] = useState('');
  const [transcript, setTranscript] = useState('');
  const [file, setFile] = useState(null);
  const [inputMethod, setInputMethod] = useState('text'); // 'text' or 'file'

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();
    const isTxt = name.endsWith('.txt');
    const isPdf = name.endsWith('.pdf');

    if (!isTxt && !isPdf) {
      setError('Unsupported file type. Please upload a plain text (.txt) or PDF (.pdf) transcript.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('The uploaded file is too large (Maximum size: 5MB).');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }
    if (!meetingDate) {
      setError('Meeting date is required.');
      return;
    }

    if (inputMethod === 'text' && !transcript.trim()) {
      setError('Meeting transcript is required. Please paste or enter the transcript text.');
      return;
    }

    if (inputMethod === 'file' && !file) {
      setError('Please select a valid .txt or .pdf transcript file to upload.');
      return;
    }

    try {
      setLoading(true);

      if (inputMethod === 'file') {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('meetingDate', meetingDate);
        formData.append('meetingType', meetingType);
        formData.append('participants', participants);
        formData.append('file', file);

        const res = await meetingService.createMeeting(formData);
        navigate(`/meetings/${res.data.meeting.id}`);
      } else {
        const res = await meetingService.createMeeting({
          title,
          meetingDate,
          meetingType,
          participants,
          transcript
        });
        navigate(`/meetings/${res.data.meeting.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {/* Upload/Save Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 15, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'inline-block' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Creating Meeting...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {inputMethod === 'file' ? 'Extracting document text and saving meeting details...' : 'Saving meeting record and transcript...'}
            </p>
          </div>
        </div>
      )}
      {/* Header Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/meetings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} />
          <span>Back to Meetings</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create New Meeting</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Store post-meeting information and prepare your transcript for AI processing.
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
          {/* Meeting Title */}
          <div className="form-group">
            <label htmlFor="title">Meeting Title *</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Q3 Roadmap Review & Architecture Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Date & Type Row */}
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

          {/* Participants */}
          <div className="form-group">
            <label htmlFor="participants">Participants</label>
            <input
              id="participants"
              type="text"
              placeholder="e.g. Alex (Product Lead), Sarah (Eng Lead), David (Client)"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>

          {/* Transcript Input Selector */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem' }}>Transcript Input Method *</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${inputMethod === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputMethod('text')}
                style={{ flex: 1, gap: '0.5rem' }}
              >
                <FileText size={18} />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                className={`btn ${inputMethod === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInputMethod('file')}
                style={{ flex: 1, gap: '0.5rem' }}
              >
                <Upload size={18} />
                <span>Upload .txt / .pdf File</span>
              </button>
            </div>

            {inputMethod === 'text' ? (
              <div>
                <RichTextEditor
                  value={transcript}
                  onChange={setTranscript}
                  placeholder="Paste or write the full meeting transcript here..."
                  minHeight="240px"
                />
              </div>
            ) : (
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <Upload size={36} style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Upload Transcript File</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Supports plain text (.txt) and PDF (.pdf) documents up to 5MB
                </p>
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="transcript-upload-input"
                />
                <label htmlFor="transcript-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  Choose .txt / .pdf File
                </label>
                {file && (
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <File size={16} />
                    <span>Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/meetings" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: '0.5rem' }}>
              <Save size={18} />
              <span>{loading ? 'Saving Meeting...' : 'Save & Continue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeeting;
