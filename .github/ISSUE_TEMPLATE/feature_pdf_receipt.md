---
name: P4.1.1 — PDF receipt for completed payment
about: Generate downloadable receipt for any completed payment
title: "[P4.1.1] Generate PDF receipt on payment-detail"
labels: enhancement, sprint-1, payment
assignees: ''
---

## Context

`/payment/:id` lets users see a completed payment but cannot produce a printable receipt. The TODO is marked at `frontend/src/app/features/payment/components/payment-detail/payment-detail.component.ts:~350`.

## Acceptance criteria

- [ ] Backend exposes `GET /api/v1/payments/:id/receipt` returning `Content-Type: application/pdf`
- [ ] Endpoint validates auth + ownership (client OR repairer of the payment, OR admin)
- [ ] PDF includes: RepairFone logo, payment ID, transaction reference, parties (client + repairer), device + service, amount, payment method, paid_at, status badge
- [ ] PDF returns 404 if payment not in `completed` state (cannot print receipt for pending/failed)
- [ ] Frontend: button "Télécharger le reçu" on `/payment/:id` triggers download
- [ ] One backend test (snapshot of generated PDF metadata)

## Technical notes

- Lib options: `pdfkit` (lightweight, programmatic) or `puppeteer-core` (HTML→PDF, heavier but template reuse)
- Recommended: `pdfkit` for now, switch to puppeteer if template needs evolve
- Cache: not needed (low frequency, generated on-demand)

## Estimate

1 day (backend service + PDF template + frontend wiring + test)

## Dependencies

None
