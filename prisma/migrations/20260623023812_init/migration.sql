-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkRecordType" AS ENUM ('contact', 'completed');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('contact_review', 'work_review');

-- CreateEnum
CREATE TYPE "ContactEventSource" AS ENUM ('profile', 'qr_scan', 'search');

-- CreateEnum
CREATE TYPE "WhatsappMessageType" AS ENUM ('review_request', 'work_confirmation');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed', 'resolved');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_verified_at" TIMESTAMP(3),
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "contact_phone" TEXT,
    "contact_phone_verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "qr_code_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER,

    CONSTRAINT "trade_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_trades" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "years_experience" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "georef_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "georef_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localities" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "georef_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),

    CONSTRAINT "localities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_coverage_areas" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_coverage_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_records" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "type" "WorkRecordType" NOT NULL,
    "initiated_by_professional_at" TIMESTAMP(3),
    "client_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "work_record_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewed_professional_id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "type" "ReviewType" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "submitted_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_ratings" (
    "id" TEXT NOT NULL,
    "work_record_id" TEXT NOT NULL,
    "rated_by_professional_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_events" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "source" "ContactEventSource",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_photos" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "trade_id" TEXT,
    "work_record_id" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "work_record_id" TEXT,
    "type" "WhatsappMessageType",
    "status" "WhatsappMessageStatus",
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT NOT NULL,
    "reported_professional_id" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_user_id_key" ON "professional_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trades_slug_key" ON "trades"("slug");

-- CreateIndex
CREATE INDEX "professional_trades_trade_id_idx" ON "professional_trades"("trade_id");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_georef_id_key" ON "provinces"("georef_id");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_slug_key" ON "provinces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "departments_georef_id_key" ON "departments"("georef_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "localities_georef_id_key" ON "localities"("georef_id");

-- CreateIndex
CREATE UNIQUE INDEX "localities_slug_key" ON "localities"("slug");

-- CreateIndex
CREATE INDEX "professional_coverage_areas_department_id_idx" ON "professional_coverage_areas"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_coverage_areas_professional_id_department_id_key" ON "professional_coverage_areas"("professional_id", "department_id");

-- CreateIndex
CREATE INDEX "reviews_reviewed_professional_id_idx" ON "reviews"("reviewed_professional_id");

-- CreateIndex
CREATE INDEX "reviews_published_at_idx" ON "reviews"("published_at");

-- CreateIndex
CREATE INDEX "reviews_trade_id_idx" ON "reviews"("trade_id");

-- CreateIndex
CREATE INDEX "contact_events_professional_id_idx" ON "contact_events"("professional_id");

-- CreateIndex
CREATE INDEX "contact_events_created_at_idx" ON "contact_events"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "trade_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_trades" ADD CONSTRAINT "professional_trades_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_trades" ADD CONSTRAINT "professional_trades_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localities" ADD CONSTRAINT "localities_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_coverage_areas" ADD CONSTRAINT "professional_coverage_areas_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_coverage_areas" ADD CONSTRAINT "professional_coverage_areas_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_records" ADD CONSTRAINT "work_records_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "work_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_professional_id_fkey" FOREIGN KEY ("reviewed_professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "work_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_rated_by_professional_id_fkey" FOREIGN KEY ("rated_by_professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_photos" ADD CONSTRAINT "work_photos_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_photos" ADD CONSTRAINT "work_photos_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_photos" ADD CONSTRAINT "work_photos_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "work_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "work_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_professional_id_fkey" FOREIGN KEY ("reported_professional_id") REFERENCES "professional_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Constraints manuales documentadas en schema.prisma (no expresables en el DSL de Prisma)

-- Un solo oficio primario por profesional
CREATE UNIQUE INDEX "professional_trades_professional_id_is_primary_key" ON "professional_trades"("professional_id") WHERE "is_primary" = true;

-- CHECK (rating BETWEEN 1 AND 5)
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_rating_check" CHECK ("rating" BETWEEN 1 AND 5);

