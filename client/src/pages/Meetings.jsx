import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import ConfirmModal from '../components/common/ConfirmModal';
import { FileText, Search, PlusCircle, Calendar, Users, Trash2, Edit3, ArrowRight, Loader2, Filter } from 'lucide-react';

const VALID_MEETING_TYPES = [
  'All',
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other'
];

const MEETINGS_PER_PAGE = 8;

const Meetings = () => {
  const location = useLocation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });
  const [selectedType, setSelectedType] = useState('All');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('search');
    if (s !== null) {
      setSearch(s);
    }
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
    fetchMeetings();
  }, [search, selectedType]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await meetingService.getMeetings({
        search: search.trim() || undefined,
        type: selectedType !== 'All' ? selectedType : undefined
      });
      setMeetings(res.data.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await meetingService.deleteMeeting(deleteId);
      setMeetings((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      setDeleteError('Failed to delete meeting. Please try again.');
      console.error('Failed to delete meeting:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>View, search, and process your team's meeting transcripts</p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Create Meeting</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search meetings by title, transcript, or participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Type Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: '100%' }}
            >
              {VALID_MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Meeting Types' : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List Grid */}
      {loading ? (
        <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No meetings found</h3>
          <p>{search || selectedType !== 'All' ? 'No meetings match your current search and filter criteria.' : 'You haven’t created any meetings yet.'}</p>
          {!search && selectedType === 'All' && (
            <Link to="/meetings/new" className="btn btn-primary">
              Create Your First Meeting
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid-cols-2">
            {meetings.slice((currentPage - 1) * MEETINGS_PER_PAGE, currentPage * MEETINGS_PER_PAGE).map((meeting) => (
              <div key={meeting.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Type & Action Count */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--accent-glow)'
                    }}>
                      {meeting.meetingType}
                    </span>
                    <span className="badge badge-open" style={{ fontSize: '0.775rem' }}>
                      {meeting._count?.actionItems || 0} Action Items
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem', lineHeight: '1.3' }}>
                    <Link to={`/meetings/${meeting.id}`} style={{ color: 'var(--text-primary)' }}>
                      {meeting.title}
                    </Link>
                  </h3>

                  {/* Meta details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{new Date(meeting.meetingDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    {meeting.participants && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={15} style={{ color: 'var(--text-muted)' }} />
                        <span>{meeting.participants}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/meetings/${meeting.id}/edit`} className="btn btn-secondary btn-sm" title="Edit Meeting">
                      <Edit3 size={15} />
                    </Link>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDeleteId(meeting.id)}
                      title="Delete Meeting"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <Link to={`/meetings/${meeting.id}`} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination footer */}
          {meetings.length > MEETINGS_PER_PAGE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * MEETINGS_PER_PAGE + 1}–{Math.min(currentPage * MEETINGS_PER_PAGE, meetings.length)} of {meetings.length} meetings
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem 0.7rem', opacity: currentPage === 1 ? 0.35 : 1 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.4rem' }}>{currentPage} / {Math.ceil(meetings.length / MEETINGS_PER_PAGE)}</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem 0.7rem', opacity: currentPage === Math.ceil(meetings.length / MEETINGS_PER_PAGE) ? 0.35 : 1 }} onClick={() => setCurrentPage(p => Math.min(Math.ceil(meetings.length / MEETINGS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(meetings.length / MEETINGS_PER_PAGE)}>›</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? All associated extracted action items will also be permanently removed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Deleting...' : 'Delete Meeting'}
      />

      {/* Delete error toast */}
      {deleteError && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', backgroundColor: 'var(--danger)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 9998, fontSize: '0.875rem', fontWeight: 600 }}>
          {deleteError}
          <button onClick={() => setDeleteError('')} style={{ marginLeft: '1rem', color: '#fff', fontWeight: 700 }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default Meetings;
