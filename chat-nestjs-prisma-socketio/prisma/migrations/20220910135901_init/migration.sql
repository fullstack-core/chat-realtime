-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fid" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_relationships" (
    "inviter_id" INTEGER NOT NULL,
    "acceptor_id" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_fid_key" ON "users"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "friend_relationships_inviter_id_acceptor_id_key" ON "friend_relationships"("inviter_id", "acceptor_id");

-- AddForeignKey
ALTER TABLE "friend_relationships" ADD CONSTRAINT "friend_relationships_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_relationships" ADD CONSTRAINT "friend_relationships_acceptor_id_fkey" FOREIGN KEY ("acceptor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
