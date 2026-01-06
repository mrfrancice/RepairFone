# Business Logic Fixes - Validation Checklist

## Overview
This document provides test scenarios to validate the business logic fixes for BIZ-003 and BIZ-004.

---

## BIZ-003: Quote Creation & Acceptance Flow

### Scenario 1: Quote Creation (Repairer)
**Endpoint:** `POST /quotes`

**Test Steps:**
1. Create a repair request (status: PENDING)
2. Repairer creates a quote for the request

**Expected Results:**
- Quote is created with status: PENDING
- Quote.totalAmount is calculated correctly
- Request.status remains PENDING (NOT auto-accepted)
- Request.estimatedPrice is set to quote.totalAmount
- Response: Quote object with PENDING status

**SQL Verification:**
```sql
SELECT status, estimated_price, final_price, accepted_at
FROM repair_requests
WHERE id = '<request_id>';

-- Expected:
-- status: 'pending'
-- estimated_price: <quote_total>
-- final_price: NULL
-- accepted_at: NULL
```

---

### Scenario 2: Quote Acceptance (Client)
**Endpoint:** `POST /quotes/:id/accept`

**Test Steps:**
1. Client accepts a PENDING quote

**Expected Results:**
- Quote.status changes to ACCEPTED
- Quote.acceptedAt is set to current timestamp
- Request.status changes to ACCEPTED
- Request.acceptedAt is set to current timestamp
- Request.finalPrice is set to quote.totalAmount

**SQL Verification:**
```sql
SELECT q.status as quote_status, q.accepted_at as quote_accepted,
       r.status as request_status, r.accepted_at as request_accepted,
       r.final_price
FROM quotes q
JOIN repair_requests r ON r.id = q.request_id
WHERE q.id = '<quote_id>';

-- Expected:
-- quote_status: 'accepted'
-- quote_accepted: <timestamp>
-- request_status: 'accepted'
-- request_accepted: <timestamp>
-- final_price: <quote_total>
```

---

### Scenario 3: Multiple Quotes (Negotiation)
**Endpoint:** `POST /quotes` (after rejection)

**Test Steps:**
1. Repairer creates quote #1 (request status: PENDING)
2. Client rejects quote #1 with counter-offer
3. Repairer creates quote #2 (new price)

**Expected Results:**
- After step 1: Request status remains PENDING
- After step 2: Quote #1 status = REJECTED, request status remains PENDING
- After step 3: Quote #2 created, request status STILL PENDING
- Request only becomes ACCEPTED when client explicitly accepts a quote

**SQL Verification:**
```sql
SELECT q.id, q.status, q.total_amount, r.status as request_status
FROM quotes q
JOIN repair_requests r ON r.id = q.request_id
WHERE r.id = '<request_id>'
ORDER BY q.created_at DESC;

-- Expected:
-- Quote #2: status='pending', request_status='pending'
-- Quote #1: status='rejected', request_status='pending'
```

---

### Scenario 4: Counter-Proposal Acceptance
**Endpoint:** `POST /quotes/:id/accept-counter-proposal`

**Test Steps:**
1. Client rejects quote with proposedPrice
2. Repairer accepts counter-proposal

**Expected Results:**
- New quote created with clientProposedPrice
- New quote status = ACCEPTED (immediately)
- Request.status = ACCEPTED
- Request.finalPrice = clientProposedPrice

---

### Scenario 5: Edge Case - Duplicate Quote Prevention
**Endpoint:** `POST /quotes`

**Test Steps:**
1. Repairer creates quote #1 for request (PENDING)
2. Repairer attempts to create quote #2 for same request (while quote #1 still PENDING)

**Expected Results:**
- Second quote creation FAILS
- Error: "Un devis actif existe déjà pour cette demande"
- Request status remains PENDING

---

## BIZ-004: Review Submission Status Check

### Scenario 6: Review on Completed Repair
**Endpoint:** `POST /reviews`

