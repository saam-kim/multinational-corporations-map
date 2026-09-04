export { classroomDb } from './firebase-admin';
export { cleanText } from './classroom';
export function jsonError(message: string, status = 400) { return Response.json({error: message}, {status}); }
