import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, Trash2, Shield, User, Search, Users, TrendingUp, Hourglass, Sparkles, Filter, ArrowUpDown, MoreVertical, Calendar, Bell, Clock, MessageSquare, Download, ChevronDown } from 'lucide-react';

function RoleBadge({ role }) {
  const isAdmin = role === 'Admin';
  return (
    <span className="status-badge" style={{
      background: isAdmin ? 'var(--blue-light)' : 'var(--gray-100)',
      color: isAdmin ? 'var(--blue)' : 'var(--gray-600)',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      {isAdmin ? <Shield size={10} /> : <User size={10} />}
      {role}
    </span>
  );
}

export default function MembersPage() {
  const { users, currentUser, isAdmin, updateUserRole, removeUser, inviteUser, projects } = useApp();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Member' });
  const [inviteError, setInviteError] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [openRoleMenu, setOpenRoleMenu] = useState(null);

  const filtered = users
    .filter(u => {
      const matchesSearch = !search || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? true : false); // All are active for now
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'role') return a.role.localeCompare(b.role);
      return 0;
    });

  async function handleInvite(e) {
    e.preventDefault();
    const result = await inviteUser(inviteForm);
    if (result.error) { setInviteError(result.error); return; }
    setShowInvite(false);
    setInviteForm({ name: '', email: '', role: 'Member' });
    setInviteError('');
  }

  async function handleRoleToggle(user) {
    if (user.id === currentUser?.id) return;
    const newRole = user.role === 'Admin' ? 'Member' : 'Admin';
    setRoleConfirm({ ...user, newRole });
  }

  async function confirmRoleChange() {
    if (!roleConfirm) return;
    await updateUserRole(roleConfirm.id, roleConfirm.newRole);
    setRoleConfirm(null);
  }

  async function handleRemove(user) {
    await removeUser(user.id);
    setRemoveConfirm(null);
  }

  const adminCount = users.filter(u => u.role === 'Admin').length;

  return (
    <div className="content-area">
      <div className="top-bar page-top-bar">
        <div className="search-container">
          <Search size={14} color="var(--gray-400)" />
          <input type="text" className="search-input" placeholder="Search team…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="top-actions">
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowInvite(true)}>
              <UserPlus size={13} /> Invite Team Member
            </button>
          )}
          <div className="avatar" style={{ width: '32px', height: '32px' }}>
            {currentUser?.name?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>Team Management</h1>
          <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>Manage your organization's members, roles, and permissions.</p>
        </div>
        <div className="header-avatars" style={{ display: 'flex', alignItems: 'center' }}>
          {users.slice(0, 3).map((u, i) => (
            <div key={u.id} className="avatar" style={{ 
              width: '32px', height: '32px', border: '2px solid #fff', 
              marginLeft: i === 0 ? 0 : '-8px', zIndex: 3 - i,
              fontSize: '11px'
            }}>
              {u.avatar || u.name.slice(0, 2).toUpperCase()}
            </div>
          ))}
          {users.length > 3 && (
            <div className="avatar" style={{ 
              width: '32px', height: '32px', border: '2px solid #fff', 
              marginLeft: '-8px', fontSize: '10px', background: '#f1f5f9', color: '#64748b' 
            }}>
              +{users.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="team-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div className="icon-box blue" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
              <TrendingUp size={14} /> +2 this month
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gray-900)' }}>{users.length}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>Total Members</div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div className="icon-box green" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div style={{ color: 'var(--gray-400)', fontSize: '12px', fontWeight: '500' }}>High Security</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gray-900)' }}>{adminCount}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>Active Admins</div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div className="icon-box orange" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hourglass size={20} />
            </div>
            <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>Action Required</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--gray-900)' }}>0</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>Pending Invites</div>
        </div>
      </div>

      {showInvite && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)' }}>Invite New Member</div>
            {inviteError && (
              <div style={{ background: '#fff8f8', border: '1px solid #ffd0cc', color: 'var(--red)', padding: '10px 12px', borderRadius: '3px', fontSize: '13px' }}>
                {inviteError}
              </div>
            )}
            <div className="invite-form-grid" style={{ display: 'grid', gap: '12px' }}>
              <div className="search-container" style={{ width: '100%' }}>
                <input className="search-input" placeholder="Full name" value={inviteForm.name}
                  onChange={e => { setInviteForm({ ...inviteForm, name: e.target.value }); setInviteError(''); }} required />
              </div>
              <div className="search-container" style={{ width: '100%' }}>
                <input className="search-input" type="email" placeholder="Email address" value={inviteForm.email}
                  onChange={e => { setInviteForm({ ...inviteForm, email: e.target.value }); setInviteError(''); }} required />
              </div>
              <div className="search-container" style={{ width: '100%' }}>
                <select className="search-input" value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => { setShowInvite(false); setInviteError(''); }}>Cancel</button>
              <button type="submit" className="btn-primary">Add Member</button>
            </div>
          </form>
        </div>
      )}

      {removeConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '90%', padding: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>Remove member?</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              <strong>{removeConfirm.name}</strong> will be removed from the workspace. They will lose access immediately.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setRemoveConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--red)' }}
                onClick={() => handleRemove(removeConfirm)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {roleConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '90%', padding: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>Change user role?</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              Are you sure you want to make <strong>{roleConfirm.name}</strong> a <strong>{roleConfirm.newRole}</strong>?
              {roleConfirm.newRole === 'Admin' ? ' This will give them full access to the workspace settings.' : ' They will lose administrative privileges.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setRoleConfirm(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmRoleChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, marginBottom: '32px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>Member Directory</h2>
          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <button className="btn-secondary" 
                onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: roleFilter !== 'All' ? 'var(--blue-light)' : 'white', borderColor: roleFilter !== 'All' ? 'var(--blue)' : 'var(--gray-200)' }}>
                <Filter size={14} /> Filter {roleFilter !== 'All' && `(${roleFilter})`}
              </button>
              {showFilter && (
                <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100, width: '200px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gray-400)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Filter by Role</div>
                  {['All', 'Admin', 'Member'].map(role => (
                    <div key={role} 
                      onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                      style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', background: roleFilter === role ? 'var(--gray-50)' : 'transparent', color: roleFilter === role ? 'var(--blue)' : 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
                      {role === 'All' ? 'All Roles' : role}
                      {roleFilter === role && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)', marginTop: '6px' }} />}
                    </div>
                  ))}
                  <div style={{ height: '1px', background: 'var(--gray-100)', margin: '12px 0' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gray-400)', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Filter by Status</div>
                  {['All', 'Active', 'Pending'].map(status => (
                    <div key={status} 
                      onClick={() => { setStatusFilter(status); setShowFilter(false); }}
                      style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', background: statusFilter === status ? 'var(--gray-50)' : 'transparent', color: statusFilter === status ? 'var(--blue)' : 'var(--gray-700)', display: 'flex', justifyContent: 'space-between' }}>
                      {status}
                      {statusFilter === status && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)', marginTop: '6px' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button className="btn-secondary" 
                onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={14} /> Sort
              </button>
              {showSort && (
                <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100, width: '160px', padding: '8px' }}>
                  {[
                    { label: 'Name (A-Z)', val: 'name-asc' },
                    { label: 'Name (Z-A)', val: 'name-desc' },
                    { label: 'By Role', val: 'role' }
                  ].map(s => (
                    <div key={s.val} 
                      onClick={() => { setSortOrder(s.val); setShowSort(false); }}
                      style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', background: sortOrder === s.val ? 'var(--gray-50)' : 'transparent', color: sortOrder === s.val ? 'var(--blue)' : 'var(--gray-700)' }}>
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="members-grid members-header" style={{ padding: '12px 24px', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          {['Name', 'Email Address', 'Involved Projects', 'Role', 'Status', 'Actions'].map((h, i) => (
            <div key={i} style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)' }}>{h}</div>
          ))}
        </div>

        {filtered.map((user, i) => {
          const isSelf = user.id === currentUser?.id;
          const isLastAdmin = user.role === 'Admin' && adminCount === 1;
          return (
            <div key={user.id}
              className="members-grid"
              style={{
                padding: '12px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none',
                background: isSelf ? 'var(--gray-50)' : 'white',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                  {user.avatar || user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {user.name}
                    {isSelf && <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '500', background: 'var(--blue-light)', padding: '1px 6px', borderRadius: '10px' }}>you</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>Joined Jan 2024</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{user.email}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {projects?.filter(p => p.memberIds?.some(mid => Number(mid) === Number(user.id)) || Number(p.leadId) === Number(user.id)).slice(0, 3).map(p => (
                  <span key={p.id} style={{ 
                    fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: p.color ? `${p.color}15` : '#f1f5f9', color: p.color || '#64748b', border: `1px solid ${p.color ? `${p.color}30` : '#e2e8f0'}`, fontWeight: '600', whiteSpace: 'nowrap'
                  }}>
                    {p.name}
                  </span>
                ))}
                {projects?.filter(p => p.memberIds?.some(mid => Number(mid) === Number(user.id)) || Number(p.leadId) === Number(user.id)).length > 3 && (
                  <span style={{ fontSize: '10px', color: 'var(--gray-400)', alignSelf: 'center' }}>
                    +{projects.filter(p => p.memberIds?.some(mid => Number(mid) === Number(user.id)) || Number(p.leadId) === Number(user.id)).length - 3} more
                  </span>
                )}
                {projects?.filter(p => p.memberIds?.some(mid => Number(mid) === Number(user.id)) || Number(p.leadId) === Number(user.id)).length === 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--gray-300)', fontStyle: 'italic' }}>None</span>
                )}
              </div>
              <div>
                <RoleBadge role={user.role} />
              </div>
              <div>
                <span className="status-badge" style={{ background: '#ecfdf5', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Active
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', position: 'relative' }}>
                {isAdmin && !isSelf ? (
                  <div style={{ position: 'relative' }}>
                    <button
                      style={{
                        fontSize: '11px', borderRadius: '4px', cursor: isLastAdmin ? 'not-allowed' : 'pointer',
                        background: 'white', border: '1px solid var(--gray-200)', color: isLastAdmin ? 'var(--gray-300)' : 'var(--gray-600)',
                        fontFamily: 'var(--font)', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        width: '95px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxSizing: 'border-box', padding: '0 10px'
                      }}
                      disabled={isLastAdmin}
                      onClick={() => setOpenRoleMenu(openRoleMenu === user.id ? null : user.id)}>
                      {user.role} <ChevronDown size={10} style={{ opacity: 0.5 }} />
                    </button>
                    {openRoleMenu === user.id && (
                      <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 200, width: '120px', padding: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        {['Admin', 'Member'].map(role => (
                          <div key={role} 
                            onClick={() => { 
                              if (role !== user.role) handleRoleToggle(user); 
                              setOpenRoleMenu(null); 
                            }}
                            style={{ 
                              padding: '8px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', 
                              background: user.role === role ? 'var(--gray-50)' : 'transparent', 
                              color: user.role === role ? 'var(--blue)' : 'var(--gray-700)',
                              fontWeight: user.role === role ? '600' : '400'
                            }}>
                            {role}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ width: '95px', height: '32px' }} />
                )}
                {isAdmin && !isSelf && (
                  <button 
                    className="btn-icon" 
                    style={{ color: 'var(--gray-400)', transition: 'color 0.2s' }} 
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
                    onClick={() => setRemoveConfirm(user)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Showing 1 to {filtered.length} of {users.length} members</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ padding: '6px' }} disabled><ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} /></button>
              <button className="btn-secondary" style={{ padding: '6px' }} disabled><ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Permission Info Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '32px' }}>
        {[
          { label: 'ADMIN PERMISSIONS', desc: 'Full access to settings, billing, team management, and all project data.', color: 'blue' },
          { label: 'MEMBER PERMISSIONS', desc: 'Can create projects and tasks, but cannot manage team or billing settings.', color: 'gray' },
          { label: 'GUEST PERMISSIONS', desc: 'Read-only access to assigned projects. Ideal for clients and vendors.', color: 'gray' }
        ].map((p, i) => (
          <div key={i} className="card" style={{ padding: '24px', background: 'white', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: p.color === 'blue' ? 'var(--blue)' : 'var(--gray-400)', letterSpacing: '0.8px', marginBottom: '12px' }}>{p.label}</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: '1.6' }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .members-grid {
          display: grid;
          grid-template-columns: 220px 200px 1fr 100px 100px 140px;
          gap: 16px;
          padding: 12px 24px;
        }

        .invite-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 140px;
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .team-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .members-grid {
            grid-template-columns: 180px 1fr 100px 80px;
          }
          .members-grid > div:nth-child(4) {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .team-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .members-grid {
            grid-template-columns: 1fr 100px 40px;
          }
          .members-grid > div:nth-child(2), .members-grid > div:nth-child(4) {
            display: none;
          }
          .members-header {
             display: none !important;
          }
          .invite-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
