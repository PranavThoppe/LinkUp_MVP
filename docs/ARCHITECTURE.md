# LinkUp MVP — Architecture & Design Document

> **Status:** Draft v0.1 — Working document, evolving as design decisions land.

---

## 1. Product Overview

LinkUp is a scheduling app that lives inside iMessage. Users in a group chat can create a schedule poll, and everyone votes on which dates (and potentially times) work for them. The app surfaces results directly in the conversation so nobody has to leave iMessage.

### Core User Flows

**Sender (creates the poll):**

1. Opens the LinkUp iMessage app (compact view replaces keyboard)
2. Chooses a scheduling mode: **Month**, **Week**, or **Specific Days**
3. Configures dates/options
4. Sends the schedule card into the group chat

**Voter (responds to the poll):**

1. Sees the schedule card in the chat (in-chat view / transcript message)
2. Taps the card → expanded view opens (full screen)
3. Sees who voted for what, selects their own available dates
4. (Stretch) Picks time preferences within voted days
5. Submits vote → card in chat updates to reflect new votes

---

## 2. iMessage Extension Architecture

### Apple's Three Presentation Contexts


| Context                  | Size            | Purpose                                     | Our Usage                                                             |
| ------------------------ | --------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| **Transcript (in-chat)** | Message bubble  | Read-only summary shown in the conversation | The schedule card everyone sees — varies by mode (month/week/day)     |
| **Compact**              | Keyboard-height | Interactive input area; replaces keyboard   | Sender creates/configures the schedule — mode picker + date selection |
| **Expanded**             | Full screen     | Rich interaction, detailed views            | Voter drills in to see all votes, cast their own, pick times          |


### Implementation Approach

> **OPEN QUESTION [Q1]:** Are we building this as a true native iMessage extension (requires `MSMessagesAppViewController` in Swift + Messages framework), or keeping it as an Expo/React Native prototype that *simulates* the iMessage UX?
>
> **Why it matters:** A real iMessage extension is a separate target in Xcode with its own lifecycle. Expo managed workflow doesn't support this out of the box. Options:
>
> - **Prototype-only (current path):** Stay in Expo, simulate all three views as screens/modals. Great for design iteration and demos.
> - **Hybrid:** Expo app + native Swift iMessage extension target that loads a React Native view (complex but possible with `expo-dev-client` or bare workflow).
> - **Native extension:** Build the extension in SwiftUI, use Supabase or CloudKit for data sync, keep the Expo app as a companion.
>
> **Recommendation for MVP:** Continue in Expo to nail the UX/design. The views we build translate almost 1:1 to what the extension would show. We can port to native later once the design is locked.

---

## 3. View Designs

### 3.1 In-Chat View (Transcript Message)

This is what appears as a message bubble in the group chat. **The design changes based on the scheduling mode the sender picked.**

#### Month View (current — `CalendarCard`)

- Full month grid with day-of-week headers
- Green gradient intensity = number of votes on that day
- Colored dots below each day showing which senders voted
- Footer: "Voted" section with participant avatars
- **Status:** Already built and working.

#### Week View

> **OPEN QUESTION [Q2]:** What should the week card look like in the chat bubble?
>
> Ideas to explore:
>
> - **Horizontal day strip:** 7 columns (Mon–Sun) with date numbers, vote dots below each, same green gradient system
> - **Stacked bars:** Each day as a horizontal row with voter avatars/dots aligned — more vertical, scannable
> - **Mini timeline:** Da ys as a horizontal timeline with vote count indicators
>
> The card should immediately communicate: "these are the 7 days being considered, here's where votes landed."

#### Day View (specific days)

> **OPEN QUESTION [Q3]:** When the sender picks "Specific Days" (e.g., Mar 20, Mar 22, Mar 25), what's the best in-chat representation?
>
> Ideas:
>
> - **Pill list:** Each selected day as a rounded pill/chip with vote count + dots
> - **Compact list:** Vertical list of dates with voter avatars next to each
> - **Mini cards:** Each day as a small card showing date + time slots + who voted
>
> Since there are fewer dates, we have room to show more detail per date (times, etc.).

