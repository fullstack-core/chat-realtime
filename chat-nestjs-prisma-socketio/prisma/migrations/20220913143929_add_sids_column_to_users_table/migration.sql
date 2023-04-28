-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sids" TEXT[] DEFAULT ARRAY[]::TEXT[];
