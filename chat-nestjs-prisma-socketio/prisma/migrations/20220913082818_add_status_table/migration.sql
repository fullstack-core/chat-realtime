/*
  Warnings:

  - You are about to drop the column `createdAt` on the `private_messages` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `private_messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `private_messages` table. All the data in the column will be lost.
  - Added the required column `receiver_id` to the `private_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `private_messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "private_messages" DROP CONSTRAINT "private_messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "private_messages" DROP CONSTRAINT "private_messages_senderId_fkey";

-- AlterTable
ALTER TABLE "private_messages" DROP COLUMN "createdAt",
DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receiver_id" INTEGER NOT NULL,
ADD COLUMN     "sender_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status_id" INTEGER;

-- CreateTable
CREATE TABLE "active status" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(16) NOT NULL,

    CONSTRAINT "active status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "active status_name_key" ON "active status"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "active status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
