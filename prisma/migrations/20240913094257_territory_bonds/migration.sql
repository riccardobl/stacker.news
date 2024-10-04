-- CreateEnum
CREATE TYPE "BondStatus" AS ENUM ('active', 'reclaimed', 'forfeited');

-- AlterTable
ALTER TABLE "Sub" ADD COLUMN     "bondCostSats" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "bondDurationDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "requireBondToPost" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SubBond" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subName" CITEXT NOT NULL,
    "bondCostSats" INTEGER NOT NULL,
    "bondDurationDays" INTEGER NOT NULL DEFAULT 30,
    "bondStatus" "BondStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forfeited_at" TIMESTAMP(3),

    CONSTRAINT "SubBond_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubBond" ADD CONSTRAINT "SubBond_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubBond" ADD CONSTRAINT "SubBond_subName_fkey" FOREIGN KEY ("subName") REFERENCES "Sub"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- Count forfeited bonds in reward pool
CREATE OR REPLACE FUNCTION rewards(min TIMESTAMP(3), max TIMESTAMP(3), ival INTERVAL, date_part TEXT)
RETURNS TABLE (
    t TIMESTAMP(3), total BIGINT, donations BIGINT, fees BIGINT, boost BIGINT, jobs BIGINT, anons_stack BIGINT, forfeited_bonds BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
BEGIN
    RETURN QUERY
    SELECT period.t,
        coalesce(FLOOR(sum(msats)), 0)::BIGINT as total,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type = 'DONATION')), 0)::BIGINT as donations,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type NOT IN ('BOOST', 'STREAM', 'DONATION', 'ANON'))), 0)::BIGINT as fees,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type = 'BOOST')), 0)::BIGINT as boost,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type = 'STREAM')), 0)::BIGINT as jobs,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type = 'ANON')), 0)::BIGINT as anons_stack,
        coalesce(FLOOR(sum(msats) FILTER(WHERE type = 'FORFEITED_BOND')), 0)::BIGINT as forfeited_bonds
    FROM generate_series(min, max, ival) period(t),
    LATERAL
    (
        (SELECT
            ("ItemAct".msats - COALESCE("ReferralAct".msats, 0)) * COALESCE("Sub"."rewardsPct", 100) * 0.01  as msats,
            act::text as type
          FROM "ItemAct"
          JOIN "Item" ON "Item"."id" = "ItemAct"."itemId"
          LEFT JOIN "Sub" ON "Sub"."name" = "Item"."subName"
          LEFT JOIN "ReferralAct" ON "ReferralAct"."itemActId" = "ItemAct".id
          WHERE date_trunc(date_part, "ItemAct".created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = period.t
            AND "ItemAct".act <> 'TIP'
            AND ("ItemAct"."invoiceActionState" IS NULL OR "ItemAct"."invoiceActionState" = 'PAID'))
          UNION ALL
        (SELECT sats * 1000 as msats, 'DONATION' as type
          FROM "Donation"
          WHERE date_trunc(date_part, "Donation".created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = period.t)
          UNION ALL
        -- any earnings from anon's stack that are not forwarded to other users
        (SELECT "ItemAct".msats, 'ANON' as type
          FROM "Item"
          JOIN "ItemAct" ON "ItemAct"."itemId" = "Item".id
          LEFT JOIN "ItemForward" ON "ItemForward"."itemId" = "Item".id
          WHERE "Item"."userId" = 27 AND "ItemAct".act = 'TIP'
          AND date_trunc(date_part, "ItemAct".created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = period.t
          AND ("ItemAct"."invoiceActionState" IS NULL OR "ItemAct"."invoiceActionState" = 'PAID')
          GROUP BY "ItemAct".id, "ItemAct".msats
          HAVING COUNT("ItemForward".id) = 0)
          UNION ALL
        -- all forfeited bonds
        (SELECT "bondCostSats" * 1000 as msats, 'FORFEITED_BOND' as type
          FROM "SubBond"
          WHERE date_trunc(date_part, "SubBond"."forfeited_at" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = period.t
          AND "SubBond"."bondStatus" = 'forfeited')
    ) x
    GROUP BY period.t;
END;
$$;