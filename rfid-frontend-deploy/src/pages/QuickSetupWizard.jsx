// src/pages/QuickSetupWizard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import { useNavigate } from 'react-router-dom';
import './quickSetupWizard.css';

// Simple input component without memo
const SimpleInput = ({ value, onChange, ...props }) => {
  return <input value={value || ''} onChange={onChange} {...props} />;
};

// Simple select component without memo
const SimpleSelect = ({ value, onChange, children, ...props }) => {
  return (
    <select value={value || ''} onChange={onChange} {...props}>
      {children}
    </select>
  );
};

const SETUP_STEPS = [
  { id: 1, title: 'Basic Info', description: 'Department and Course details' },
  { id: 2, title: 'Academic Structure', description: 'Semesters and Sections' },
  { id: 3, title: 'Subjects', description: 'Add subjects for each semester' },
  { id: 4, title: 'Faculty Assignment', description: 'Assign teachers to subjects' }
];

function QuickSetupWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Main component state - ALL HOOKS AT TOP LEVEL
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    department: { name: '', code: '', id: null },
    course: { name: '', degreeType: 'UG', durationYears: 3 },
    batchYear: new Date().getFullYear(),
    semesters: [],
    sections: [],
    subjects: [],
    assignments: [],
    faculty: [], // Added missing faculty array
    schedule: []
  });
  const [loading, setLoading] = useState(false);
  const [existingDepartments, setExistingDepartments] = useState([]);
  const [departmentMode, setDepartmentMode] = useState('new'); // 'new' or 'existing'
  const [savingSubjects, setSavingSubjects] = useState(false);
  
  // Step-specific state at main component level
  const [currentSemester, setCurrentSemester] = useState(1);
  const [faculties, setFaculties] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [showNewFacultyForm, setShowNewFacultyForm] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    employeeId: '',
    phoneNumber: '',
    rfidNumber: '',
    department: ''
  });
  const [addingFaculty, setAddingFaculty] = useState(false);

  // Load existing departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/api/course/helpers/departments');
        setExistingDepartments(response.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load existing departments');
      }
    };
    
    fetchDepartments();
  }, []);

  // Generate semesters and sections when course duration changes
  useEffect(() => {
    if (setupData.course.durationYears > 0) {
      const generateSemestersAndSections = () => {
        const semesters = [];
        const sections = [];
        const totalSemesters = setupData.course.durationYears * 2; // 2 semesters per year

        // Generate semesters (1-8 for 4 years)
        for (let i = 1; i <= totalSemesters; i++) {
          semesters.push({
            number: i,
            type: i % 2 === 1 ? 'odd' : 'even',
            academicYear: Math.ceil(i / 2) // Changed from 'year' to 'academicYear'
          });
        }

        // Generate sections for each semester
        semesters.forEach(semester => {
          // Regular shift sections: A, B, C
          ['A', 'B', 'C'].forEach(sectionName => {
            sections.push({
              name: sectionName,
              semesterNumber: semester.number,
              capacity: 60,
              shift: 'regular'
            });
          });
          
          // Evening shift sections: EA, EB
          ['EA', 'EB'].forEach(sectionName => {
            sections.push({
              name: sectionName,
              semesterNumber: semester.number,
              capacity: 60,
              shift: 'evening'
            });
          });
        });

        setSetupData(prev => ({ ...prev, semesters, sections }));
      };

      generateSemestersAndSections();
    }
  }, [setupData.course.durationYears]);

  // Faculty loading function
  const loadFaculties = useCallback(async () => {
    setLoadingFaculties(true);
    try {
      const response = await api.get('/api/faculty');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      toast.error('Failed to load faculty members');
    } finally {
      setLoadingFaculties(false);
    }
  }, []);

  // Load faculties when on faculty assignment step
  useEffect(() => {
    if (currentStep === 4) {
      loadFaculties();
    }
  }, [currentStep, loadFaculties]);

  // Auto-refresh faculties every 30 seconds when on faculty assignment step
  useEffect(() => {
    if (currentStep === 4) {
      const interval = setInterval(loadFaculties, 30000);
      return () => clearInterval(interval);
    }
  }, [currentStep, loadFaculties]);

  // Basic input change handlers (NO CIRCULAR DEPENDENCIES)
  const handleBasicInfoChange = useCallback((field, value) => {
    setSetupData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: { ...prev[parent], [child]: value }
        };
      } else {
        return { ...prev, [field]: value };
      }
    });
  }, []);

  const handleDepartmentModeChange = useCallback((mode) => {
    setDepartmentMode(mode);
    if (mode === 'existing') {
      // Clear department fields when switching to existing
      setSetupData(prev => ({
        ...prev,
        department: { name: '', code: '', id: null }
      }));
    } else {
      // Clear selected department when switching to new
      setSetupData(prev => ({
        ...prev,
        department: { name: '', code: '', id: null }
      }));
    }
  }, []);

  const handleExistingDepartmentChange = useCallback((e) => {
    const departmentId = e.target.value;
    const selectedDept = existingDepartments.find(d => d.id === departmentId);
    if (selectedDept) {
      setSetupData(prev => ({
        ...prev,
        department: { 
          id: selectedDept.id,
          name: selectedDept.name,
          code: selectedDept.code
        }
      }));
    }
  }, [existingDepartments]);

  // Subject management handlers
  const updateSubject = useCallback((subjectId, field, value) => {
    setSetupData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === subjectId ? { ...subject, [field]: value } : subject
      )
    }));
  }, []);

  const handleAddSubject = useCallback((semesterNumber) => {
    const newSubject = {
      id: Date.now(),
      code: '',
      name: '',
      credits: 3,
      semesterNumber,
      type: 'core'
    };
    
    setSetupData(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
  }, []);

  const saveSubjects = useCallback(async () => {
    setSavingSubjects(true);
    try {
      // Validate subjects before saving
      const currentSemesterSubjects = setupData.subjects.filter(s => s.semesterNumber === currentSemester);
      const invalidSubjects = currentSemesterSubjects.filter(s => !s.code || !s.name);
      
      if (invalidSubjects.length > 0) {
        toast.error('Please fill in all subject codes and names before saving');
        return;
      }

      toast.success(`Saved ${currentSemesterSubjects.length} subjects for Semester ${currentSemester}`);
    } catch (error) {
      console.error('Error saving subjects:', error);
      toast.error('Failed to save subjects');
    } finally {
      setSavingSubjects(false);
    }
  }, [setupData.subjects, currentSemester]);

  const removeSubject = useCallback((subjectId) => {
    setSetupData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject.id !== subjectId)
    }));
  }, []);

  // Faculty assignment handlers
  const assignFaculty = useCallback((subjectId, sectionId, facultyId) => {
    const assignment = {
      subjectId,
      sectionId,
      facultyId,
      id: Date.now()
    };
    
    setSetupData(prev => ({
      ...prev,
      assignments: [
        ...prev.assignments.filter(a => !(a.subjectId === subjectId && a.sectionId === sectionId)),
        assignment
      ]
    }));
  }, []);

  const removeFacultyAssignment = useCallback((subjectId, sectionId) => {
    setSetupData(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => !(a.subjectId === subjectId && a.sectionId === sectionId))
    }));
  }, []);

  // Navigation handlers
  const nextStep = useCallback(() => {
    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  // Step 1: Basic Information Component
  const BasicInfoStep = useMemo(() => (
    <div className="setup-step">
      <h3 className="step-title">Basic Information</h3>
      <p className="step-description">
        Set up your department and course information
      </p>
      
      {/* Department Selection Mode */}
      <div className="department-mode-selection">
        <h4>Department Setup</h4>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="departmentMode"
              value="new"
              checked={departmentMode === 'new'}
              onChange={(e) => handleDepartmentModeChange(e.target.value)}
            />
            <span>Create New Department</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="departmentMode"
              value="existing"
              checked={departmentMode === 'existing'}
              onChange={(e) => handleDepartmentModeChange(e.target.value)}
            />
            <span>Select Existing Department</span>
          </label>
        </div>
      </div>

      {/* Department Fields */}
      {departmentMode === 'existing' ? (
        <div className="form-group">
          <label>Select Department *</label>
          <select 
            value={setupData.department.id || ''}
            onChange={handleExistingDepartmentChange}
          >
            <option value="">-- Select Department --</option>
            {existingDepartments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Department Name *</label>
            <SimpleInput 
              type="text" 
              placeholder="e.g., Computer Science & Engineering"
              value={setupData.department.name}
              onChange={(e) => handleBasicInfoChange('department.name', e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label>Department Code *</label>
            <SimpleInput 
              type="text" 
              placeholder="e.g., CSE"
              value={setupData.department.code}
              onChange={(e) => handleBasicInfoChange('department.code', e.target.value.toUpperCase())}
              autoComplete="off"
            />
          </div>
        </>
      )}
      
      <div className="form-group">
        <label>Course Name *</label>
        <SimpleInput 
          type="text" 
          placeholder="e.g., Bachelor of Computer Applications"
          value={setupData.course.name}
          onChange={(e) => handleBasicInfoChange('course.name', e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="form-group">
        <label>Degree Type</label>
        <SimpleSelect 
          value={setupData.course.degreeType}
          onChange={(e) => handleBasicInfoChange('course.degreeType', e.target.value)}
        >
          <option value="UG">Undergraduate (UG)</option>
          <option value="PG">Postgraduate (PG)</option>
          <option value="Diploma">Diploma</option>
        </SimpleSelect>
      </div>
      <div className="form-group">
        <label>Course Duration (Years)</label>
        <SimpleSelect 
          value={setupData.course.durationYears}
          onChange={(e) => handleBasicInfoChange('course.durationYears', parseInt(e.target.value))}
        >
          <option value={1}>1 Year</option>
          <option value={2}>2 Years</option>
          <option value={3}>3 Years</option>
          <option value={4}>4 Years</option>
          <option value={5}>5 Years</option>
        </SimpleSelect>
      </div>
    </div>
  ), [
    setupData.department.name, 
    setupData.department.code,
    setupData.department.id,
    setupData.course.name,
    setupData.course.degreeType,
    setupData.course.durationYears,
    departmentMode, 
    existingDepartments,
    handleBasicInfoChange,
    handleDepartmentModeChange,
    handleExistingDepartmentChange
  ]);

  // Step 2: Academic Structure Component
  const AcademicStructureStep = useMemo(() => {
    const regularSections = setupData.sections.filter(sec => sec.shift === 'regular');
    const eveningSections = setupData.sections.filter(sec => sec.shift === 'evening');

    return (
      <div className="setup-step">
        <h3 className="step-title">Academic Structure</h3>
        <p className="step-description">
          Configure the academic structure for your course including batch year and semester organization.
        </p>
        
        {/* Batch Year Selection */}
        <div className="batch-year-section">
          <div className="form-group">
            <label>Batch Year</label>
            <select 
              value={setupData.batchYear}
              onChange={(e) => handleBasicInfoChange('batchYear', parseInt(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Generated Structure Overview */}
        <div className="structure-overview">
          <h4>Generated Structure</h4>
          
          <div className="info-grid">
            <div className="info-item">
              <strong>Course Duration:</strong> {setupData.course.durationYears} years
            </div>
            <div className="info-item">
              <strong>Total Semesters:</strong> {setupData.semesters.length}
            </div>
            <div className="info-item">
              <strong>Sections per Semester:</strong> {setupData.sections.length / setupData.semesters.length || 0}
            </div>
          </div>

          {/* Semesters Display */}
          <div className="semesters-display">
            <h5>Semesters ({setupData.semesters.length})</h5>
            <div className="semesters-grid">
              {setupData.semesters.map(semester => (
                <div key={semester.number} className={`semester-card ${semester.type}`}>
                  <div className="semester-number">Sem {semester.number}</div>
                  <div className="semester-type">{semester.type}</div>
                  <div className="semester-year">Year {semester.academicYear}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sections Display */}
          <div className="sections-display">
            <h5>Section Structure</h5>
            
            <div className="shift-section">
              <h6>Regular Shift (A, B, C)</h6>
              <div className="sections-preview">
                {Array.from(new Set(regularSections.map(s => s.semesterNumber))).map(semNum => (
                  <div key={semNum} className="semester-sections">
                    <span className="sem-label">Sem {semNum}:</span>
                    <span className="sections-list">
                      {regularSections
                        .filter(s => s.semesterNumber === semNum)
                        .map(s => s.name)
                        .join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="shift-section">
              <h6>Evening Shift (EA, EB)</h6>
              <div className="sections-preview">
                {Array.from(new Set(eveningSections.map(s => s.semesterNumber))).map(semNum => (
                  <div key={semNum} className="semester-sections">
                    <span className="sem-label">Sem {semNum}:</span>
                    <span className="sections-list">
                      {eveningSections
                        .filter(s => s.semesterNumber === semNum)
                        .map(s => s.name)
                        .join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [setupData, handleBasicInfoChange]);

  // Step 3: Subjects Component
  const SubjectsStep = useMemo(() => (
    <div className="setup-step">
      <h3 className="step-title">Subjects Configuration</h3>
      <p className="step-description">
        Add subjects for each semester
      </p>

      {/* Semester Selection */}
      <div className="semester-selector">
        <label>Select Semester:</label>
        <select 
          value={currentSemester}
          onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
        >
          {setupData.semesters.map(sem => (
            <option key={sem.number} value={sem.number}>
              Semester {sem.number} ({sem.type})
            </option>
          ))}
        </select>
      </div>

      {/* Subjects for Current Semester */}
      <div className="subjects-section">
        <div className="section-header">
          <h4>Semester {currentSemester} Subjects</h4>
          <div className="button-group">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => handleAddSubject(currentSemester)}
            >
              Add Subject
            </button>
            <button 
              type="button"
              className="btn btn-success"
              onClick={saveSubjects}
              disabled={savingSubjects}
            >
              {savingSubjects ? 'Saving...' : 'Save Subjects'}
            </button>
          </div>
        </div>

        <div className="subjects-list">
          {setupData.subjects
            .filter(subject => subject.semesterNumber === currentSemester)
            .map(subject => (
              <div key={subject.id} className="subject-card">
                <div className="subject-inputs">
                  <div className="form-group">
                    <label>Subject Code</label>
                    <SimpleInput
                      type="text"
                      placeholder="e.g., CSE101"
                      value={subject.code}
                      onChange={(e) => updateSubject(subject.id, 'code', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject Name</label>
                    <SimpleInput
                      type="text"
                      placeholder="e.g., Programming Fundamentals"
                      value={subject.name}
                      onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Credits</label>
                    <SimpleSelect
                      value={subject.credits}
                      onChange={(e) => updateSubject(subject.id, 'credits', parseInt(e.target.value))}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </SimpleSelect>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <SimpleSelect
                      value={subject.type}
                      onChange={(e) => updateSubject(subject.id, 'type', e.target.value)}
                    >
                      <option value="core">Core</option>
                      <option value="elective">Elective</option>
                      <option value="practical">Practical</option>
                    </SimpleSelect>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeSubject(subject.id)}
                >
                  Remove
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  ), [setupData, currentSemester, handleAddSubject, updateSubject, removeSubject, saveSubjects, savingSubjects]);

  // Step 4: Faculty Assignment Component
  const FacultyAssignmentStep = useMemo(() => {
    const handleAddNewFaculty = async (e) => {
      e.preventDefault();
      if (!newFaculty.name || !newFaculty.email || !newFaculty.employeeId || !newFaculty.rfidNumber) {
        toast.error('Please fill in all required fields');
        return;
      }

      setAddingFaculty(true);
      try {
        const response = await api.post('/api/faculty', {
          email: newFaculty.email,
          password: newFaculty.employeeId, // Use employeeId as default password
          name: newFaculty.name,
          empId: newFaculty.employeeId, // Map employeeId to empId
          phone: newFaculty.phoneNumber,
          rfidUid: newFaculty.rfidNumber, // Map rfidNumber to rfidUid
          department: setupData.department.name
        });
        
        // Refresh faculty list to get the most up-to-date data
        await loadFaculties();
        
        setNewFaculty({
          name: '',
          email: '',
          employeeId: '',
          phoneNumber: '',
          rfidNumber: '',
          department: ''
        });
        setShowNewFacultyForm(false);
        toast.success('Faculty member added successfully!');
      } catch (error) {
        console.error('Error adding faculty:', error);
        toast.error('Failed to add faculty member');
      } finally {
        setAddingFaculty(false);
      }
    };

    return (
      <div className="setup-step">
        <h3 className="step-title">Faculty Assignment</h3>
        <p className="step-description">
          Assign faculty members to subjects and sections
        </p>

        {/* Faculty Management */}
        <div className="faculty-management">
          <div className="section-header">
            <h4>Faculty Management</h4>
            <div className="section-actions">
              <button
                type="button"
                className="btn btn-refresh"
                onClick={loadFaculties}
                disabled={loadingFaculties}
                title="Refresh faculty list"
              >
                {loadingFaculties ? '🔄' : '↻'} Refresh
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNewFacultyForm(!showNewFacultyForm)}
              >
                {showNewFacultyForm ? 'Cancel' : 'Add New Faculty'}
              </button>
            </div>
          </div>

          {/* New Faculty Form */}
          {showNewFacultyForm && (
            <form onSubmit={handleAddNewFaculty} className="new-faculty-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <SimpleInput
                    type="text"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <SimpleInput
                    type="email"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Employee ID *</label>
                  <SimpleInput
                    type="text"
                    value={newFaculty.employeeId}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, employeeId: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <SimpleInput
                    type="tel"
                    value={newFaculty.phoneNumber}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>RFID Number *</label>
                  <SimpleInput
                    type="text"
                    value={newFaculty.rfidNumber}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, rfidNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={addingFaculty}>
                  {addingFaculty ? 'Adding...' : 'Add Faculty'}
                </button>
              </div>
            </form>
          )}

          {/* Faculty List */}
          <div className="faculty-list">
            <h5>Available Faculty ({faculties.length})</h5>
            {loadingFaculties ? (
              <div className="loading">Loading faculty members...</div>
            ) : (
              <div className="faculty-grid">
                {faculties.map(faculty => (
                  <div key={faculty.id} className="faculty-card">
                    <div className="faculty-info">
                      <div className="faculty-name">{faculty.name}</div>
                      <div className="faculty-details">
                        <span>ID: {faculty.empId || faculty.employeeId}</span>
                        <span>Email: {faculty.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Matrix */}
        <div className="assignment-section">
          <h4>Subject-Section Assignments</h4>
          <p className="assignment-description">
            Assign faculty to subjects across all semesters. Subjects marked with ✓ have been saved.
          </p>

          {/* Show subjects organized by semester */}
          {setupData.semesters.map(semester => {
            const semesterSubjects = setupData.subjects.filter(subject => 
              subject.semesterNumber === semester.number
            );
            
            if (semesterSubjects.length === 0) return null;
            
            return (
              <div key={semester.number} className="semester-assignment-group">
                <h5 className="semester-title">Semester {semester.number}</h5>
                <div className="assignment-matrix">
                  {semesterSubjects.map(subject => (
                    <div key={subject.id} className="subject-assignment">
                      <h6>
                        {subject.saved && <span className="saved-indicator">✓ </span>}
                        {subject.code} - {subject.name}
                        {subject.saved && <span className="saved-badge">Saved</span>}
                      </h6>
                      <div className="sections-grid">
                        {setupData.sections
                          .filter(section => section.semesterNumber === semester.number)
                          .map(section => {
                            const assignment = setupData.assignments.find(a => 
                              a.subjectId === subject.id && a.sectionId === section.name
                            );
                            const assignedFaculty = assignment ? 
                              faculties.find(f => f.id === assignment.facultyId) : null;

                            return (
                              <div key={section.name} className="section-assignment">
                                <div className="section-info">
                                  <span className="section-name">{section.name}</span>
                                  <span className="section-shift">({section.shift})</span>
                                </div>
                                <div className="faculty-selection">
                                  <select
                                    value={assignedFaculty?.id || ''}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignFaculty(subject.id, section.name, e.target.value);
                                      } else {
                                        removeFacultyAssignment(subject.id, section.name);
                                      }
                                    }}
                                  >
                                    <option value="">-- Select Faculty --</option>
                                    {faculties.map(faculty => (
                                      <option key={faculty.id} value={faculty.id}>
                                        {faculty.name} ({faculty.employeeId})
                                      </option>
                                    ))}
                                  </select>
                                  {assignedFaculty && (
                                    <button
                                      type="button"
                                      className="btn-remove-assignment"
                                      onClick={() => 
                                        removeFacultyAssignment(subject.id, section.name)
                                      }
                                      title="Remove assignment"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [
    setupData, 
    currentSemester, 
    faculties, 
    loadingFaculties, 
    newFaculty, 
    showNewFacultyForm, 
    addingFaculty,
    assignFaculty,
    removeFacultyAssignment,
    loadFaculties
  ]);

  // Render step based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1: return BasicInfoStep;
      case 2: return AcademicStructureStep;
      case 3: return SubjectsStep;
      case 4: return FacultyAssignmentStep;
      default: return BasicInfoStep;
    }
  };

  // Validation functions
  const validateStep = useCallback((step) => {
    switch (step) {
      case 1:
        if (departmentMode === 'new') {
          return setupData.department.name && setupData.department.code && setupData.course.name;
        } else {
          return setupData.department.id && setupData.course.name;
        }
      case 2:
        return setupData.semesters.length > 0 && setupData.sections.length > 0;
      case 3:
        return setupData.subjects.length > 0;
      case 4:
        return true; // Faculty assignment is optional
      default:
        return true;
    }
  }, [setupData, departmentMode]);

  // Final submission
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Submit the complete setup data to the bulk-create endpoint with extended timeout
      const response = await api.post('/api/setup/bulk-create', {
        department: departmentMode === 'existing' ? 
          { id: setupData.department.id, name: setupData.department.name, code: setupData.department.code } :
          { name: setupData.department.name, code: setupData.department.code },
        course: setupData.course,
        semesters: setupData.semesters,
        sections: setupData.sections,
        subjects: setupData.subjects,
        assignments: setupData.assignments
      }, {
        timeout: 45000 // 45 seconds timeout for bulk creation
      });
      
      toast.success('Quick setup completed successfully!');
      
      // Navigate to appropriate dashboard based on user role
      const userRole = user?.role;
      if (userRole === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (userRole === 'PCOORD') {
        navigate('/program-coordinator-dashboard');
      } else if (userRole === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/'); // Default to home if role is unknown
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error(error.response?.data?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader dashboardTitle="Quick Setup Wizard" />
      
      <div className="quick-setup-wizard">
        <div className="wizard-container">
          {/* Step Progress Bar */}
          <div className="progress-bar">
            {SETUP_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`progress-step ${currentStep === step.id ? 'current' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                onClick={() => goToStep(step.id)}
              >
                <div className="step-number">{step.id}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="step-content">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="wizard-navigation">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </button>
            
            <div className="step-info">
              Step {currentStep} of {SETUP_STEPS.length}
            </div>
            
            {currentStep < SETUP_STEPS.length ? (
              <button 
                type="button"
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
              >
                Next
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
              >
                {loading ? 'Completing Setup...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickSetupWizard;