// Let's simulate what happens during a real scan
const currentTime = new Date();

console.log('=== SIMULATING CURRENT SCAN ===');
console.log('Current IST time:', currentTime.toString());
console.log('What will be stored in DB:', currentTime.toISOString());

const storedTimestamp = currentTime.toISOString();
const displayTime = new Date(storedTimestamp).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour12: true,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

console.log('What frontend will display:', displayTime);

console.log('\n=== ANALYSIS ===');
console.log('This should be CORRECT now!');