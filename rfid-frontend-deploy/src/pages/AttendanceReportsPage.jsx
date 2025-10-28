import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import { useNavigate } from 'react-router-dom';
import { getCurrentDateInIST } from '../utils/timezone';
import './attendanceReportsPage.css';

function AttendanceReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('section'); // 'section', 'student', 'batch', 'semester'
  const [reportFilters, setReportFilters] = useState({
    courseId: '',
    subjectId: '',
    sectionId: '',
    semesterId: '',
    studentId: '',
    batchYear: '',
    admissionYear: '',
    from: '',
    to: getCurrentDateInIST(),
    predefinedRange: 'custom',
  });

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState({ batchYears: [], admissionYears: [] });

  // Student search and filtering
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Filter semesters based on selected course for semester reports
  const [allSemesters, setAllSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);

  // Update filtered semesters when course selection changes
  useEffect(() => {
    if (reportType === 'semester' && reportFilters.courseId) {
      const courseSemesters = allSemesters.filter(sem => 
        sem.course && sem.course.id === parseInt(reportFilters.courseId)
      );
      setFilteredSemesters(courseSemesters);
    } else {
      setFilteredSemesters(allSemesters);
    }
  }, [reportFilters.courseId, reportType, allSemesters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, subjectsRes, sectionsRes, batchesRes] = await Promise.all([
          api.get('/api/course'),
          api.get('/api/subject'),
          api.get('/api/section'),
          api.get('/api/report/batches'),
        ]);
        setCourses(coursesRes.data);
        setSubjects(subjectsRes.data);
        setSections(sectionsRes.data);
        setBatches(batchesRes.data.data);

        // Extract unique semesters from sections
        const uniqueSemesters = sectionsRes.data.reduce((acc, section) => {
          const existing = acc.find(sem => sem.id === section.semester.id);
          if (!existing) {
            acc.push({
              ...section.semester,
              course: section.semester.course // Ensure course info is included
            });
          }
          return acc;
        }, []);
        setAllSemesters(uniqueSemesters);
        setFilteredSemesters(uniqueSemesters);

      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast.error(error.response?.data?.message || 'Failed to load filter options.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch students when section or course changes for student reports
  useEffect(() => {
    if (reportType === 'student' && (reportFilters.sectionId || reportFilters.courseId)) {
      fetchStudents();
    }
  }, [reportType, reportFilters.sectionId, reportFilters.courseId]);

  // Filter students based on search
  useEffect(() => {
    if (studentSearch.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.enrollmentNo.toLowerCase().includes(studentSearch.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, studentSearch]);

  const fetchStudents = async () => {
    try {
      const params = {};
      if (reportFilters.sectionId) params.sectionId = reportFilters.sectionId;
      if (reportFilters.courseId) params.courseId = reportFilters.courseId;
      
      const response = await api.get('/api/student', { params });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students.');
    }
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    setReportData(null);
    setReportFilters(prev => ({
      ...prev,
      studentId: '',
      batchYear: '',
      admissionYear: '',
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters(prev => ({ ...prev, [name]: value }));
    setReportData(null);
  };

  const handlePredefinedRangeChange = (e) => {
    const range = e.target.value;
    let fromDate = '';
    let toDate = getCurrentDateInIST();

    if (range === 'weekly') {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      // Convert to IST date string
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istFirstDay = new Date(firstDayOfWeek.getTime() + istOffset);
      fromDate = istFirstDay.toISOString().slice(0, 10);
    } else if (range === 'monthly') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // Convert to IST date string
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istFirstDay = new Date(firstDayOfMonth.getTime() + istOffset);
      fromDate = istFirstDay.toISOString().slice(0, 10);
    } else if (range === 'semester') {
      const today = new Date();
      const m = today.getMonth();
      const semesterStart = m <= 6 ? new Date(today.getFullYear(), 0, 1) : new Date(today.getFullYear(), 7, 1);
      // Convert to IST date string
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istSemesterStart = new Date(semesterStart.getTime() + istOffset);
      fromDate = istSemesterStart.toISOString().slice(0, 10);
    }

    setReportFilters(prev => ({
      ...prev,
      predefinedRange: range,
      from: fromDate,
      to: toDate,
    }));
    setReportData(null);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);

    try {
      let response;
      let endpoint;
      let params = {};

      switch (reportType) {
        case 'section':
          if (!reportFilters.from || !reportFilters.to) {
            toast.error('Please select date range for section reports.');
            setReportLoading(false);
            return;
          }
          endpoint = '/api/report';
          params = {
            from: reportFilters.from,
            to: reportFilters.to,
            ...(reportFilters.sectionId && { sectionId: reportFilters.sectionId }),
            ...(reportFilters.courseId && { courseId: reportFilters.courseId }),
            ...(reportFilters.subjectId && { subjectId: reportFilters.subjectId }),
          };
          break;

        case 'student':
          if (!reportFilters.studentId) {
            toast.error('Please select a student for individual reports.');
            setReportLoading(false);
            return;
          }
          endpoint = `/api/report/student/${reportFilters.studentId}`;
          params = {
            ...(reportFilters.from && { from: reportFilters.from }),
            ...(reportFilters.to && { to: reportFilters.to }),
            ...(reportFilters.subjectId && { subjectId: reportFilters.subjectId }),
            ...(reportFilters.courseId && { courseId: reportFilters.courseId }),
          };
          break;

        case 'batch':
          if (!reportFilters.from || !reportFilters.to) {
            toast.error('Please select date range for batch reports.');
            setReportLoading(false);
            return;
          }
          if (!reportFilters.batchYear) {
            toast.error('Please select a batch year.');
            setReportLoading(false);
            return;
          }
          endpoint = '/api/report/batch';
          params = {
            from: reportFilters.from,
            to: reportFilters.to,
            batchYear: reportFilters.batchYear,
            ...(reportFilters.sectionId && { sectionId: reportFilters.sectionId }),
            ...(reportFilters.subjectId && { subjectId: reportFilters.subjectId }),
            ...(reportFilters.courseId && { courseId: reportFilters.courseId }),
          };
          break;

        case 'semester':
          if (!reportFilters.courseId) {
            toast.error('Please select a course for semester reports.');
            setReportLoading(false);
            return;
          }
          endpoint = '/api/report/semester';
          params = {
            courseId: reportFilters.courseId,
            ...(reportFilters.semesterId && { semesterId: reportFilters.semesterId }),
            ...(reportFilters.from && { from: reportFilters.from }),
            ...(reportFilters.to && { to: reportFilters.to }),
          };
          break;

        default:
          toast.error('Invalid report type.');
          setReportLoading(false);
          return;
      }

      response = await api.get(endpoint, { params });
      setReportData(response.data.data);
      
      if (reportType === 'section' && Array.isArray(response.data.data) && response.data.data.length === 0) {
        toast('No attendance records found.', { icon: '🤔' });
      } else {
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const exportData = {
        type: reportType,
        filters: reportFilters,
        format: 'xlsx'
      };

      const response = await api.post('/api/report/export', exportData, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const filename = `${reportType}-attendance-report-${getCurrentDateInIST()}.xlsx`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(error.response?.data?.message || 'Failed to export report.');
    }
  };

  const renderReportTypeSelector = () => (
    <div className="report-type-selector">
      <h3>Report Type</h3>
      <div className="report-type-buttons">
        {[
          { type: 'section', label: 'Section Report', icon: '👥' },
          { type: 'student', label: 'Individual Student', icon: '🎓' },
          { type: 'batch', label: 'Batch Report', icon: '📅' },
          { type: 'semester', label: 'Semester Report', icon: '📚' }
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            className={`report-type-btn ${reportType === type ? 'active' : ''}`}
            onClick={() => handleReportTypeChange(type)}
          >
            <span className="icon">{icon}</span>
            <span className="label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFilterForm = () => (
    <form onSubmit={handleGenerateReport} className="report-filter-form">
      {/* Common Filters */}
      {(reportType !== 'semester') && (
        <div className="form-group">
          <label htmlFor="courseId">Course</label>
          <select id="courseId" name="courseId" value={reportFilters.courseId} onChange={handleFilterChange}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {(reportType !== 'semester') && (
        <div className="form-group">
          <label htmlFor="subjectId">Subject</label>
          <select id="subjectId" name="subjectId" value={reportFilters.subjectId} onChange={handleFilterChange}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      )}

      {(reportType !== 'student' && reportType !== 'semester') && (
        <div className="form-group">
          <label htmlFor="sectionId">Section</label>
          <select id="sectionId" name="sectionId" value={reportFilters.sectionId} onChange={handleFilterChange}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester.number}, {s.semester.course.name})</option>)}
          </select>
        </div>
      )}

      {/* Student-specific filters */}
      {reportType === 'student' && (
        <>
          <div className="form-group">
            <label htmlFor="sectionId">Filter by Section (Optional)</label>
            <select id="sectionId" name="sectionId" value={reportFilters.sectionId} onChange={handleFilterChange}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester.number}, {s.semester.course.name})</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="studentSearch">Search Student</label>
            <input
              type="text"
              id="studentSearch"
              placeholder="Search by name or enrollment number..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentId">Select Student *</label>
            <select 
              id="studentId" 
              name="studentId" 
              value={reportFilters.studentId} 
              onChange={handleFilterChange}
              required
            >
              <option value="">Choose a student...</option>
              {filteredStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.enrollmentNo})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Batch-specific filters */}
      {reportType === 'batch' && (
        <div className="form-group">
          <label htmlFor="batchYear">Batch Year *</label>
          <select id="batchYear" name="batchYear" value={reportFilters.batchYear} onChange={handleFilterChange}>
            <option value="">Select Batch Year...</option>
            {batches.batchYears.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>
      )}

      {/* Semester-specific filters */}
      {reportType === 'semester' && (
        <>
          <div className="form-group">
            <label htmlFor="courseId">Course *</label>
            <select id="courseId" name="courseId" value={reportFilters.courseId} onChange={handleFilterChange}>
              <option value="">Select Course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {reportFilters.courseId && (
            <div className="form-group">
              <label htmlFor="semesterId">Semester (Optional)</label>
              <select id="semesterId" name="semesterId" value={reportFilters.semesterId || ''} onChange={handleFilterChange}>
                <option value="">All Semesters</option>
                {filteredSemesters.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.number}
                  </option>
                ))}
              </select>
              <p className="field-note">Leave blank to get report for all semesters of the selected course.</p>
            </div>
          )}
        </>
      )}

      {/* Date Range Filters */}
      {reportType !== 'student' && (
        <div className="form-group">
          <label htmlFor="predefinedRange">Date Range Preset</label>
          <select id="predefinedRange" name="predefinedRange" value={reportFilters.predefinedRange} onChange={handlePredefinedRangeChange}>
            <option value="custom">Custom Range</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="semester">This Semester</option>
          </select>
        </div>
      )}

      <div className="date-range-group">
        <div className="form-group">
          <label htmlFor="from">From Date</label>
          <input
            type="date"
            id="from"
            name="from"
            value={reportFilters.from}
            onChange={handleFilterChange}
            required={reportType === 'section' || reportType === 'batch'}
            disabled={reportFilters.predefinedRange !== 'custom'}
          />
        </div>

        <div className="form-group">
          <label htmlFor="to">To Date</label>
          <input
            type="date"
            id="to"
            name="to"
            value={reportFilters.to}
            onChange={handleFilterChange}
            required={reportType === 'section' || reportType === 'batch'}
            disabled={reportFilters.predefinedRange !== 'custom'}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={reportLoading} className="generate-report-button">
          {reportLoading ? 'Generating...' : 'Generate Report'}
        </button>
        
        {reportData && (
          <button type="button" onClick={handleExportReport} className="export-button">
            📊 Export Excel
          </button>
        )}
      </div>
    </form>
  );

  const renderReportResults = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'section':
        return renderSectionReport();
      case 'student':
        return renderStudentReport();
      case 'batch':
        return renderBatchReport();
      case 'semester':
        return renderSemesterReport();
      default:
        return null;
    }
  };

  const renderSectionReport = () => (
    <div className="report-results-card">
      <div className="report-summary">
        <h3>Section Attendance Report</h3>
        <p>Total Students: <strong>{reportData.length}</strong></p>
        {reportData.length > 0 && (
          <p>Total Classes: <strong>{reportData[0].totalClassesOccurred || reportData[0].totalSessions}</strong></p>
        )}
      </div>

      {reportData.length === 0 ? (
        <p className="no-data">No attendance records found for the selected criteria.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Enrollment No.</th>
              <th>Student Name</th>
              {reportData[0].batchYear && <th>Batch</th>}
              <th>Classes Present</th>
              <th>Classes Absent</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(rec => (
              <tr key={rec.studentId}>
                <td>{rec.enrollmentNo}</td>
                <td>{rec.name}</td>
                {rec.batchYear && <td>{rec.batchYear}</td>}
                <td className="text-center">{rec.presentCount}</td>
                <td className="text-center">{rec.absentCount}</td>
                <td className={`text-center attendance-percentage ${rec.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {rec.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderStudentReport = () => (
    <div className="report-results-card">
      <div className="student-report-header">
        <h3>Individual Student Report</h3>
        <div className="student-info">
          <p><strong>Name:</strong> {reportData.student.name}</p>
          <p><strong>Enrollment:</strong> {reportData.student.enrollmentNo}</p>
          <p><strong>Section:</strong> {reportData.student.section}</p>
          <p><strong>Course:</strong> {reportData.student.course}</p>
          {reportData.student.batchYear && (
            <p><strong>Batch:</strong> {reportData.student.batchYear}</p>
          )}
        </div>
      </div>

      <div className="student-summary">
        <div className="summary-card">
          <h4>Overall Summary</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">{reportData.summary.presentCount}</span>
              <span className="stat-label">Classes Attended</span>
            </div>
            <div className="stat">
              <span className="stat-value">{reportData.summary.absentCount}</span>
              <span className="stat-label">Classes Missed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{reportData.summary.totalSessions}</span>
              <span className="stat-label">Total Classes</span>
            </div>
            <div className="stat">
              <span className={`stat-value ${reportData.summary.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.summary.percentage}%
              </span>
              <span className="stat-label">Attendance</span>
            </div>
          </div>
        </div>
      </div>

      {reportData.subjectBreakdown && reportData.subjectBreakdown.length > 0 && (
        <div className="subject-breakdown">
          <h4>Subject-wise Breakdown</h4>
          <table className="report-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjectBreakdown.map(subject => (
                <tr key={subject.subjectId}>
                  <td>{subject.subjectName}</td>
                  <td className="text-center">{subject.presentCount}</td>
                  <td className="text-center">{subject.absentCount}</td>
                  <td className="text-center">{subject.totalSessions}</td>
                  <td className={`text-center attendance-percentage ${subject.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {subject.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBatchReport = () => (
    <div className="report-results-card">
      <div className="batch-summary-enhanced">
        <h3>📊 Batch Attendance Report</h3>
        
        <div className="batch-summary-grid">
          <div className="batch-summary-item">
            <h4>Total Students</h4>
            <div className="value">{reportData.length}</div>
          </div>
          
          {reportData.length > 0 && (
            <>
              <div className="batch-summary-item">
                <h4>Batch Year</h4>
                <div className="value">{reportData[0].batchYear || reportFilters.admissionYear}</div>
              </div>
              
              <div className="batch-summary-item">
                <h4>Average Attendance</h4>
                <div className={`value ${Math.round(reportData.reduce((sum, student) => sum + student.percentage, 0) / reportData.length) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.round(reportData.reduce((sum, student) => sum + student.percentage, 0) / reportData.length * 100) / 100}%
                </div>
              </div>
              
              <div className="batch-summary-item">
                <h4>Students Above 75%</h4>
                <div className="value text-green-600">
                  {reportData.filter(student => student.percentage >= 75).length}
                </div>
              </div>
              
              <div className="batch-summary-item">
                <h4>Students Below 75%</h4>
                <div className="value text-red-600">
                  {reportData.filter(student => student.percentage < 75).length}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {reportData.length === 0 ? (
        <div className="no-data">
          <p>No students found for the selected batch criteria.</p>
          <p>Try adjusting your filters or check if data exists for this batch.</p>
        </div>
      ) : (
        <div className="table-container">
          <h4>📋 Student Details</h4>
          <table className="report-table">
            <thead>
              <tr>
                <th>Enrollment No.</th>
                <th>Student Name</th>
                <th>Section</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData
                .sort((a, b) => b.percentage - a.percentage)
                .map(student => (
                <tr key={student.studentId}>
                  <td><strong>{student.enrollmentNo}</strong></td>
                  <td>{student.name}</td>
                  <td><span className="section-badge">{student.section}</span></td>
                  <td>{student.course}</td>
                  <td>{student.batchYear || 'N/A'}</td>
                  <td className="text-center"><strong>{student.presentCount}</strong></td>
                  <td className="text-center"><strong>{student.absentCount}</strong></td>
                  <td className="text-center"><strong>{student.totalSessions}</strong></td>
                  <td className={`text-center attendance-percentage ${student.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {student.percentage}%
                  </td>
                  <td className="text-center">
                    <span className={`status-badge ${student.percentage >= 75 ? 'status-good' : 'status-warning'}`}>
                      {student.percentage >= 75 ? '✓ Good' : '⚠ Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSemesterReport = () => (
    <div className="report-results-card">
      <div className="batch-summary-enhanced">
        <h3>🎓 Semester-wide Attendance Report</h3>
        <div className="semester-summary-stats">
          <div className="batch-summary-item">
            <h4>Total Sections</h4>
            <div className="value">{reportData.summary.totalSections}</div>
          </div>
          <div className="batch-summary-item">
            <h4>Total Students</h4>
            <div className="value">{reportData.summary.totalStudents}</div>
          </div>
          <div className="batch-summary-item">
            <h4>Average Attendance</h4>
            <div className={`value ${reportData.summary.avgAttendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {reportData.summary.avgAttendance}%
            </div>
          </div>
          <div className="batch-summary-item">
            <h4>Best Performing Section</h4>
            <div className="value text-green-600">
              {reportData.sections.reduce((best, current) => 
                current.avgAttendance > best.avgAttendance ? current : best, 
                reportData.sections[0]
              )?.sectionName || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="sections-container">
        <h4>📊 Section-wise Breakdown</h4>
        {reportData.sections
          .sort((a, b) => b.avgAttendance - a.avgAttendance)
          .map(section => (
          <div key={section.sectionId} className="section-report-card">
            <div className="section-header">
              <div>
                <h4>Section {section.sectionName}</h4>
                <div className="section-meta">
                  <span>📚 {section.course}</span>
                  <span>📅 {section.semester}</span>
                  <span>👥 {section.totalStudents} students</span>
                  <span className={section.avgAttendance >= 75 ? 'text-green-600' : 'text-red-600'}>
                    📈 {section.avgAttendance}% avg
                  </span>
                </div>
              </div>
              <div className="section-performance">
                <span className={`performance-badge ${section.avgAttendance >= 75 ? 'good' : 'needs-attention'}`}>
                  {section.avgAttendance >= 75 ? '🏆 Good Performance' : '⚠️ Needs Attention'}
                </span>
              </div>
            </div>

            <div className="students-preview">
              <h5>👨‍🎓 Top Students Preview</h5>
              <table className="section-students-table">
                <thead>
                  <tr>
                    <th>Enrollment No.</th>
                    <th>Student Name</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total</th>
                    <th>%</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {section.students
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 10)
                    .map((student, index) => (
                    <tr key={student.studentId}>
                      <td>
                        <strong>{student.enrollmentNo}</strong>
                        {index < 3 && <span className="rank-badge">#{index + 1}</span>}
                      </td>
                      <td>{student.name}</td>
                      <td className="text-center">{student.presentCount}</td>
                      <td className="text-center">{student.absentCount}</td>
                      <td className="text-center">{student.totalClassesOccurred || student.totalSessions}</td>
                      <td className={`text-center attendance-percentage ${student.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {student.percentage}%
                      </td>
                      <td className="text-center">
                        <span className={`status-badge ${student.percentage >= 75 ? 'status-good' : 'status-warning'}`}>
                          {student.percentage >= 75 ? '✓' : '⚠'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {section.students.length > 10 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        ... and {section.students.length - 10} more students
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div className="pcoord-sub-page-main-content text-center p-8">Loading Attendance Reports...</div>;
  }

  return (
    <div className="pcoord-sub-page-container">
      <PageHeader dashboardTitle="COMPREHENSIVE ATTENDANCE REPORTS" />
      <div className="pcoord-sub-page-main-content">
        <button onClick={() => navigate(-1)} className="back-button">Back to PC Dashboard</button>

        <h1 className="page-title">Advanced Attendance Analytics</h1>
        <p className="page-description">
          Generate detailed attendance reports with advanced filtering options: individual students, batch analysis, 
          semester overviews, and section-specific data.
        </p>

        {renderReportTypeSelector()}
        {renderFilterForm()}
        {renderReportResults()}
      </div>
    </div>
  );
}

export default AttendanceReportsPage;