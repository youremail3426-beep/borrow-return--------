/*
  Warnings:

  - You are about to drop the column `borrowerEmail` on the `BorrowTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerName` on the `BorrowTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerEmail` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerName` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `borrowerId` to the `BorrowTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `borrowerId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Borrower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "yearLevel" TEXT,
    "department" TEXT,
    "faculty" TEXT,
    "phoneNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BorrowTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "borrowerId" TEXT NOT NULL,
    "borrowDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "returnedDate" DATETIME,
    "notes" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BorrowTransaction_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowTransaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowTransaction" ("adminId", "borrowDate", "createdAt", "dueDate", "id", "notes", "returnedDate", "updatedAt") SELECT "adminId", "borrowDate", "createdAt", "dueDate", "id", "notes", "returnedDate", "updatedAt" FROM "BorrowTransaction";
DROP TABLE "BorrowTransaction";
ALTER TABLE "new_BorrowTransaction" RENAME TO "BorrowTransaction";
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "borrowerId" TEXT NOT NULL,
    "borrowDate" DATETIME NOT NULL,
    "returnDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("borrowDate", "createdAt", "id", "returnDate", "status", "updatedAt") SELECT "borrowDate", "createdAt", "id", "returnDate", "status", "updatedAt" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_studentId_key" ON "Borrower"("studentId");
