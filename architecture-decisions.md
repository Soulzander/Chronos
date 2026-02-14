# Architectural Decision Records (ADR)

## 1. Vertical-First Scrollable UI
**Context**: Traditional calendars use a grid (Month) or horizontal swipe (Week).
**Decision**: We chose a vertical "feed-style" scroll.
**Rationale**: This aligns with modern mobile interaction patterns (infinite scroll) and makes browsing a long history of tasks and journal entries more natural on touch devices.

## 2. Client-Side Only Persistence (MVP)
**Context**: Data privacy is paramount for journaling and mood tracking.
**Decision**: Use `localStorage` for all data persistence.
**Rationale**: Ensures zero-latency data access and provides immediate privacy-by-default.

## 3. Atmospheric Particle Engine
**Context**: Static backgrounds feel sterile for a lifestyle app.
**Decision**: Implemented high-performance `requestAnimationFrame` Canvas engines for meteors and leaves.
**Rationale**: Increases user retention through visual delight ("delighters"). The engine is built to be modular, allowing users to toggle effects for performance or battery saving.

## 4. Sensory Feedback Loop
**Context**: Users often miss digital notifications.
**Decision**: Coupled standard browser notifications with a 5-second `navigator.vibrate` haptic pulse for major task boundaries.
**Rationale**: Creates a tangible connection between the digital schedule and the user's physical presence.

## 5. Proportional Timeline with "Silver Lightning Spine"
**Context**: Users need to see their day's availability and task density.
**Decision**: Implement a 24-hour timeline using a pixels-per-minute constant anchored by a shimmering vertical "Spine."
**Rationale**: This visualization makes time feel tangible. The "Silver Spine" acts as a metaphor for the lightning-fast, shimmering nature of the present moment.

## 6. Procedural Visuals (The Mood Star)
**Context**: Represent emotions without using standard, static emojis.
**Decision**: Use an SVG path generator that calculates points and curvature based on mood IDs.
**Rationale**: Creates a "premium" and unique brand identity. The visuals feel alive and organic.
