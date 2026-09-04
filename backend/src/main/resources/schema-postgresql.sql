DO $$
DECLARE
    sent_at_type text;
    notification_type_check text;
BEGIN
    SELECT data_type
    INTO sent_at_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'notifications'
      AND column_name = 'sent_at';

    IF sent_at_type = 'boolean' THEN
        ALTER TABLE notifications
            ADD COLUMN IF NOT EXISTS sent_at_tmp timestamp(6) without time zone;

        UPDATE notifications
        SET sent_at_tmp = CASE
            WHEN sent_at IS TRUE THEN COALESCE(created_at, CURRENT_TIMESTAMP)::timestamp(6)
            ELSE NULL
        END
        WHERE sent_at_tmp IS NULL;

        ALTER TABLE notifications
            DROP COLUMN sent_at;

        ALTER TABLE notifications
            RENAME COLUMN sent_at_tmp TO sent_at;
    END IF;

    SELECT pg_get_constraintdef(c.oid)
    INTO notification_type_check
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'notifications'
      AND n.nspname = current_schema()
      AND c.conname = 'notifications_notification_type_check';

    IF notification_type_check LIKE '%IN_APP%' AND notification_type_check LIKE '%EMAIL%' AND notification_type_check LIKE '%SMS%' THEN
        ALTER TABLE notifications
            DROP CONSTRAINT notifications_notification_type_check;
    END IF;
END $$@@

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    response TEXT,
    responded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP(6)
)@@

DO $$
BEGIN
    IF to_regclass(format('%I.%I', current_schema(), 'applications')) IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE t.relname = 'applications'
              AND n.nspname = current_schema()
              AND c.conname = 'applications_status_check'
        ) THEN
            ALTER TABLE applications
                DROP CONSTRAINT applications_status_check;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE t.relname = 'applications'
              AND n.nspname = current_schema()
              AND c.conname = 'applications_status_check'
        ) THEN
            ALTER TABLE applications
                ADD CONSTRAINT applications_status_check CHECK (
                    status IN (
                        'DRAFT',
                        'PENDING_EVALUATION',
                        'SUBMITTED',
                        'UNDER_REVIEW',
                        'PRESELECTED',
                        'INTERVIEW_PENDING',
                        'ACCEPTED',
                        'REJECTED',
                        'WITHDRAWN'
                    )
                );
        END IF;
    END IF;
END $$@@
