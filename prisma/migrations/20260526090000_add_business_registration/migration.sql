-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storeId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Australia',
    "url" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "promotionMessage" VARCHAR(32) NOT NULL,
    "promotionStartDate" TIMESTAMP(3) NOT NULL,
    "promotionEndDate" TIMESTAMP(3) NOT NULL,
    "showcaseImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiImageTextEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiImageTextPrompt" TEXT,
    "membershipType" TEXT NOT NULL DEFAULT 'Silver',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_userId_key" ON "Business"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_storeId_key" ON "Business"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_url_key" ON "Business"("url");

-- CreateIndex
CREATE INDEX "Business_categoryId_idx" ON "Business"("categoryId");

-- CreateIndex
CREATE INDEX "Business_membershipType_promotionEndDate_idx" ON "Business"("membershipType", "promotionEndDate");

-- CreateIndex
CREATE INDEX "Business_status_promotionStartDate_promotionEndDate_idx" ON "Business"("status", "promotionStartDate", "promotionEndDate");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