### 3.2 Compact View (Replaces Keyboard)

The sender's creation interface. Roughly keyboard-height (~260pt on iPhone).

```
┌──────────────────────────────────────────┐
│  [Month]    [Week]    [Days]    ← tabs   │
│─────────────────────────────────────────-│
│                                          │
│        (mode-specific content)           │
│                                          │
│                        [Send Schedule]   │
└──────────────────────────────────────────┘
```

**Tab: Month**

- Month/year picker (scroll or arrows)
- Optional: pre-select specific dates within the month, or just send the whole month for voting

**Tab: Week**

- Week picker — could be: current week highlighted by default, swipe left/right for other weeks
- Shows Mon–Sun with dates so the sender confirms the right week

**Tab: Days (Specific Days)**

- Mini calendar where sender taps individual dates across any month
- Selected dates shown as pills/chips below the calendar
- "Add more dates" or just keep tapping

> **OPEN QUESTION [Q4]:** In the compact view, does the sender *only* pick the mode + date range and send? Or can they also configure things like:
>
> - A title/description for the event? ("Weekend hike", "Study session")
> - Time slot options? (e.g., "Morning / Afternoon / Evening" per day)
> - Deadline for voting?
>
> Keeping it minimal for MVP is smart — just mode + dates + send. Title could be a quick win though.

### 3.3 Expanded View (Full Screen)

This is where the real interaction happens. Opened by tapping the in-chat card.

**For voters:**

- Full visualization of all votes so far (who voted for which dates)
- Ability to toggle your own vote on each date
- Visual: colored avatars/initials on each date cell
- Summary: "Best day" or "Most available" highlight

**For the original sender:**

- Same view as voters, plus potentially:
  - Close poll / finalize date
  - Resend/remind

> **OPEN QUESTION [Q5]:** How should time selection work in the expanded view?
>
> Options:
>
> - **No times for MVP** — just dates. Ship it.
> - **Preset slots:** Each voted day shows "Morning | Afternoon | Evening" toggles
> - **Hourly grid:** Scroll through hours, tap to mark availability (like When2Meet)
> - **Free-form:** Voters type in their available times (messy but flexible)
>
> **Recommendation:** Start with date-only voting. If we add times, preset slots (Morning/Afternoon/Evening) is the simplest UX that adds real value. Hourly grid is a v2 feature.

---

## 4. Data Model

### Schedule (the poll itself)

```typescript
type ScheduleMode = 'month' | 'week' | 'days';

type Schedule = {
  id: string;
  creatorId: string;        // who sent it
  mode: ScheduleMode;
  title?: string;           // optional event name

  // Mode-specific date range
  months?: { month: number; year: number }[]; // selected months, for 'month' mode
  weekStart?: string;       // ISO date of Monday, for 'week' mode
  specificDates?: string[]; // ISO dates, for 'days' mode

  createdAt: string;        // ISO timestamp
  isActive: boolean;        // can people still vote?
};
```

### Vote

```typescript
type Vote = {
  id: string;
  scheduleId: string;
  oderId: string;           // who voted
  senderName: string;       // display name / initial
  senderColor: string;      // avatar color
  dates: string[];          // ISO dates they're available
  timeSlots?: Record<string, string[]>; // date -> ['morning','afternoon','evening'] (stretch)
  votedAt: string;
};
```

### Participant

```typescript
type Participant = {
  id: string;
  initial: string;      // "P", "S", "J"
  color: string;         // "#FF6B9D"
  displayName?: string;
};
```

> **OPEN QUESTION [Q6]:** Where does data live?
>
> - **Local-only (current):** Fine for prototyping. All state in React.
> - **Supabase:** Real-time sync, auth, database. The MCP server is already configured. Good for multi-user voting.
> - **iMessage URL payloads:** In a real extension, `MSMessage.url` carries encoded data. Each vote updates the message's URL, so data lives *in the message itself*. No backend needed for basic functionality.
>
> **For MVP prototype:** Local state is fine. When we're ready for real multi-user, Supabase is the obvious choice (already in the MCP tooling).

