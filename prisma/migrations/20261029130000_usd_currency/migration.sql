-- All prices on Qualify are in US dollars
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'usd';
UPDATE "Order" SET "currency" = 'usd' WHERE "currency" <> 'usd';
