// Test to see exactly what new Date() does on this system
console.log('=== TESTING new Date() BEHAVIOR ===');

const testDate = new Date();
console.log('new Date().toString():', testDate.toString());
console.log('new Date().toISOString():', testDate.toISOString());
console.log('new Date().getTime():', testDate.getTime());

// Let's create a date the way Prisma would
const prismaDate = new Date();
console.log('\nPrisma would store:', prismaDate);
console.log('Prisma toISOString:', prismaDate.toISOString());

// Let's test with a specific IST time
const specificIST = new Date('2025-09-24T11:54:31.599+05:30');
console.log('\nSpecific IST time: 2025-09-24T11:54:31.599+05:30');
console.log('Converted to UTC:', specificIST.toISOString());
console.log('Converted back to IST display:', specificIST.toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour12: true,
  hour: '2-digit',
  minute: '2-digit', 
  second: '2-digit'
}));