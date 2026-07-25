# Implementation Plan - 3D Paper Flip Animation for Overview Section

This plan outlines the design and implementation of a premium, realistic 3D paper page-flipping mechanism for the geography & history overview section in the province details page, replacing numerical pagination with book-like controls and motion dynamics.

## User Review Required

> [!IMPORTANT]
> To achieve 3D rendering and smooth animations, we will install `framer-motion` in the frontend application.
> The layout of the overview section will transition into a structured two-column book-style sheet on Desktop/Tablet and single-column on Mobile, utilizing custom page-flip physics.

## Proposed Changes

We will introduce a reusable `BookPageReader.tsx` component that encapsulates the 3D paper flipping layout, and update `ProvinceDetailPage.tsx` to mount it.

### [Frontend - Features / Blog]

#### [NEW] [BookPageReader.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/blog/BookPageReader.tsx)
Create a reusable book reader component utilizing Framer Motion:
- Setup `AnimatePresence` and custom variant states matching rotation (`rotateY`), perspective, and `transform-style: preserve-3d`.
- Implement dynamic shadows (Ground Shadow, Contact Shadow, and Inner Shadow) animated synchronously with page rotations.
- Implement responsive multi-column layout for text inside pages (2 columns on desktop, 1 column on mobile).
- Configure styling with cream paper color (`#FDFCF8`), page borders, thickness shadows, and edge highlights.

#### [MODIFY] [ProvinceDetailPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/blog/ProvinceDetailPage.tsx)
- Integrate the new `BookPageReader` component to render the overview text.
- Re-route navigation and update the state to cleanly handle article pagination inside the book.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no TypeScript compilation or packaging errors.

### Manual Verification
- Navigate to the detail page of a province (e.g., `/explore/province/tp-ho-chi-minh`).
- Click `Next` and `Previous` inside the overview card and verify the 3D rotateY paper curl animation, shadows scaling, and column layout adaptability.
