/*
  Warnings:

  - You are about to drop the `DocumentKnowledge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DocumentKnowledge";

-- CreateTable
CREATE TABLE "KnowledgeContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeQuestion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "embeddingOpenAI" vector(1536),
    "embeddingLocal" vector(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAnswer" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeContent_category_idx" ON "KnowledgeContent"("category");

-- CreateIndex
CREATE INDEX "KnowledgeQuestion_contentId_idx" ON "KnowledgeQuestion"("contentId");

-- CreateIndex
CREATE INDEX "KnowledgeAnswer_contentId_idx" ON "KnowledgeAnswer"("contentId");

-- AddForeignKey
ALTER TABLE "KnowledgeQuestion" ADD CONSTRAINT "KnowledgeQuestion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "KnowledgeContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswer" ADD CONSTRAINT "KnowledgeAnswer_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "KnowledgeContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
