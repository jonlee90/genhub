# Component Plan — Chat Metadata Batching

## Overview

Batch metadata fetching for chat messages to remove N+1 calls. Keep rendering logic unchanged except for data source changes.

## Interfaces

- `useMessageMetadata({ roomId, messageIds })` → `{ metadataById, isLoading, error }`.
- `metadataById` keyed by message ID with fields for reactions, reply counts, and attachments.

## Tasks

1. Create batched metadata hook.
2. Update `MessageList` to request metadata for visible message IDs.
3. Update `MessageItem` to consume metadata from the map and fall back safely.

## Validation

- `npm run lint -- --file components/chat/MessageList.tsx`
- `npm run lint -- --file components/chat/MessageItem.tsx`
- Manual spot check of chat list.
