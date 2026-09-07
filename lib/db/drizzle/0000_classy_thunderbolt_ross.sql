CREATE TYPE "public"."booking_kind" AS ENUM('single', 'package');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."course_category" AS ENUM('course', 'workshop', 'free');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('pdf', 'printable', 'guide', 'other');--> statement-breakpoint
CREATE TYPE "public"."testimonial_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"admin_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"embedding" vector(3072)
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"coach_id" uuid NOT NULL,
	"booking_kind" "booking_kind" DEFAULT 'single' NOT NULL,
	"date" date NOT NULL,
	"slot" varchar(50),
	"session_type" varchar(100),
	"package_sessions_total" integer,
	"package_sessions_remaining" integer,
	"topic" text,
	"notes" text,
	"guest_name" varchar(255),
	"guest_email" varchar(255),
	"guest_whatsapp" varchar(20),
	"status" "booking_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"bio" text,
	"google_refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coaches_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" text NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_scheduled_slot_unique" UNIQUE("scheduled_date","scheduled_time")
);
--> statement-breakpoint
CREATE TABLE "course_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"room_name" varchar(255) NOT NULL,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"title_ar" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"desc_ar" text,
	"desc_en" text,
	"category" "course_category" NOT NULL,
	"price" numeric(10, 2),
	"duration" integer,
	"duration_unit" varchar(50),
	"students" varchar(50),
	"image_url" varchar(1024),
	"status" "course_status" DEFAULT 'active',
	"gradient" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"room_id" uuid,
	"progress" integer DEFAULT 0,
	"enrolled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnel_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'الصفحة التسويقية' NOT NULL,
	"slug" text DEFAULT 'main' NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "funnel_page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "funnel_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ar" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"desc_ar" text,
	"desc_en" text,
	"price" numeric(10, 2),
	"is_free" boolean DEFAULT false,
	"type" "product_type" NOT NULL,
	"download_url" varchar(500),
	"status" "product_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" varchar(255),
	"name_en" varchar(255),
	"role_ar" varchar(255),
	"role_en" varchar(255),
	"quote_ar" text NOT NULL,
	"quote_en" text,
	"rating" integer,
	"status" "testimonial_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text_hash" varchar(64) NOT NULL,
	"source_text" text NOT NULL,
	"translated_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "translations_text_hash_unique" UNIQUE("text_hash")
);
--> statement-breakpoint
CREATE TABLE "giveaway_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_lead_id_giveaway_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."giveaway_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_rooms" ADD CONSTRAINT "course_rooms_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_room_id_course_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."course_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_registrations" ADD CONSTRAINT "funnel_registrations_page_id_funnel_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."funnel_page"("id") ON DELETE no action ON UPDATE no action;