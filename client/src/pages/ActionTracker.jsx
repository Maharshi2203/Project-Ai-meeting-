import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { actionService } from '../services/actionService';
import ConfirmModal from '../components/common/ConfirmModal';
import { CheckSquare, Search, Filter, Trash2, Edit3, Loader2, AlertCircle } from 'lucide-react';

const ActionTracker = () => {
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Edit Modal State
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
      console.error('Failed to save action item edit:', err);
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
      console.error('Failed to delete action item:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Get list of unique owners for filter dropdown
  const uniqueOwners = Array.from(new Set(actionItems.map(item => item.owner).filter(Boolean)));

  return (
    <div>
      {/* Title & Overview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Action Tracker</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Cross-meeting action items tracking, owners, due dates & status resolution</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search task or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="All">All Owners</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          {/* Overdue Checkbox Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              color: overdueOnly ? 'var(--danger)' : 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--danger)' }}
              />
              <span>Overdue Tasks Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Items List Table */}
      {loading ? (
        <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : actionItems.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>No action items found</h3>
          <p>No action items match the active search and filter criteria.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Task</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Meeting</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Owner</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Due Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item) => {
                  const isOverdue = item.isOverdue || (item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Completed');

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isOverdue ? 'var(--danger-bg)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {/* Task */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '500', color: 'var(--text-primary)', maxWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{item.task}</span>
                          {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
                        </div>
                      </td>

                      {/* Meeting */}
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {item.meeting ? (
                          <Link to={`/meetings/${item.meeting.id}`} style={{ fontWeight: '500' }}>
                            {item.meeting.title}
                          </Link>
                        ) : '—'}
                      </td>

                      {/* Owner */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {item.owner || 'Unassigned'}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '1rem 1.25rem', color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isOverdue ? '700' : '400' }}>
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not specified'}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.775rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: item.priority === 'High' ? 'var(--danger-bg)' : item.priority === 'Medium' ? 'var(--warning-bg)' : 'var(--bg-tertiary)',
                          color: item.priority === 'High' ? 'var(--danger)' : item.priority === 'Medium' ? 'var(--warning)' : 'var(--text-secondary)'
                        }}>
                          {item.priority}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', fontWeight: '600' }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(item)}
                            title="Edit action item"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteId(item.id)}
                            title="Delete action item"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Action Item Modal */}
      {editItem && (
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Action Item</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Task Description *</label>
                <input
                  type="text"
                  value={editTask}
                  onChange={(e) => setEditTask(e.target.value)}
                  required
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Owner</label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Action Item"
        message="Are you sure you want to delete this action item?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
      />
    </div>
  );
};

export default ActionTracker;
