// Test the corrected UTC + IST display logic
console.log('=== Corrected IST Display Logic Test ===');

const now = new Date();
console.log('Current UTC timestamp (will be stored):', now.toISOString());

// Corrected frontend formatting (with timeZone: 'Asia/Kolkata')
const formatTimeInIST_Corrected = (dateString) => {
  const date = new Date(dateString);
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-IN', options);
};

console.log('UTC timestamp displayed as IST:', formatTimeInIST_Corrected(now));
console.log('Expected IST time:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Test with a specific UTC timestamp
const testUTC = '2025-09-24T10:30:00.000Z'; // 10:30 AM UTC
console.log('\n=== Specific Test ===');
console.log('Test UTC timestamp:', testUTC);
console.log('Should display as 4:00 PM IST:', formatTimeInIST_Corrected(testUTC));

// Test current time conversion
const currentIST = new Date().toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
});
console.log('\n=== Current Time Check ===');
console.log('Current IST time:', currentIST);
console.log('Our function shows:', formatTimeInIST_Corrected(now));