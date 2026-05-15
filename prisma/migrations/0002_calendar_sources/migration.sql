-- CreateTable
CREATE TABLE "CalendarSource" (
    "id" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedHref" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "remoteName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "remoteColor" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastDiscoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSource_normalizedHref_key" ON "CalendarSource"("normalizedHref");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSource_normalizedUrl_key" ON "CalendarSource"("normalizedUrl");

-- CreateIndex
CREATE INDEX "CalendarSource_isActive_sortOrder_idx" ON "CalendarSource"("isActive", "sortOrder");
