// Let's be very clear about what's happening
console.log('=== TIMEZONE ANALYSIS ===');

const now = new Date();
console.log('1. Current system time (IST):', now.toString());
console.log('2. Current UTC time:', now.toUTCString());
console.log('3. Current as ISO string:', now.toISOString());

console.log('\n=== WHAT HAPPENED DURING SCAN ===');
console.log('When Aayush scanned at 11:54 AM IST:');
console.log('- System time was: Wed Sep 24 2025 11:54:XX GMT+0530');
console.log('- We stored in DB: 2025-09-24T11:54:31.599Z');
console.log('- This means we stored IST time AS IF IT WERE UTC');

console.log('\n=== WHAT SHOULD HAVE HAPPENED ===');
const scanTimeIST = new Date('2025-09-24T11:54:31+05:30');
console.log('- IST scan time properly formatted:', scanTimeIST.toISOString());
console.log('- This converts to UTC as:', scanTimeIST.toISOString());

console.log('\n=== VERIFICATION ===');
console.log('Current IST time: ~11:58 AM');
console.log('Current UTC time should be: ~6:28 AM');
console.log('Actual new Date().toISOString():', new Date().toISOString());

const storedTime = new Date('2025-09-24T11:54:31.599Z');
const istDisplay = storedTime.toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour12: true,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
console.log('\nStored timestamp converted to IST display:', istDisplay);