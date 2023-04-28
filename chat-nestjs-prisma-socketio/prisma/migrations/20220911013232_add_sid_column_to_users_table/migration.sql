/*
  Warnings:

  - You are about to alter the column `fid` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(28)`.
  - A unique constraint covering the columns `[sid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sid" VARCHAR(20),
ALTER COLUMN "fid" SET DATA TYPE VARCHAR(28);

-- CreateIndex
CREATE UNIQUE INDEX "users_sid_key" ON "users"("sid");
