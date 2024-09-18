/*
  Warnings:

  - A unique constraint covering the columns `[sentUserId,receivedUserId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Request_sentUserId_receivedUserId_key" ON "Request"("sentUserId", "receivedUserId");
