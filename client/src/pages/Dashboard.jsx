import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { actionService } from '../services/actionService';
import { FileText, CheckSquare, Clock, AlertTriangle, CheckCircle, ArrowRight, Loader2, Calendar } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await actionService.getDashboardStats();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--danger)' }}>
        <AlertTriangle size={36} style={{ color: 'var(--danger)', marginBottom: '0.75rem' }} />
        <h3>Unable to load dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardStats}>
          Retry
        </button>
      </div>
    );
  }

  const { metrics, recentMeetings, recentActions } = data;

  const statCards = [
    { title: 'Total Meetings', value: metrics.totalMeetings, icon: FileText, color: 'var(--accent-primary)', bg: 'var(--accent-light)', link: '/meetings' },
    { title: 'Total Actions', value: metrics.totalActionItems, icon: CheckSquare, color: 'var(--info)', bg: 'var(--info-bg)', link: '/actions' },
    { title: 'Open Tasks', value: metrics.openActionItems, icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)', link: '/actions?status=Open' },
    { title: 'Completed', value: metrics.completedActionItems, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)', link: '/actions?status=Completed' },
    { title: 'Overdue Tasks', value: metrics.overdueActionItems, icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-bg)', link: '/actions?overdue=true', isAlert: metrics.overdueActionItems > 0 }
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Executive Dashboard</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Overview of meeting intelligence & task resolution status</p>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid-cols-5" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.link}>
              <div className="card" style={{
                position: 'relative',
                overflow: 'hidden',
                borderColor: card.isAlert ? 'var(--danger)' : 'var(--border-color)',
                backgroundColor: card.isAlert ? 'var(--danger-bg)' : 'var(--bg-card)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{card.title}</span>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: card.bg, color: card.color }}>
                    <Icon size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: card.isAlert ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {card.value}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Action Health Banner Card */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
              Accountability & Health
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Action Health Breakdown</h3>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: metrics.healthPercentage >= 75 ? 'var(--success-bg)' : metrics.healthPercentage >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
            color: metrics.healthPercentage >= 75 ? 'var(--success)' : metrics.healthPercentage >= 50 ? 'var(--warning)' : 'var(--danger)',
            fontWeight: '700',
            fontSize: '0.9rem',
            border: `1px solid ${metrics.healthPercentage >= 75 ? 'var(--success)' : metrics.healthPercentage >= 50 ? 'var(--warning)' : 'var(--danger)'}`
          }}>
            <CheckCircle size={16} />
            <span>{metrics.healthPercentage}% On Track</span>
          </div>
        </div>

        {/* Multi-segment Health Bar */}
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '1.25rem'
        }}>
          {metrics.totalActionItems > 0 ? (
            <>
              <div style={{ width: `${(metrics.completedActionItems / metrics.totalActionItems) * 100}%`, backgroundColor: 'var(--success)', transition: 'width 0.5s ease' }} title="Completed" />
              <div style={{ width: `${((metrics.onTrackCount || 0) / metrics.totalActionItems) * 100}%`, backgroundColor: 'var(--info)', transition: 'width 0.5s ease' }} title="On Track" />
              <div style={{ width: `${((metrics.dueSoonActionItems || 0) / metrics.totalActionItems) * 100}%`, backgroundColor: 'var(--warning)', transition: 'width 0.5s ease' }} title="Due Soon" />
              <div style={{ width: `${((metrics.overdueActionItems || 0) / metrics.totalActionItems) * 100}%`, backgroundColor: 'var(--danger)', transition: 'width 0.5s ease' }} title="Overdue" />
            </>
          ) : (
            <div style={{ width: '100%', backgroundColor: 'var(--success)', opacity: 0.5 }} />
          )}
        </div>

        {/* Health Stat Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--info)' }} />
            <strong>{metrics.openActionItems || 0}</strong> Open
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <strong>{metrics.onTrackCount || 0}</strong> On Track
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
            <strong>{metrics.dueSoonActionItems || 0}</strong> Due Soon
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
            <strong style={{ color: metrics.overdueActionItems > 0 ? 'var(--danger)' : 'inherit' }}>{metrics.overdueActionItems || 0}</strong> Overdue
          </span>
        </div>
      </div>

      {/* Main Content Grid: Recent Meetings + Recent Action Items */}
      <div className="grid-cols-2">
        {/* Recent Meetings Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Meetings</h3>
            <Link to="/meetings" style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentMeetings.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <FileText size={32} />
              <h3>No meetings recorded</h3>
              <p>Create your first meeting to convert transcripts into action items.</p>
              <Link to="/meetings/new" className="btn btn-primary btn-sm">
                Create Meeting
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentMeetings.map((meeting) => (
                <Link key={meeting.id} to={`/meetings/${meeting.id}`}>
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{meeting.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={13} />
                          {new Date(meeting.meetingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {meeting.meetingType}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-open" style={{ fontSize: '0.75rem' }}>
                        {meeting._count?.actionItems || 0} Action Items
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Items Overview */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Upcoming Action Items</h3>
            <Link to="/actions" style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Action Tracker</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentActions.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <CheckSquare size={32} />
              <h3>No pending action items</h3>
              <p>All action items are clear or completed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {recentActions.map((item) => {
                const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() && item.status !== 'Completed' : false;
                const linkTarget = item.meetingId ? `/meetings/${item.meetingId}` : '/actions';

                return (
                  <Link key={item.id} to={linkTarget} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isOverdue ? 'var(--danger-bg)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isOverdue ? 'var(--danger)' : 'var(--border-color)';
                      e.currentTarget.style.transform = 'none';
                    }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.task}</span>
                          {isOverdue && <span className="badge badge-overdue">OVERDUE</span>}
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          Owner: <strong style={{ color: 'var(--text-secondary)' }}>{item.owner}</strong> • Meeting: {item.meeting?.title}
                        </div>
                      </div>

                      <div>
                        <span className={`badge badge-${item.status.toLowerCase().replace(' ', '-')}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
