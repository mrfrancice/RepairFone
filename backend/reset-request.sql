-- Reset la demande et ses devis pour permettre un nouveau test
UPDATE repair_requests 
SET status = 'pending', repairer_id = NULL, accepted_at = NULL, final_price = NULL
WHERE id = '3d832536-42c1-4d44-afe5-78e31db4d88d';

UPDATE quotes 
SET status = 'pending', accepted_at = NULL, rejected_at = NULL, rejection_reason = NULL
WHERE request_id = '3d832536-42c1-4d44-afe5-78e31db4d88d';

SELECT 'Reset complete' as result;
