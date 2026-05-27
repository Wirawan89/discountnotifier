-- CreateTable
CREATE TABLE "CategoryFetchLog" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshPeriodDays" INTEGER NOT NULL DEFAULT 3,
    "storesFetched" INTEGER NOT NULL DEFAULT 0,
    "discountsFetched" INTEGER NOT NULL DEFAULT 0,
    "fetchStatus" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryFetchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFetchLog_categoryId_key" ON "CategoryFetchLog"("categoryId");

-- AddForeignKey
ALTER TABLE "CategoryFetchLog" ADD CONSTRAINT "CategoryFetchLog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
