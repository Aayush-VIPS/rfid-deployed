// Check system timezone
const now = new Date();
console.log('System timezone offset (minutes):', now.getTimezoneOffset());
console.log('Raw new Date():', now.toISOString());
console.log('Local time string:', now.toString());
console.log('UTC time string:', now.toUTCString());

// What IST should look like in UTC
const istTime = new Date('2025-09-24T11:54:00+05:30');
console.log('IST 11:54 converted to UTC:', istTime.toISOString());

// What we should store for current IST time
const currentIST = new Date();
console.log('Current local time (should be IST):', currentIST.toString());
console.log('Current as ISO (this is what we store - WRONG):', currentIST.toISOString());

// Correct way - convert IST to UTC
const currentISTCorrect = new Date(currentIST.getTime() - (5.5 * 60 * 60 * 1000));
console.log('Corrected UTC for storage:', currentISTCorrect.toISOString());