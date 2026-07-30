-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "owners" INTEGER;

-- CreateTable
CREATE TABLE "DealerContact" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DealerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerContact_dealerId_idx" ON "DealerContact"("dealerId");

-- AddForeignKey
ALTER TABLE "DealerContact" ADD CONSTRAINT "DealerContact_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "DealerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