**Test Steps:**
1. Complete full workflow: PENDING → ACCEPTED → COMPLETED
2. Client submits review

**Expected Results:**
- Review is created successfully
- Review.rating is stored (1-5)
- Repairer rating is updated
- Response: Review object with all details

**SQL Verification:**
```sql
SELECT r.status, rev.rating, rev.comment, rev.created_at
FROM repair_requests r
LEFT JOIN reviews rev ON rev.request_id = r.id
WHERE r.id = '<request_id>';

-- Expected:
-- r.status: 'completed' or 'delivered'
-- rev.rating: <client_rating>
-- rev.created_at: <timestamp>
```

---

### Scenario 7: Review on Delivered Repair
**Endpoint:** `POST /reviews`

**Test Steps:**
1. Complete full workflow: PENDING → ACCEPTED → COMPLETED → DELIVERED
2. Client submits review

**Expected Results:**
- Review is created successfully
- Works identically to Scenario 6

---

### Scenario 8: Review Blocked on Wrong Status
**Endpoint:** `POST /reviews`

**Test Steps:**
1. Attempt review on PENDING request
2. Attempt review on ACCEPTED request
3. Attempt review on REJECTED request

**Expected Results (all should FAIL):**
- Error: "Vous ne pouvez noter que les demandes terminées ou livrées"
- HTTP Status: 400 Bad Request
- No review created in database

**Status Validation Matrix:**
| Request Status | Review Allowed | Expected Error |
|---------------|----------------|----------------|
| PENDING       | NO             | Bad Request    |
| ACCEPTED      | NO             | Bad Request    |
| REJECTED      | NO             | Bad Request    |
| COMPLETED     | YES            | -              |
| DELIVERED     | YES            | -              |

---

### Scenario 9: Duplicate Review Prevention
**Endpoint:** `POST /reviews`

**Test Steps:**
1. Client submits review for completed request
2. Client attempts to submit another review for same request

**Expected Results:**
- Second review FAILS
- Error: "Vous avez déjà noté cette réparation"
- Original review remains unchanged

---

### Scenario 10: Step Ratings Consistency
**Endpoint:** `POST /reviews/step-ratings`

**Test Steps:**
1. Submit step ratings at different stages
2. Verify allowed statuses align with main review system

**Expected Results:**
- Step ratings for COMPLETED: Allowed on COMPLETED/DELIVERED
- Step ratings for DELIVERED: Allowed on DELIVERED only
- Consistency with main review status check

---

## Integration Test: Full Workflow

### End-to-End Happy Path

**Steps:**
1. Client creates repair request → Status: PENDING
2. Repairer creates quote → Status: PENDING (request stays PENDING)
3. Client accepts quote → Status: ACCEPTED (both quote and request)
4. Repairer completes repair → Status: COMPLETED
5. Repairer delivers device → Status: DELIVERED
6. Client submits review → Review created successfully

**Timeline Verification:**
```sql
SELECT
  r.created_at as request_created,
  q.created_at as quote_created,
  q.accepted_at as quote_accepted,
  r.accepted_at as request_accepted,
  r.completed_at as repair_completed,
  rev.created_at as review_created
FROM repair_requests r
LEFT JOIN quotes q ON q.request_id = r.id AND q.status = 'accepted'
LEFT JOIN reviews rev ON rev.request_id = r.id
WHERE r.id = '<request_id>';

-- Verify chronological order:
-- request_created < quote_created < quote_accepted = request_accepted < repair_completed < review_created
```

---

## API Testing Commands

### Create Quote (Repairer)
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Authorization: Bearer <repairer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "<uuid>",
    "laborCost": 5000,
    "parts": [
      {"name": "Écran LCD", "price": 15000, "quantity": 1}
    ],
    "estimatedDuration": "2 heures",
    "validDays": 7
  }'
