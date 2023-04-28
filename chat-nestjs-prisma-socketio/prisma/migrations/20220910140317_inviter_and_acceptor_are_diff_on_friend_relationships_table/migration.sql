-- This is an empty migration.
ALTER TABLE "friend_relationships" ADD CONSTRAINT "inviter_and_accepter_are_diff" CHECK (inviter_id <> acceptor_id);
