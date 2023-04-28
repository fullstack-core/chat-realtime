/*
  Warnings:

  - You are about to drop the column `sid` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_sid_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "sid",
ADD COLUMN     "sids" JSONB NOT NULL DEFAULT '[]';
