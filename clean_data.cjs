const fs = require('fs');

// Read the file
const data = JSON.parse(fs.readFileSync('data-store.json', 'utf8'));

// Remove admin_1 user
data.users = data.users.filter(u => u.id !== 'admin_1');

// Remove admin_1 password
delete data.passwords['admin_1'];

// Remove all courses, enrollments, sessions related to admin_1
data.courses = data.courses.filter(c => c.teacherId !== 'admin_1');
data.enrollments = data.enrollments.filter(e => e.studentId !== 'admin_1');
data.sessions = data.sessions.filter(s => s.teacherId !== 'admin_1');

// Remove notifications for admin_1
data.notifications = data.notifications.filter(n => n.userId !== 'admin_1');

// Remove audit logs for admin_1
data.auditLogs = data.auditLogs.filter(a => a.userId !== 'admin_1');

// Write back
fs.writeFileSync('data-store.json', JSON.stringify(data, null, 2));

console.log('Data cleaned successfully');