```

### Accept Quote (Client)
```bash
curl -X POST http://localhost:3000/api/quotes/<quote_id>/accept \
  -H "Authorization: Bearer <client_token>"
```

### Create Review (Client)
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <client_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "<uuid>",
    "rating": 5,
    "comment": "Excellent service!"
  }'
```

---

## Automated Test Suite Recommendations

### Unit Tests

**quotes.service.spec.ts:**
```typescript
describe('createQuote', () => {
  it('should NOT auto-accept request when creating quote', async () => {
    // Test that request status remains PENDING
  });

  it('should set estimatedPrice but not finalPrice', async () => {
    // Test price fields are set correctly
  });
});

describe('acceptQuote', () => {
  it('should change request status to ACCEPTED', async () => {
    // Test status transition
  });

  it('should set acceptedAt timestamp', async () => {
    // Test timestamp is set
  });
});
```

**reviews.service.spec.ts:**
```typescript
describe('createReview', () => {
  it('should allow review on COMPLETED status', async () => {
    // Test review succeeds
  });

  it('should allow review on DELIVERED status', async () => {
    // Test review succeeds
  });

  it('should reject review on ACCEPTED status', async () => {
    // Test review fails with correct error
  });
});
```

---

## Regression Tests

### What NOT to Break

1. **Quote Negotiation:** Multiple quote creation/rejection cycles must still work
2. **Counter-Proposals:** acceptCounterProposal must still create ACCEPTED quote
3. **Cancel Negotiation:** Must still reset status to PENDING
4. **Step Ratings:** Existing step rating validation must remain functional
5. **Authorization:** Client/Repairer permissions must be enforced

---

## Performance Considerations

### Database Queries to Monitor

1. `createQuote()`: Should execute 2 DB operations (save quote, update request)
2. `acceptQuote()`: Should execute 2 DB operations (update quote, update request)
3. `createReview()`: Should execute 3 DB operations (check existing, save review, update repairer)

### Index Usage
```sql
-- Verify these indexes exist for optimal performance
CREATE INDEX idx_quotes_request_id ON quotes(request_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_reviews_request_id ON reviews(request_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
```

---

## Rollback Plan

If issues are discovered:

1. **Immediate Rollback:**
   ```bash
   git revert <commit_hash>
   ```

2. **Database State:** No data corruption possible (pure logic fixes)

3. **Temporary Workaround:** Manually update request status via admin panel if needed

---

## Sign-Off Checklist

- [ ] All scenarios tested in development environment
- [ ] SQL queries verified against test database
- [ ] API endpoints return expected status codes
- [ ] Error messages are user-friendly (French)
- [ ] No breaking changes to existing API contracts
- [ ] Unit tests updated/created
- [ ] Integration tests pass
- [ ] Performance impact measured (negligible expected)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Staging environment tested
- [ ] Production deployment plan reviewed

---

## Monitoring After Deployment

### Key Metrics to Watch

1. **Quote Creation Rate:** Should remain unchanged
2. **Quote Acceptance Rate:** Track PENDING → ACCEPTED transitions
3. **Review Submission Rate:** Should INCREASE (previously blocked on COMPLETED)
4. **Error Rates:** Monitor for unexpected BadRequest errors
5. **Status Transition Logs:** Verify proper status flow

### Alert Thresholds

- Error rate increase > 5%: Investigate immediately
- Quote acceptance rate < 50% of creation rate: Check workflow
- Review submission rate = 0 after 24h: Potential regression

---

## Success Criteria

✅ **BIZ-003 Fixed:**
- Quotes created without auto-accepting requests
- Explicit acceptance changes both quote and request status
- Negotiation workflow functions correctly

✅ **BIZ-004 Fixed:**
- Reviews allowed on COMPLETED status
- Reviews allowed on DELIVERED status
- Reviews blocked on all other statuses

✅ **No Regressions:**
- All existing features work as before
- No performance degradation
- No data integrity issues
