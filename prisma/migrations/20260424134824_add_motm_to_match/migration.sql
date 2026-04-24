-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_motmPlayerId_fkey" FOREIGN KEY ("motmPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
