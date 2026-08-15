const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const transactions = await prisma.borrowTransaction.findMany();
  
  if (transactions.length > 0) {
    const headers = ['id', 'borrowerId', 'borrowDate', 'dueDate', 'returnedDate', 'notes', 'conditionImageUrl', 'adminId', 'createdAt', 'updatedAt'];
    let csv = headers.join(',') + '\n';
    
    for (const t of transactions) {
      csv += `${t.id},${t.borrowerId},${t.borrowDate.toISOString()},${t.dueDate.toISOString()},${t.returnedDate ? t.returnedDate.toISOString() : ''},"${t.notes || ''}","${t.conditionImageUrl || ''}",${t.adminId},${t.createdAt.toISOString()},${t.updatedAt.toISOString()}\n`;
    }
    fs.writeFileSync('transactions_export.csv', csv);
    console.log(`Exported ${transactions.length} transactions to transactions_export.csv`);
  }

  const items = await prisma.borrowItem.findMany();
  if (items.length > 0) {
    const itemHeaders = ['id', 'transactionId', 'equipmentId', 'returnedAt'];
    let itemCsv = itemHeaders.join(',') + '\n';
    
    for (const item of items) {
      itemCsv += `${item.id},${item.transactionId},${item.equipmentId},${item.returnedAt ? item.returnedAt.toISOString() : ''}\n`;
    }
    fs.writeFileSync('items_export.csv', itemCsv);
    console.log(`Exported ${items.length} items to items_export.csv`);
  }
}

exportData().catch(console.error).finally(() => prisma.$disconnect());
