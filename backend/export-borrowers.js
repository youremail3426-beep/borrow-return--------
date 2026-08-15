const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const borrowers = await prisma.borrower.findMany();
  
  if (borrowers.length === 0) {
    console.log("No borrowers found.");
    return;
  }

  const headers = ['id', 'studentId', 'name', 'email', 'yearLevel', 'department', 'faculty', 'phoneNumber', 'createdAt', 'updatedAt'];
  let csv = headers.join(',') + '\n';
  
  for (const b of borrowers) {
    csv += `${b.id},${b.studentId},"${b.name}","${b.email}",${b.yearLevel || ''},${b.department || ''},${b.faculty || ''},${b.phoneNumber || ''},${b.createdAt.toISOString()},${b.updatedAt.toISOString()}\n`;
  }
  
  fs.writeFileSync('borrowers_export.csv', csv);
  console.log(`Exported ${borrowers.length} borrowers to borrowers_export.csv`);
}

exportData().catch(console.error).finally(() => prisma.$disconnect());
