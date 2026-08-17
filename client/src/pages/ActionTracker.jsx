import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { actionService } from '../services/actionService';
import ConfirmModal from '../components/common/ConfirmModal';
import { CheckSquare, Search, Filter, Trash2, Edit3, Loader2, PlusCircle, Link2, Calendar } from 'lucide-react';

const AVATAR_COLORS = ['avatar-indigo', 'avatar-teal', 'avatar-orange', 'avatar-violet'];

const getAvatarColor = (name) => {
  if (!name) return 'avatar-indigo';
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'UA';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return { label: 'Today', overdue: false };
  if (d.toDateString() === tomorrow.toDateString()) return { label: 'Tomorrow', overdue: false };
  const isOverdue = d < today;
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: isOverdue
  };
};

const ActionTracker = () => {
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Edit Modal
  const [editItem, setEditItem] = useState(null);
  const [editTask, setEditTask] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Open');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchActionItems();
  }, [search, statusFilter, priorityFilter, ownerFilter, overdueOnly]);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      const res = await actionService.getActionItems({
        search: search.trim() || undefined,
        status: statusFilter,
        priority: priorityFilter,
        owner: ownerFilter,
        overdue: overdueOnly ? 'true' : undefined
      });
      setActionItems(res.data.actionItems);
    } catch (err) {
      console.error('Failed to fetch action items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await actionService.updateActionItem(id, { status: newStatus });
      fetchActionItems();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditTask(item.task);
    setEditOwner(item.owner || 'Unassigned');
    setEditDueDate(item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '');
    setEditPriority(item.priority || 'Medium');
    setEditStatus(item.status || 'Open');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSavingEdit(true);
      await actionService.updateActionItem(editItem.id, {
        task: editTask,
        owner: editOwner,
        dueDate: editDueDate || null,
        priority: editPriority,
        status: editStatus
      });
      setEditItem(null);
      fetchActionItems();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await actionService.deleteActionItem(deleteId);
      setActionItems(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  };

  const overdueCount = actionItems.filter(i => i.isOverdue || (i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'Completed')).length;
  const activeCount = actionItems.filter(i => i.status !== 'Completed').length;
  const uniqueOwners = Array.from(new Set(actionItems.map(item => item.owner).filter(Boolean)));

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Action Tracker</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Track, manage, and execute tasks extracted from meeting intelligence.
          </p>
        </div>

        {/* Stat chips + Quick Add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {overdueCount > 0 && (
            <div className="stat-chip stat-chip-danger">
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--danger)', display: 'inline-block' }} />
              <span>OVERDUE: <strong>{overdueCount}</strong></span>
            </div>
          )}
          <div className="stat-chip stat-chip-success">
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
            <span>ACTIVE: <strong>{activeCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Filter size={14} />
            <span>FILTERS</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="All">Status: All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="All">Priority: All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="All">Owner: All</option>
            {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Overdue toggle */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: overdueOnly ? 'var(--danger)' : 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', border: `1px solid ${overdueOnly ? 'rgba(248,113,113,0.4)' : 'var(--border-color)'}`, backgroundColor: overdueOnly ? 'var(--danger-bg)' : 'var(--bg-tertiary)', transition: 'all 0.2s ease' }}>
            <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--danger)' }} />
            Overdue Only
          </label>

          {/* Search */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.1rem', width: '200px', height: '36px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : actionItems.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>No action items found</h3>
          <p>No action items match the active filters. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem', width: '40%' }}>Task</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Linked Meeting</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item) => {
                  const isOverdue = item.isOverdue || (item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Completed');
                  const due = item.dueDate ? formatDueDate(item.dueDate) : null;
                  const avatarClass = getAvatarColor(item.owner);

                  return (
                    <tr key={item.id} style={{ backgroundColor: isOverdue ? 'rgba(248,113,113,0.04)' : 'transparent' }}>
                      {/* Task */}
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-color)', marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.4 }}>
                              {item.task}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Priority: <span style={{ color: item.priority === 'High' ? 'var(--danger)' : item.priority === 'Medium' ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>{item.priority}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          style={{
                            padding: '0.3rem 0.55rem',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            width: 'auto',
                            borderRadius: 'var(--radius-full)',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            border: '1px solid',
                            ...(item.status === 'Open' ? { backgroundColor: 'rgba(56,189,248,0.1)', color: 'var(--info)', borderColor: 'rgba(56,189,248,0.25)' }
                              : item.status === 'In Progress' ? { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.25)' }
                              : item.status === 'Blocked' ? { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.25)' }
                              : { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(16,217,160,0.25)' })
                          }}
                        >
                          <option value="Open">● OPEN</option>
                          <option value="In Progress">● IN PROGRESS</option>
                          <option value="Blocked">● BLOCKED</option>
                          <option value="Completed">● COMPLETED</option>
                        </select>
                      </td>

                      {/* Owner */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={`avatar ${avatarClass}`} style={{ width: 28, height: 28, fontSize: '0.72rem' }}>
                            {getInitials(item.owner)}
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{item.owner || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Linked Meeting */}
                      <td>
                        {item.meeting ? (
                          <Link
                            to={`/meetings/${item.meeting.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}
                          >
                            <Link2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.meeting.title}
                            </span>
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Manual Entry</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td>
                        {due ? (
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: due.overdue ? 'var(--danger)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {due.overdue && <Calendar size={13} />}
                            {due.label}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditModal(item)}
                            title="Edit"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteId(item.id)}
                            title="Delete"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing 1–{actionItems.length} of {actionItems.length} items
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem 0.6rem' }}>‹</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0.3rem 0.6rem' }}>›</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Edit Action Item</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Task Description *</label>
                <input type="text" value={editTask} onChange={e => setEditTask(e.target.value)} required />
              </div>
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Owner</label>
                  <input type="text" value={editOwner} onChange={e => setEditOwner(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                </div>
              </div>
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Action Item"
        message="Are you sure you want to delete this action item? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
      />
    </div>
  );
};

export default ActionTracker;
