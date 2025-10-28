// rfid-attendance-system/apps/frontend/src/pages/FacultyStudentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import { useNavigate } from 'react-router-dom';
import './facultyStudentsPage.css';


// Reusable Faculty Management component
function FacultyManagement({ user, facultyMembers, facultyFormMode, setFacultyFormMode, currentFaculty, setCurrentFaculty, facultyFormData, setFacultyFormData, facultyHandlers }) {

    return (
        <>
            <div className="management-section-card">
                <h2 className="section-title">{facultyFormMode === 'create' ? 'Add New Faculty' : `Edit Faculty (ID: ${currentFaculty?.empId})`}</h2>
                <form onSubmit={facultyHandlers.handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="facultyEmail" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="facultyEmail" name="email" value={facultyFormData.email} onChange={facultyHandlers.handleFormChange} required className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    {facultyFormMode === 'create' || !facultyFormData.password ? (
                        <div>
                        <label htmlFor="facultyPassword" className="block text-sm font-medium text-gray-700">Password {facultyFormMode === 'edit' && '(Leave blank to keep current)'}</label>
                        <input type="password" id="facultyPassword" name="password" value={facultyFormData.password} onChange={facultyHandlers.handleFormChange} required={facultyFormMode === 'create'} className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    ) : null}
                    <div>
                        <label htmlFor="facultyName" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" id="facultyName" name="name" value={facultyFormData.name} onChange={facultyHandlers.handleFormChange} required className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="facultyEmpId" className="block text-sm font-medium text-gray-700">Employee ID</label>
                        <input type="text" id="facultyEmpId" name="empId" value={facultyFormData.empId} onChange={facultyHandlers.handleFormChange} required className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="facultyPhone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="text" id="facultyPhone" name="phone" value={facultyFormData.phone} onChange={facultyHandlers.handleFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>

                    {/* RFID UID field (manual input only) */}
                    <div>
                        <label htmlFor="facultyRfidUid" className="block text-sm font-medium text-gray-700">RFID UID</label>
                        <input
                            type="text"
                            id="facultyRfidUid"
                            name="rfidUid"
                            value={facultyFormData.rfidUid}
                            onChange={facultyHandlers.handleFormChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter RFID UID manually"
                        />
                    </div>

                    {/* Hidden role field - always TEACHER */}
                    <input type="hidden" name="role" value="TEACHER" />

                    <div className="md:col-span-3 flex justify-end space-x-3">
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none">
                        {facultyFormMode === 'create' ? 'Add Faculty' : 'Update Faculty'}
                        </button>
                        {facultyFormMode === 'edit' && (
                        <button type="button" onClick={() => { setFacultyFormMode('create'); setCurrentFaculty(null); setFacultyFormData({ email: '', password: '', name: '', empId: '', phone: '', rfidUid: '', role: 'TEACHER' }); }} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none">
                            Cancel Edit
                        </button>
                        )}
                    </div>
                </form>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Faculty Members</h2>
            {facultyMembers.length === 0 ? (
                <p className="text-gray-700">No faculty members registered yet.</p>
            ) : (
                <div className="overflow-x-auto management-section-card-table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th scope="col" className="management-table-th">Email</th>
                                <th scope="col" className="management-table-th">Name</th>
                                <th scope="col" className="management-table-th">Emp ID</th>
                                <th scope="col" className="management-table-th">Phone</th>
                                <th scope="col" className="management-table-th">RFID UID</th>
                                <th scope="col" className="management-table-th">Role</th>
                                <th scope="col" className="management-table-th actions-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facultyMembers.map((faculty) => (
                                <tr key={faculty.id} className="management-table-tr">
                                    <td className="management-table-td">{faculty.user.email}</td>
                                    <td className="management-table-td">{faculty.name}</td>
                                    <td className="management-table-td">{faculty.empId}</td>
                                    <td className="management-table-td">{faculty.phone}</td>
                                    <td className="management-table-td">{faculty.rfidUid}</td>
                                    <td className="management-table-td">{faculty.user.role}</td>
                                    <td className="management-table-td actions-td">
                                        <button onClick={() => facultyHandlers.handleEditClick(faculty)} className="table-action-button edit-button">Edit</button>
                                        <button onClick={() => facultyHandlers.handleDeleteClick(faculty.id)} className="table-action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// Reusable Student Management component (NEW)
function StudentManagement({ user, students, studentFormMode, setStudentFormMode, currentStudent, setCurrentStudent, studentFormData, setStudentFormData, studentHandlers, sections }) {
    // Excel import states
    const [importFile, setImportFile] = useState(null);
    const [importCourseId, setImportCourseId] = useState('');
    const [importSemesterNumber, setImportSemesterNumber] = useState('');
    const [importSectionId, setImportSectionId] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [importSections, setImportSections] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);

    // Regular form states for course/semester selection
    const [formCourseId, setFormCourseId] = useState('');
    const [formSemesterNumber, setFormSemesterNumber] = useState('');
    const [formAvailableSections, setFormAvailableSections] = useState([]);

    // Fetch courses, semesters, and sections for import and regular form
    useEffect(() => {
        const fetchImportData = async () => {
            try {
                const [coursesRes, semestersRes, sectionsRes] = await Promise.all([
                    api.get('/api/course'),
                    api.get('/api/semester'),
                    api.get('/api/section')
                ]);
                setCourses(coursesRes.data);
                setSemesters(semestersRes.data);
                setImportSections(sectionsRes.data);
            } catch (error) {
                console.error('Error fetching import data:', error);
                toast.error('Failed to load import data');
            }
        };
        
        if (studentFormMode === 'import' || studentFormMode === 'create' || studentFormMode === 'edit') {
            fetchImportData();
        }
    }, [studentFormMode]);

    // Filter sections based on selected course and semester
    useEffect(() => {
        if (importCourseId && importSemesterNumber && importSections && importSections.length > 0) {
            console.log('Filtering sections with:', { 
                importCourseId, 
                importSemesterNumber, 
                totalSections: importSections.length 
            });
            
            const filteredSections = importSections.filter(section => {
                const courseMatch = section.semester?.course?.id === importCourseId;
                const semesterMatch = section.semester?.number === parseInt(importSemesterNumber);
                
                console.log('Section:', section.name, {
                    coursId: section.semester?.course?.id,
                    semesterNumber: section.semester?.number,
                    courseMatch,
                    semesterMatch
                });
                
                return courseMatch && semesterMatch;
            });
            
            console.log('Filtered sections:', filteredSections);
            setAvailableSections(filteredSections);
        } else {
            console.log('Clearing sections - missing data:', { importCourseId, importSemesterNumber, sectionsLength: importSections?.length });
            setAvailableSections([]);
        }
    }, [importCourseId, importSemesterNumber, importSections]);

    // Filter sections for regular form based on selected course and semester
    useEffect(() => {
        if (formCourseId && formSemesterNumber && importSections && importSections.length > 0) {
            console.log('Filtering form sections with:', { 
                formCourseId, 
                formSemesterNumber, 
                totalSections: importSections.length 
            });
            
            const filteredSections = importSections.filter(section => {
                const courseMatch = section.semester?.course?.id === formCourseId;
                const semesterMatch = section.semester?.number === parseInt(formSemesterNumber);
                
                return courseMatch && semesterMatch;
            });
            
            console.log('Filtered form sections:', filteredSections);
            setFormAvailableSections(filteredSections);
        } else {
            console.log('Clearing form sections - missing data:', { formCourseId, formSemesterNumber, sectionsLength: importSections?.length });
            setFormAvailableSections([]);
        }
    }, [formCourseId, formSemesterNumber, importSections]);

    // Handle form course change
    const handleFormCourseChange = (e) => {
        const courseId = e.target.value;
        console.log('Form course changed to:', courseId);
        setFormCourseId(courseId);
        // Reset dependent fields
        setFormSemesterNumber('');
        setStudentFormData(prev => ({ ...prev, sectionId: '' }));
    };

    // Handle form semester change
    const handleFormSemesterChange = (e) => {
        const semesterNumber = e.target.value;
        console.log('Form semester changed to:', semesterNumber);
        setFormSemesterNumber(semesterNumber);
        // Reset section selection
        setStudentFormData(prev => ({ ...prev, sectionId: '' }));
    };

    // Reset form fields when switching modes or canceling
    const resetFormFields = () => {
        setFormCourseId('');
        setFormSemesterNumber('');
        setFormAvailableSections([]);
    };

    // Update form data when editing a student
    useEffect(() => {
        if (studentFormMode === 'edit' && currentStudent) {
            // Pre-populate course and semester for editing
            const studentSection = currentStudent.section;
            if (studentSection && studentSection.semester && studentSection.semester.course) {
                setFormCourseId(studentSection.semester.course.id);
                setFormSemesterNumber(studentSection.semester.number.toString());
            }
        } else if (studentFormMode === 'create') {
            resetFormFields();
        }
    }, [studentFormMode, currentStudent]);

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        
        if (!importFile || !importCourseId || !importSemesterNumber || !importSectionId) {
            toast.error('Please select a course, semester, section, and file before importing.');
            return;
        }

        // Find the selected semester ID
        const selectedSemester = semesters.find(sem => 
            sem.courseId === importCourseId && 
            sem.number === parseInt(importSemesterNumber)
        );

        if (!selectedSemester) {
            toast.error('Selected semester not found. Please try again.');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('courseId', importCourseId);
        formData.append('semesterId', selectedSemester.id);
        formData.append('sectionId', importSectionId);

        setImportLoading(true);
        try {
            const response = await api.post('/api/student/import-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data.data || response.data;
            toast.success(`Successfully imported ${data.successCount} students!`);
            
            if (data.duplicates && data.duplicates.length > 0) {
                toast.warning(`${data.duplicates.length} duplicate records skipped.`);
                console.log('Duplicates:', data.duplicates);
            }
            
            if (data.errors && data.errors.length > 0) {
                toast.warning(`${data.errors.length} rows had errors. Check console for details.`);
                console.log('Import errors:', data.errors);
            }

            // Reset form and refresh data
            setStudentFormMode('create');
            setImportFile(null);
            setImportCourseId('');
            setImportSemesterNumber('');
            setImportSectionId('');
            studentHandlers.refreshStudents(); // Refresh student list
        } catch (error) {
            console.error('Error importing students:', error);
            toast.error(error.response?.data?.message || 'Failed to import students from Excel.');
        } finally {
            setImportLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Create a simple CSV template without phone and email fields
        const csvContent = "Name,Enrollment Number,RFID UID\nJohn Doe,2023001,1234567890\nJane Smith,2023002,0987654321";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Template downloaded! Fill it with student data.');
    };

    return (
        <>
            <div className="management-section-card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="section-title">
                        {studentFormMode === 'create' && 'Add New Student'}
                        {studentFormMode === 'edit' && `Edit Student (ID: ${currentStudent?.enrollmentNo})`}
                        {studentFormMode === 'import' && 'Import Students from Excel'}
                    </h2>
                    <div className="flex gap-2">
                        {studentFormMode !== 'import' && (
                            <button
                                type="button"
                                onClick={() => setStudentFormMode('import')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none text-sm"
                            >
                                📊 Import from Excel
                            </button>
                        )}
                        {studentFormMode === 'import' && (
                            <button
                                type="button"
                                onClick={() => setStudentFormMode('create')}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none text-sm"
                            >
                                ← Back to Add Student
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={downloadTemplate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none text-sm"
                        >
                            📥 Download Template
                        </button>
                    </div>
                </div>

                {/* Regular Student Form */}
                {studentFormMode !== 'import' && (
                    <form onSubmit={studentHandlers.handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Name *</label>
                            <input type="text" id="studentName" name="name" value={studentFormData.name} onChange={studentHandlers.handleFormChange} required className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="enrollmentNo" className="block text-sm font-medium text-gray-700">Enrollment No. *</label>
                            <input type="text" id="enrollmentNo" name="enrollmentNo" value={studentFormData.enrollmentNo} onChange={studentHandlers.handleFormChange} required className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>

                        <div>
                            <label htmlFor="studentRfidUid" className="block text-sm font-medium text-gray-700">RFID UID *</label>
                            <input
                                type="text"
                                id="studentRfidUid"
                                name="rfidUid"
                                value={studentFormData.rfidUid || ''}
                                onChange={studentHandlers.handleFormChange}
                                required
                                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter RFID UID manually"
                            />
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label htmlFor="formCourse" className="block text-sm font-medium text-gray-700">Course *</label>
                            <select
                                id="formCourse"
                                value={formCourseId}
                                onChange={handleFormCourseChange}
                                required
                                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Select Course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} ({course.degreeType})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Semester Selection */}
                        <div>
                            <label htmlFor="formSemester" className="block text-sm font-medium text-gray-700">Semester *</label>
                            <select
                                id="formSemester"
                                value={formSemesterNumber}
                                onChange={handleFormSemesterChange}
                                required
                                disabled={!formCourseId}
                                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Semester</option>
                                {semesters
                                    .filter(sem => sem.courseId === formCourseId)
                                    .map(semester => (
                                        <option key={semester.id} value={semester.number}>
                                            Semester {semester.number} ({semester.type})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Section Selection */}
                        <div>
                            <label htmlFor="studentSectionId" className="block text-sm font-medium text-gray-700">Section *</label>
                            <select
                                id="studentSectionId"
                                name="sectionId"
                                value={studentFormData.sectionId || ''}
                                onChange={studentHandlers.handleFormChange}
                                required
                                disabled={!formCourseId || !formSemesterNumber}
                                className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Section</option>
                                {formAvailableSections.map(section => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-3 flex justify-end space-x-3">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none">
                                {studentFormMode === 'create' ? 'Add Student' : 'Update Student'}
                            </button>
                            {studentFormMode === 'edit' && (
                                <button 
                                    type="button" 
                                    onClick={() => { 
                                        setStudentFormMode('create'); 
                                        setCurrentStudent(null); 
                                        setStudentFormData({ name: '', enrollmentNo: '', rfidUid: '', sectionId: '' }); 
                                        resetFormFields();
                                    }} 
                                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Import Students Form */}
                {studentFormMode === 'import' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                        <form onSubmit={handleImportSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course *</label>
                                    <select
                                        value={importCourseId}
                                        onChange={(e) => {
                                            console.log('Course changed to:', e.target.value);
                                            console.log('Available semesters:', semesters);
                                            console.log('Available sections:', importSections);
                                            setImportCourseId(e.target.value);
                                            // Reset dependent fields
                                            setImportSemesterNumber('');
                                            setImportSectionId('');
                                        }}
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        required
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name} ({course.degreeType})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                                    <select
                                        value={importSemesterNumber}
                                        onChange={(e) => {
                                            console.log('Semester changed to:', e.target.value);
                                            setImportSemesterNumber(e.target.value);
                                        }}
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        required
                                        disabled={!importCourseId}
                                    >
                                        <option value="">Select Semester</option>
                                        {(() => {
                                            const filteredSemesters = semesters.filter(sem => sem.courseId === importCourseId);
                                            console.log('Available semesters for course', importCourseId, ':', filteredSemesters);
                                            return filteredSemesters.map(semester => (
                                                <option key={semester.id} value={semester.number}>
                                                    Semester {semester.number} ({semester.type})
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Section *</label>
                                    <select
                                        value={importSectionId}
                                        onChange={(e) => setImportSectionId(e.target.value)}
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        required
                                        disabled={!importCourseId || !importSemesterNumber}
                                    >
                                        <option value="">Select Section</option>
                                        {availableSections.map(section => (
                                            <option key={section.id} value={section.id}>
                                                {section.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Excel/CSV File *</label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                />
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-3 rounded">
                                    <div className="flex">
                                        <div className="ml-3">
                                            {/* <p className="text-sm text-blue-800 font-medium">Template Format Required:</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Name, Enrollment Number, RFID UID
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Download template first if you haven't already.
                                            </p> */}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStudentFormMode('create');
                                        setImportFile(null);
                                        setImportCourseId('');
                                        setImportSemesterNumber('');
                                        setImportSectionId('');
                                    }}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all font-medium"
                                    disabled={importLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    disabled={importLoading}
                                >
                                    {importLoading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Importing...
                                        </span>
                                    ) : 'Import Students'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Students</h2>
            {students.length === 0 ? (
                <p className="text-gray-700">No students registered yet.</p>
            ) : (
                <div className="overflow-x-auto management-section-card-table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th scope="col" className="management-table-th">Enrollment No.</th>
                                <th scope="col" className="management-table-th">Name</th>
                                <th scope="col" className="management-table-th">RFID UID</th>
                                <th scope="col" className="management-table-th">Section</th>
                                <th scope="col" className="management-table-th actions-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="management-table-tr">
                                    <td className="management-table-td">{student.enrollmentNo}</td>
                                    <td className="management-table-td">{student.name}</td>
                                    <td className="management-table-td">{student.rfidUid}</td>
                                    <td className="management-table-td">{student.section.name} (Sem {student.section.semester.number}, {student.section.semester.course.name})</td>
                                    <td className="management-table-td actions-td">
                                        <button onClick={() => studentHandlers.handleEditClick(student)} className="table-action-button edit-button">Edit</button>
                                        <button onClick={() => studentHandlers.handleDeleteClick(student.id)} className="table-action-button delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// --- Main FacultyStudentsPage component ---
function FacultyStudentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Faculty Management States and Handlers (moved to FacultyStudentsPage component scope)
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [facultyFormMode, setFacultyFormMode] = useState('create');
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [facultyFormData, setFacultyFormData] = useState({
    email: '', password: '', name: '', empId: '', phone: '', rfidUid: '', role: 'TEACHER',
  });

  const fetchFacultyMembers = async () => {
    try {
      const response = await api.get('/api/faculty');
      setFacultyMembers(response.data);
    } catch (error) {
      console.error('Error fetching faculty members:', error);
      toast.error(error.response?.data?.message || 'Failed to load faculty members.');
    }
  };

  const facultyHandlers = {
    handleFormChange: (e) => {
      const { name, value } = e.target;
      // Always ensure role is TEACHER, regardless of input
      setFacultyFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        role: 'TEACHER' // Force role to always be TEACHER
      }));
    },
    handleFormSubmit: async (e) => {
      e.preventDefault();
      try {
        // Ensure role is always TEACHER before submission
        const submissionData = { ...facultyFormData, role: 'TEACHER' };
        
        if (facultyFormMode === 'create') {
          if (!submissionData.password) { toast.error('Password is required for new faculty.'); return; }
          await api.post('/api/faculty', submissionData);
          toast.success('Faculty member added successfully!');
        } else {
          await api.put(`/api/faculty/${currentFaculty.id}`, submissionData);
          toast.success('Faculty member updated successfully!');
        }
        setFacultyFormMode('create');
        setCurrentFaculty(null);
        setFacultyFormData({ email: '', password: '', name: '', empId: '', phone: '', rfidUid: '', role: 'TEACHER' });
        fetchFacultyMembers();
      } catch (error) {
        console.error('Error saving faculty member:', error);
        toast.error(error.response?.data?.message || 'Failed to save faculty member.');
      }
    },
    handleEditClick: (faculty) => {
      setFacultyFormMode('edit');
      setCurrentFaculty(faculty);
      setFacultyFormData({
        email: faculty.user.email, password: '', name: faculty.name, empId: faculty.empId,
        phone: faculty.phone, rfidUid: faculty.rfidUid, role: 'TEACHER', // Always set to TEACHER
      });
    },
    handleDeleteClick: async (facultyId) => {
      if (window.confirm('Are you sure you want to delete this faculty member and their associated user account? This action cannot be undone.')) {
        try {
          await api.delete(`/api/faculty/${facultyId}`);
          toast.success('Faculty member deleted successfully!');
          fetchFacultyMembers();
        } catch (error) {
          console.error('Error deleting faculty member:', error);
          toast.error(error.response?.data?.message || 'Failed to delete faculty member.');
        }
      }
    }
  };

  // Student Management States and Handlers (NEW)
  const [students, setStudents] = useState([]);
  const [studentFormMode, setStudentFormMode] = useState('create');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '', enrollmentNo: '', rfidUid: '', sectionId: '',
  });
  const [sections, setSections] = useState([]); // For student section dropdown

  const fetchStudentsAndSections = async () => {
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        api.get('/api/student'), // Fetch all students
        api.get('/api/student/helpers/sections'), // Fetch all sections for dropdown
      ]);
      setStudents(studentsRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Error fetching students/sections:', error);
      toast.error(error.response?.data?.message || 'Failed to load student data.');
    }
  };

  const studentHandlers = {
    handleFormChange: (e) => {
      const { name, value } = e.target;
      setStudentFormData(prev => ({ ...prev, [name]: value }));
    },
    handleFormSubmit: async (e) => {
      e.preventDefault();
      try {
        if (studentFormMode === 'create') {
          await api.post('/api/student', studentFormData);
          toast.success('Student added successfully!');
        } else {
          await api.put(`/api/student/${currentStudent.id}`, studentFormData);
          toast.success('Student updated successfully!');
        }
        setStudentFormMode('create');
        setCurrentStudent(null);
        setStudentFormData({ name: '', enrollmentNo: '', rfidUid: '', sectionId: '' });
        fetchStudentsAndSections(); // Refresh student data
      } catch (error) {
        console.error('Error saving student:', error);
        toast.error(error.response?.data?.message || 'Failed to save student.');
      }
    },
    handleEditClick: (student) => {
      setStudentFormMode('edit');
      setCurrentStudent(student);
      setStudentFormData({
        name: student.name, 
        enrollmentNo: student.enrollmentNo, 
        rfidUid: student.rfidUid, 
        sectionId: student.sectionId,
      });
    },
    handleDeleteClick: async (studentId) => {
      if (window.confirm('Are you sure you want to delete this student? This might also delete associated attendance logs. This action cannot be undone.')) {
        try {
          await api.delete(`/api/student/${studentId}`);
          toast.success('Student deleted successfully!');
          fetchStudentsAndSections(); // Refresh student data
        } catch (error) {
          console.error('Error deleting student:', error);
          toast.error(error.response?.data?.message || 'Failed to delete student.');
        }
      }
    },
    refreshStudents: () => {
      fetchStudentsAndSections(); // Add refresh method for import functionality
    }
  };


  const [activeSubSection, setActiveSubSection] = useState('manageFaculty'); // 'manageFaculty', 'manageStudents'

  useEffect(() => {
    // Fetch data based on active sub-section
    if (activeSubSection === 'manageFaculty') {
        fetchFacultyMembers();
    } else if (activeSubSection === 'manageStudents') {
        fetchStudentsAndSections();
    }
  }, [activeSubSection]);

  return (
    <div className="pcoord-sub-page-container">
        <PageHeader dashboardTitle="FACULTY & STUDENTS" />
        <div className="pcoord-sub-page-main-content">
            <div className="sub-navigation-tabs mb-8">
                            <button onClick={() => navigate(-1)} className="back-button">Back to PC Dashboard</button>
                <button className={`nav-tab-button ${activeSubSection === 'manageFaculty' ? 'active' : ''}`} onClick={() => setActiveSubSection('manageFaculty')}>
                    Manage Faculty
                </button>
                <button className={`nav-tab-button ${activeSubSection === 'manageStudents' ? 'active' : ''}`} onClick={() => setActiveSubSection('manageStudents')}>
                    Manage Students
                </button>
            </div>

            {activeSubSection === 'manageFaculty' && (
                <FacultyManagement
                    user={user} // Pass user prop
                    facultyMembers={facultyMembers}
                    facultyFormMode={facultyFormMode} setFacultyFormMode={setFacultyFormMode}
                    currentFaculty={currentFaculty} setCurrentFaculty={setCurrentFaculty}
                    facultyFormData={facultyFormData} setFacultyFormData={setFacultyFormData}
                    facultyHandlers={facultyHandlers}
                />
            )}

            {activeSubSection === 'manageStudents' && (
                <StudentManagement
                    user={user}
                    students={students}
                    studentFormMode={studentFormMode} setStudentFormMode={setStudentFormMode}
                    currentStudent={currentStudent} setCurrentStudent={setCurrentStudent}
                    studentFormData={studentFormData} setStudentFormData={setStudentFormData}
                    studentHandlers={studentHandlers}
                    sections={sections} // Pass sections for dropdown
                />
            )}
        </div>
    </div>
  );
}

export default FacultyStudentsPage;