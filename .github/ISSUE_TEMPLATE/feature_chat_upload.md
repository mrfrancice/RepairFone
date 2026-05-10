---
name: P4.1.2 — File attachments in chat
about: Allow image/PDF uploads in chat-room and conseil-chat
title: "[P4.1.2] Upload attachments in chat-room and conseil-chat"
labels: enhancement, sprint-1, chat
assignees: ''
---

## Context

The `attachments[]` field exists on the Message entity backend but no upload endpoint nor UI is wired. TODOs marked at:
- `frontend/src/app/features/conseils/components/conseil-chat/conseil-chat.component.ts:~200`
- `frontend/src/app/features/chat/components/chat-room/chat-room.component.ts`

## Acceptance criteria

- [ ] Backend exposes `POST /api/v1/uploads/chat-attachment` (multer, multipart/form-data)
- [ ] Validates MIME types: image/jpeg, image/png, image/webp, application/pdf
- [ ] Max file size: 5 MB per file, max 5 files per message
- [ ] Storage: local disk in dev (`uploads/chat/`), S3-compatible bucket in prod (env-driven)
- [ ] Returns `{ url: string, filename: string, mimeType: string, size: number }`
- [ ] Frontend: file input + paperclip button in chat-room and conseil-chat composers
- [ ] Preview thumbnails before send, X to remove
- [ ] Display attachments in message bubble (image inline, PDF as link)
- [ ] One e2e or component test (mock upload, verify message includes attachment)

## Technical notes

- Multer config: `@nestjs/platform-express` already in dependencies
- S3 driver later: `@aws-sdk/client-s3` (only in prod build)
- Image compression client-side: optional, browser canvas API for resize > 1080p

## Estimate

2 days (backend upload endpoint + storage abstraction + frontend composer + preview + display)

## Dependencies

None (the backend already accepts `attachments[]` on send-message endpoint)
