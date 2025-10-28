import { toZonedTime } from 'date-fns-tz';

// Test IST timezone handling
console.log('=== IST Timezone Test ===');

// Current time
const now = new Date();
console.log('UTC Time:', now.toISOString());

// IST time using date-fns-tz (same as backend)
const istTime = toZonedTime(now, 'Asia/Kolkata');
console.log('IST Time (date-fns-tz):', istTime.toISOString());

// Manual IST conversion (frontend style)
const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
const manualIst = new Date(now.getTime() + istOffset);
console.log('Manual IST:', manualIst.toISOString());

// Format using frontend utility style
const formatTimeInIST = (dateString) => {
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

console.log('\n=== Display Format Test ===');
console.log('UTC timestamp formatted as IST:', formatTimeInIST(now));
console.log('IST timestamp formatted as IST:', formatTimeInIST(istTime));

// Test with a sample timestamp
const sampleTimestamp = '2025-09-23T10:30:00.000Z'; // UTC
console.log('\n=== Sample Timestamp Test ===');
console.log('Sample UTC timestamp:', sampleTimestamp);
console.log('Displayed as:', formatTimeInIST(sampleTimestamp));