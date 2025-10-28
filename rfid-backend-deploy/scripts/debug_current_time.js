// Debug the current timestamp issue
console.log('=== Current Time Debug ===');

const now = new Date();
console.log('Current UTC time:', now.toISOString());
console.log('Current local time:', now.toString());

// What should be the IST time right now
const currentIST = now.toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  hour: '2-digit', 
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric'
});
console.log('Current IST time should be:', currentIST);

// Test the frontend formatting function
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

console.log('UTC timestamp formatted as IST:', formatTimeInIST(now));

// If the scan showed 04:53:11 pm, what UTC time would that be?
// 04:53 PM IST = 11:23 AM UTC (IST is UTC + 5:30)
const scanTime = '2025-09-24T11:23:11.000Z'; // 11:23 AM UTC
console.log('\n=== Expected Scan Time ===');
console.log('If scan was at 11:23 AM UTC:', scanTime);
console.log('Should display as IST:', formatTimeInIST(scanTime));

// Test with the time shown in screenshot (4:53 PM)
const screenshotTime = '2025-09-24T16:53:11.000Z'; // 4:53 PM UTC 
console.log('\n=== Screenshot Time Analysis ===');
console.log('If stored as 4:53 PM UTC:', screenshotTime);
console.log('Would display as IST:', formatTimeInIST(screenshotTime));