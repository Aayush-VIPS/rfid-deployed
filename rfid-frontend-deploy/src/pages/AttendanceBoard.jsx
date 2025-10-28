// src/pages/AttendanceBoard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { formatTimeInIST } from '../utils/timezone';
import './attendanceBoard.css';

function AttendanceBoard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionDetails, setSessionDetails] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Device authentication status (handled via polling)
  const [deviceAuthStatus, setDeviceAuthStatus] = useState({
    isAuth: false,
    authenticatedBy: 'N/A',
    deviceMacAddress: 'N/A',
    message: 'Device not authenticated.'
  });

  // Toast refs
  const attendanceUpdateToastId = useRef(null);

  // New function to handle all state updates for attendance data
  const updateAttendanceState = (newData) => {
    setPresentStudents(prevPresent => {
      if (prevPresent.length !== newData.presentStudents.length && prevPresent.length > 0) {
        if (attendanceUpdateToastId.current) {
          toast.dismiss(attendanceUpdateToastId.current);
        }
        attendanceUpdateToastId.current = toast.success('New attendance recorded!');
      }
      return newData.presentStudents;
    });
    setAbsentStudents(newData.absentStudents);
    setTotalStudents(newData.totalStudentsInSessionSection);
    setPresentCount(newData.presentCount);
    setAbsentCount(newData.absentCount);
  };


  // Function to fetch attendance data via HTTP
  const fetchAttendanceData = async () => {
    try {
      const snapshotRes = await api.get(`/api/attendance/snapshot/${sessionId}`);
      const newData = snapshotRes.data;
      updateAttendanceState(newData);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    }
  };

  // Function to fetch device authentication status
  const fetchDeviceAuthStatus = async () => {
    try {
      // Call the real device auth status API
      const response = await api.get(`/api/device/auth-status/${sessionId}`);
      
      const newStatus = response.data;
      
      console.log('[AttendanceBoard] Device auth status response:', newStatus); // Debug log
      console.log('[AttendanceBoard] Full response:', response); // Debug log
      
      // Update device auth status
      setDeviceAuthStatus(prevStatus => {
        console.log('[AttendanceBoard] Previous status:', prevStatus, 'New status:', newStatus); // Debug log
        
        // Only show toast if auth status changed to true
        if (!prevStatus.isAuth && newStatus.isAuth) {
          toast.success(`Device authenticated by ${newStatus.authenticatedBy}!`);
        }
        
        // If status changed from authenticated to not authenticated
        if (prevStatus.isAuth && !newStatus.isAuth) {
          toast.error('Device authentication lost');
        }
        
        return newStatus;
      });
      
      // Update last successful update time
      setLastUpdateTime(new Date());
      
    } catch (err) {
      // If API fails, set as not authenticated
      console.error('[AttendanceBoard] Error fetching device auth status:', err);
      console.error('[AttendanceBoard] Error response:', err.response);
      
      const errorStatus = {
        isAuth: false,
        authenticatedBy: 'N/A',
        deviceMacAddress: 'N/A',
        message: `API Error: ${err.response?.status || 'Network error'} - ${err.response?.data?.message || err.message}`
      };
      
      setDeviceAuthStatus(prevStatus => {
        // Only log error change if it's different
        if (prevStatus.message !== errorStatus.message) {
          console.error('[AttendanceBoard] Device auth status error changed:', errorStatus);
        }
        return errorStatus;
      });
    }
  };

  // Function to fetch initial session details and attendance snapshot
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const sessionRes = await api.get(`/api/session/${sessionId}`);
      setSessionDetails(sessionRes.data);
      await fetchAttendanceData();
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err.response?.data?.message || 'Failed to load session data.');
      toast.error('Failed to load attendance board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is missing.');
      setLoading(false);
      return;
    }

    fetchSessionData();
    fetchDeviceAuthStatus(); // Initial fetch of device auth status

    // Set up polling for real-time attendance updates (every 2 seconds for testing phase)
    // NOTE: 2-second polling is maintained for critical real-time attendance recording
    // Students tap RFID and leave immediately - cannot afford latency
    const pollingInterval = setInterval(async () => {
      try {
        await Promise.all([
          fetchAttendanceData(), // Refresh attendance data
          fetchDeviceAuthStatus() // Refresh device auth status
        ]);
        console.log('[AttendanceBoard] Polling update completed at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('[AttendanceBoard] Polling error:', error);
      }
    }, 2000);

    return () => {
      // Cleanup
      clearInterval(pollingInterval);
      toast.dismiss(attendanceUpdateToastId.current);
    };
  }, [sessionId]);

  const handleCloseSession = async () => {
    if (!sessionDetails) return;
    try {
      await api.post(`/api/session/close/${sessionId}`);
      toast.success('Session closed successfully!');
      navigate('/teacher-dashboard');
    } catch (err) {
      console.error('Error closing session:', err);
      toast.error(err.response?.data?.message || 'Failed to close session.');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const url = `/api/attendance/export-session/${sessionId}/excel`;
      const resp = await api.get(url, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(
        new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `attendance_session_report_${sessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('Excel downloaded!');
    } catch {
      toast.error('Could not download session Excel.');
    }
  };

  const handleManualRefresh = async () => {
    toast.loading('Refreshing attendance...', { duration: 1000 });
    await fetchAttendanceData();
  };

  const handleTestDeviceAuth = async () => {
    toast.loading('Testing device auth API...', { duration: 1000 });
    console.log('[AttendanceBoard] Manual device auth test triggered');
    await fetchDeviceAuthStatus();
  };

  if (loading) {
    return (
      <div className="attendance-board-page-container">
        <PageHeader dashboardTitle="ATTENDANCE BOARD" />
        <div className="attendance-board-main-content text-center p-8">
          <div className="loading-state">Loading attendance board...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-board-page-container">
        <PageHeader dashboardTitle="ATTENDANCE BOARD" />
        <div className="attendance-board-main-content text-center p-8">
          <div className="error-state">Error: {error}</div>
        </div>
      </div>
    );
  }

  const allStudentsDisplay = [...presentStudents, ...absentStudents].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="attendance-board-page-container">
      <PageHeader dashboardTitle="ATTENDANCE BOARD" />
      <div className="attendance-board-main-content">
        <div className="actions-row">
          <button onClick={handleDownloadExcel} className="download-excel-button">
            Download Excel
          </button>
          {/* <button onClick={handleManualRefresh} className="refresh-button" title="Refresh attendance data">
            🔄 Refresh
          </button> */}
          {/* <button onClick={handleTestDeviceAuth} className="refresh-button" title="Test device auth API" style={{ background: '#orange' }}>
            🔧 Test Auth API
          </button> */}
          <button onClick={() => navigate(-1)} className="back-button">
            Back
          </button>
          <button onClick={handleCloseSession} className="close-session-button">
            Close Session
          </button>
        </div>

        <div className="session-info-card">
          <h2>Live Attendance for:</h2>
          <h3>{sessionDetails?.subjectInst?.subject?.name} ({sessionDetails?.subjectInst?.subject?.code})</h3>
          <p>Section: {sessionDetails?.subjectInst?.section?.name}</p>
          <p>Teacher: {sessionDetails?.subjectInst?.faculty?.name}</p>
          {/* <p className="connection-status">
            Updates: ⚡ Polling (1 second refresh)
          </p> */}
        </div>

        <div className={`device-auth-status-banner ${deviceAuthStatus.isAuth ? 'authenticated' : 'unauthenticated'}`}>
          <h4>Device Authentication Status:</h4>
          <p>Status: {deviceAuthStatus.isAuth ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED'}</p>
          {deviceAuthStatus.isAuth ? (
            <>
              <p>Authenticated By: {deviceAuthStatus.authenticatedBy}</p>
              <p>Device MAC: {deviceAuthStatus.deviceMacAddress}</p>
            </>
          ) : (
            <div>
              {/* <p><strong>📱 To authenticate:</strong></p>
              <p>1. Teacher should scan their RFID card on the ESP32 device</p>
              <p>2. The device will automatically link to this session</p>
              <p>3. Status will update to "AUTHENTICATED"</p> */}
            </div>
          )}
          <p className="status-message">{deviceAuthStatus.message}</p>
          
          {/* Debug Info - remove this in production */}
          {/* <details className="debug-info" style={{ marginTop: '10px', fontSize: '12px', background: '#f5f5f5', padding: '10px', border: '1px solid #ccc' }}>
            <summary>🔧 Debug Info (Click to expand)</summary>
            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              <p><strong>Session ID:</strong> {sessionId}</p>
              <p><strong>API Endpoint:</strong> GET /api/device/auth-status/{sessionId}</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleTimeString()}</p>
              <p><strong>Last Successful API Call:</strong> {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Never'}</p>
              <p><strong>Session Details:</strong> {sessionDetails ? 'Loaded' : 'Not loaded'}</p>
              {sessionDetails && (
                <>
                  <p><strong>Teacher:</strong> {sessionDetails?.subjectInst?.faculty?.name} (ID: {sessionDetails?.subjectInst?.faculty?.id})</p>
                  <p><strong>Subject:</strong> {sessionDetails?.subjectInst?.subject?.name}</p>
                  <p><strong>Section:</strong> {sessionDetails?.subjectInst?.section?.name}</p>
                </>
              )}
              <p><strong>Raw Auth Status:</strong></p>
              <pre style={{ background: '#e8e8e8', padding: '5px', fontSize: '10px' }}>
{JSON.stringify(deviceAuthStatus, null, 2)}
              </pre>
            </div>
          </details> */}
        </div>

        <div className="attendance-summary-section">
          <h3>Attendance Summary</h3>
          <p>Total Students in Section: {totalStudents}</p>
          <p>Students Present: {presentCount}</p>
          <p>Students Absent: {absentCount}</p>
        </div>

        <div className="attendance-list-section">
          <h2 className="students-present-heading">All Students ({totalStudents})</h2>
          {allStudentsDisplay.length === 0 ? (
            <p className="no-scans-message">No students found for this section.</p>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Enrollment No.</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Scanned At</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudentsDisplay.map((student) => (
                    <tr key={student.id} className={student.status === 'ABSENT' ? 'absent-row' : ''}>
                      <td>{student.enrollmentNo}</td>
                      <td>{student.name}</td>
                      <td>{student.status}</td>
                      <td>{student.status === 'PRESENT' ? formatTimeInIST(student.timestamp) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceBoard;