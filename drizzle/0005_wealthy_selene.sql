CREATE INDEX "idx_page_views_visitor" ON "page_views" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "idx_page_views_session" ON "page_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_page_views_viewed_at" ON "page_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "idx_page_views_page_path" ON "page_views" USING btree ("page_path");--> statement-breakpoint
CREATE INDEX "idx_page_views_country" ON "page_views" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_page_views_city" ON "page_views" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_page_views_device_type" ON "page_views" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "idx_session_visitor" ON "visitor_sessions" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "idx_session_last_active" ON "visitor_sessions" USING btree ("last_active");--> statement-breakpoint
CREATE INDEX "idx_session_started_at" ON "visitor_sessions" USING btree ("started_at");