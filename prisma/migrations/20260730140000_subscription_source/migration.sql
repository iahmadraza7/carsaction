-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('STRIPE', 'MANUAL');

-- AlterTable
ALTER TABLE "DealerProfile" ADD COLUMN "subscriptionSource" "SubscriptionSource" NOT NULL DEFAULT 'STRIPE';
