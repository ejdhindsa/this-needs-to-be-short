CREATE TABLE "clicks" (
	"click_id" uuid PRIMARY KEY NOT NULL,
	"link_id" uuid NOT NULL,
	"referrer" varchar,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link" (
	"sid" uuid PRIMARY KEY NOT NULL,
	"short_code" varchar(32) NOT NULL,
	"original_url" varchar(2048) NOT NULL,
	"link_type" varchar DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "link_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_link_sid_fk" FOREIGN KEY ("link_id") REFERENCES "public"."link"("sid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_idx" ON "clicks" USING btree ("link_id");