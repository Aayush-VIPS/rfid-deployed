// rfid-attendance-system/apps/frontend/src/pages/PCoordinatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './pCoordinatorDashboard.css'; // Import dedicated CSS

// Main PCoordinatorDashboard component - This is the high-level navigation hub
function PCoordinatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [setupStatus, setSetupStatus] = useState({
    hasData: false,
    departments: 0,
    courses: 0,
    subjects: 0,
    faculty: 0,
    sections: 0,
    loading: true
  });

  // Check if system has been set up
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await api.get('/api/setup/status');
      setSetupStatus({ ...response.data, loading: false });
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const SetupPrompt = () => (
    <div className="setup-prompt">
      <div className="setup-prompt-content">
        <div className="setup-icon">🚀</div>
        <h2>Welcome! Let's set up your academic system</h2>
        <p>It looks like this is your first time. Let's quickly set up your departments, courses, and subjects.</p>
        <div className="setup-options">
          <button 
            onClick={() => navigate('/quick-setup')}
            className="setup-button primary"
          >
            🎯 Quick Setup (5 minutes)
          </button>
          <button 
            onClick={() => navigate('/pc/courses-subjects')}
            className="setup-button secondary"
          >
            📝 Manual Setup
          </button>
        </div>
        <p className="setup-note">
          <strong>Recommended:</strong> Use Quick Setup to get started fast, then customize later.
        </p>
      </div>
    </div>
  );

  const SystemOverview = () => (
    <div className="system-overview">
      <h2>System Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{setupStatus.departments}</div>
          <div className="stat-label">Departments</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{setupStatus.courses}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{setupStatus.subjects}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{setupStatus.faculty}</div>
          <div className="stat-label">Faculty</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{setupStatus.sections}</div>
          <div className="stat-label">Sections</div>
        </div>
      </div>
    </div>
  );

  if (setupStatus.loading) {
    return (
      <div className="pcoord-dashboard-page-container">
        <PageHeader dashboardTitle="PROGRAM COORDINATOR DASHBOARD" />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pcoord-dashboard-page-container">
      <PageHeader dashboardTitle="PROGRAM COORDINATOR DASHBOARD" />

      <div className="pcoord-dashboard-main-content">
        <div className="dashboard-header-row">
          <h1 className="dashboard-title">Program Coordinator Dashboard</h1>
          <div className="user-info-logout-group">
            <span className="text-gray-700">Logged in as: <span className="font-semibold">{user?.email} ({user?.role})</span></span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>

        {/* Show setup prompt if no data exists */}
        {!setupStatus.hasData ? (
          <SetupPrompt />
        ) : (
          <>
            <SystemOverview />
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <button 
                  onClick={() => navigate('/quick-setup')}
                  className="quick-action-card"
                >
                  <span className="action-icon">⚡</span>
                  <span className="action-title">Quick Setup</span>
                  <span className="action-description">Add new course/semester</span>
                </button>
                <button 
                  onClick={() => navigate('/pc/timetable-schedules')}
                  className="quick-action-card"
                >
                  <span className="action-icon">📅</span>
                  <span className="action-title">Create Timetable</span>
                  <span className="action-description">Schedule classes</span>
                </button>
                <button 
                  onClick={() => navigate('/pc/attendance-reports')}
                  className="quick-action-card"
                >
                  <span className="action-icon">📊</span>
                  <span className="action-title">View Reports</span>
                  <span className="action-description">Attendance analytics</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main Navigation Cards/Buttons */}
        <div className="main-nav-cards-grid">
            <button className="main-nav-card" onClick={() => navigate('/pc/faculty-students')}>
                <h2 className="card-title">👥 Faculty & Students</h2>
                <p className="card-description">Manage faculty members and student records.</p>
            </button>

            <button className="main-nav-card" onClick={() => navigate('/pc/courses-subjects')}>
                <h2 className="card-title">📚 Courses & Subjects</h2>
                <p className="card-description">Define and manage academic courses and subjects.</p>
            </button>

            <button className="main-nav-card" onClick={() => navigate('/pc/attendance-reports')}>
                <h2 className="card-title">📈 Attendance Reports</h2>
                <p className="card-description">View and download comprehensive attendance records.</p>
            </button>

            <button className="main-nav-card" onClick={() => navigate('/pc/timetable-schedules')}>
                <h2 className="card-title">🗓️ Timetable & Schedules</h2>
                <p className="card-description">Manage class timetables and faculty allotments.</p>
            </button>
        </div>

      </div>
    </div>
  );
}

export default PCoordinatorDashboard;