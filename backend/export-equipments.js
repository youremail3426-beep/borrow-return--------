const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const equipments = await prisma.equipment.findMany();
  
  // Format as CSV
  if (equipments.length === 0) {
    console.log("No equipment found in the database.");
    return;
  }

  const headers = ['id', 'name', 'serialNumber', 'imageUrl', 'status', 'createdAt', 'updatedAt'];
  let csv = headers.join(',') + '\n';
  
  for (const eq of equipments) {
    csv += `${eq.id},"${eq.name}",${eq.serialNumber},${eq.imageUrl || ''},${eq.status},${eq.createdAt.toISOString()},${eq.updatedAt.toISOString()}\n`;
  }
  
  fs.writeFileSync('equipments_export.csv', csv);
  console.log(`Exported ${equipments.length} equipments to equipments_export.csv`);
}

exportData().catch(console.error).finally(() => prisma.$disconnect());
