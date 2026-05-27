/*
  Warnings:

  - A unique constraint covering the columns `[storeId,title]` on the table `Discount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `Store` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Discount_storeId_title_key" ON "Discount"("storeId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Store_url_key" ON "Store"("url");
