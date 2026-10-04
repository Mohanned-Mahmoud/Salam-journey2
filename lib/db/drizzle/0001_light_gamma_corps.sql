CREATE TABLE "purchased_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"payment_id" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "cal_booking_id" text;--> statement-breakpoint
ALTER TABLE "purchased_products" ADD CONSTRAINT "purchased_products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_products" ADD CONSTRAINT "purchased_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;