// Test the new IST timestamp logic
console.log('=== IST Timestamp Test ===');

const now = new Date();
console.log('Current UTC time:', now.toISOString());

// New IST logic (backend)
const istTimestamp = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
console.log('IST timestamp (stored):', istTimestamp.toISOString());

// Frontend display logic
const formatTimeInIST = (dateString) => {
  const date = new Date(dateString);
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-IN', options);
};

console.log('\n=== Display Test ===');
console.log('IST timestamp displayed as:', formatTimeInIST(istTimestamp));

// Compare with actual IST time
console.log('Current IST time should be:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('Our IST timestamp shows:', istTimestamp.toLocaleString('en-IN'));