---

## 5. Screen / Route Map

```
app/
├── imessage-preview.tsx        # Simulated iMessage chat (existing)
├── modal.tsx                   # Generic modal (existing, mostly placeholder)
│
├── compact/                    # NEW — Compact view screens
│   ├── _layout.tsx             # Compact view layout (tabs for month/week/days)
│   ├── month.tsx               # Month picker
│   ├── week.tsx                # Week picker
│   └── days.tsx                # Specific days picker
│
├── expanded/                   # NEW — Expanded view screens
│   ├── _layout.tsx             # Expanded view layout
│   ├── schedule.tsx            # Full schedule view with all votes
│   └── vote.tsx                # Voting interface
│
components/
├── imessage/
│   ├── CalendarCard.tsx        # Month view card (existing)
│   ├── WeekCard.tsx            # NEW — Week view card for chat
│   ├── DaysCard.tsx            # NEW — Specific days card for chat
│   ├── CompactMonthPicker.tsx  # NEW — Month picker for compact view
│   ├── CompactWeekPicker.tsx   # NEW — Week picker for compact view
│   ├── CompactDaysPicker.tsx   # NEW — Multi-day picker for compact view
│   ├── ExpandedCalendar.tsx    # NEW — Full interactive calendar for expanded view
│   ├── VoteGrid.tsx            # NEW — Shows who voted for what
│   └── TimeSlotPicker.tsx      # NEW (stretch) — Time selection
```

---

## 6. Tech Stack


| Layer            | Current                         | Planned                                           |
| ---------------- | ------------------------------- | ------------------------------------------------- |
| Framework        | Expo SDK 54 + React Native 0.81 | Same                                              |
| Routing          | expo-router (file-based)        | Same                                              |
| State            | Local `useState`                | Zustand or React Context (for cross-screen state) |
| Animation        | react-native-reanimated 4.1     | Same + gesture-handler for swipes                 |
| Backend          | None                            | Supabase (when ready for real data)               |
| Native Extension | None                            | Swift/SwiftUI iMessage extension (future)         |


---

## 7. Open Questions Summary


| #   | Question                                                               | Impact        | Suggested Default                                           |
| --- | ---------------------------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| Q1  | Real iMessage extension or Expo prototype?                             | Architecture  | Expo prototype for now                                      |
| Q2  | Week card in-chat design?                                              | UI/UX         | Horizontal day strip with vote dots                         |
| Q3  | Specific-days card in-chat design?                                     | UI/UX         | Pill list with vote counts                                  |
| Q4  | What can the sender configure beyond dates?                            | Scope         | Mode + dates only; title as stretch                         |
| Q5  | Time selection in expanded view?                                       | Scope         | Date-only for v1; preset slots for v1.5                     |
| Q6  | Where does data live?                                                  | Architecture  | Local state → Supabase when multi-user                      |
| Q7  | How do votes update the in-chat card?                                  | Data flow     | Local state for prototype; MSMessage URL for real extension |
| Q8  | Is there a "finalize" flow where the sender locks in the winning date? | Feature scope | Yes, but v2                                                 |


---

## 8. Implementation Phases

### Phase 1 — Nail the Views (Current Sprint)

- Build compact view with month/week/days tabs
- Build week card and days card for in-chat view
- Build expanded view with full vote visualization
- Wire up local state so creating a schedule → in-chat card → expanded view all connect

### Phase 2 — Polish & Interactions

- Animations (card expand/collapse, vote toggling)
- Haptic feedback on vote actions
- "Best date" algorithm + highlight
- Title/description for schedules

### Phase 3 — Real Data

- Supabase integration (schedules table, votes table, real-time subscriptions)
- Participant identification (even if mocked in iMessage context)

### Phase 4 — Native Extension (Future)

- Swift/SwiftUI iMessage extension target
- `MSMessagesAppViewController` lifecycle
- URL-based message payloads
- React Native bridge or full SwiftUI rewrite for extension views

---

*Last updated: March 18, 2026*