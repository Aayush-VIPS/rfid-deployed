import pandas as pd

# Read the attendance Excel file
df = pd.read_excel('c:/Users/ogita/OneDrive/Desktop/rfid_website_new/attendance_session_report_68d25d7524e8bafaf12e6b04.xlsx')

# Print column names
print("\nColumns in the file:")
print(df.columns.tolist())

# Print the first few rows
print("\nFirst few rows:")
print(df.head())

# Count number of present students
if 'Status' in df.columns:
    present_count = df[df['Status'] == 'PRESENT'].shape[0]
    print(f"\nNumber of students marked PRESENT: {present_count}")
    
    print("\nStudents marked as PRESENT:")
    present_students = df[df['Status'] == 'PRESENT']
    for _, row in present_students.iterrows():
        print(f"{row['Enrollment No.']} - {row['Student Name']}")