// Simulate what happens when a scan occurs RIGHT NOW
console.log('=== Simulating LIVE Scan Timestamp ===');

// What the backend does when processing RFID scan
const currentUTC = new Date();
console.log('1. Backend stores (UTC):', currentUTC.toISOString());

// What the frontend should display
const displayIST = currentUTC.toLocaleTimeString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit', 
  second: '2-digit',
  hour12: true
});

console.log('2. Frontend displays (IST):', displayIST);

// What current IST time actually is
const actualIST = new Date().toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  hour12: true
});

console.log('3. Actual current IST time:', actualIST);

console.log('\n=== Analysis ===');
console.log('If you scan RIGHT NOW, it should store:', currentUTC.toISOString());
console.log('And display:', displayIST);
console.log('Which should match current IST time:', actualIST);

// Let's also check if there might be a server time issue
const serverTime = new Date();
console.log('\n=== Server Time Check ===');
console.log('Server UTC time:', serverTime.toUTCString());
console.log('Server local time:', serverTime.toString());
console.log('Server IST interpretation:', serverTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));