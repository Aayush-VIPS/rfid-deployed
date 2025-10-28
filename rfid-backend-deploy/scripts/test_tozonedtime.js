// Test what toZonedTime produces
import { toZonedTime } from 'date-fns-tz';

const currentTime = new Date();
const zonedTime = toZonedTime(currentTime, 'Asia/Kolkata');

console.log('=== TESTING toZonedTime ===');
console.log('Original new Date():', currentTime.toString());
console.log('Original toISOString():', currentTime.toISOString());
console.log('toZonedTime result:', zonedTime);
console.log('toZonedTime toString():', zonedTime.toString());
console.log('toZonedTime toISOString():', zonedTime.toISOString());

console.log('\n=== ANALYSIS ===');
console.log('This might be the source of the problem!');