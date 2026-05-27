/*
  Warnings:

  - You are about to drop the column `image` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `background` on the `Store` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discount" DROP COLUMN "image",
ADD COLUMN     "coupon" TEXT,
ADD COLUMN     "eCatalog" TEXT[],
ADD COLUMN     "percentage" DOUBLE PRECISION,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "background",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "catalogs" TEXT[],
ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT;
