# Chat-First Planning Dashboard Design

## Summary

Build a first-draft web app for group planning where chat is the main surface and a plan dashboard is generated from that conversation. The product should feel like a familiar group chat, but with a persistent planning layer that keeps schedules, tasks, decisions, and budgets from getting buried in messages.

The approved direction is a hybrid of:

- Chat-first layout as the primary experience.
- A visible Plan Note panel on desktop.
- Bottom tabs on mobile for Chat, Plan Note, and Settings.

## Product Shape

The app has three primary areas:

1. **Chat**
   - The default landing view.
   - Shows a group trip conversation with realistic sample messages.
   - Includes a message composer.
   - Includes small AI extraction indicators where useful, such as "schedule found" or "decision needed".

2. **Plan Note**
   - A dashboard generated from the chat.
   - On desktop, it appears as a right-side panel next to the chat.
   - On mobile, it is reached through the bottom tab bar.
   - It contains four initial blocks:
     - Schedule
     - To-dos
     - Decisions needed
     - Budget

3. **Settings**
   - Kept intentionally light for the first draft.
   - Includes members, notification preference, and AI summary style.
   - On desktop, it can appear as a compact section within the side panel or as a tabbed panel state.
   - On mobile, it is one of the bottom tabs.

## Navigation

Desktop:

- The screen uses a two-column workspace.
- Left: chat thread, taking most of the width.
- Right: Plan Note panel with a small tab switcher for Plan Note and Settings.
- The chat remains visible while the user reviews the plan.

Mobile:

- The screen uses a single-column layout.
- Bottom navigation has three tabs:
  - Chat
  - Plan Note
  - Settings
- Chat is the default tab.
- Plan Note becomes a full-screen dashboard when selected.

## Visual Direction

The interface should be polished but work-focused, closer to a modern productivity messenger than a marketing page.

Use:

- Warm neutral backgrounds with clear white surfaces.
- A KakaoTalk-adjacent yellow accent without copying Kakao branding directly.
- Clear message bubbles, compact cards, and scannable dashboard sections.
- Rounded corners, but keep cards at moderate radius and avoid decorative oversized shapes.
- Icons for navigation and key actions where available.

Avoid:

- A landing-page hero.
- Overly decorative gradients.
- Large empty marketing sections.
- Explanatory in-app text that tells users how to use the UI.

## Sample Content

The first draft should use a trip-planning scenario, because it naturally exercises all planning surfaces.

Example planning context:

- Trip: Jeju, 2 nights and 3 days.
- Members: Minji, Jisoo, Hyeon, User.
- Schedule candidates:
  - Flight search on Friday night.
  - Accommodation decision by Sunday.
  - Day 2 east-side route.
- To-dos:
  - Compare flights.
  - Check rental car price.
  - Pick accommodation area.
  - Gather food recommendations.
- Decisions needed:
  - Stay in Jeju City or Seogwipo.
  - Rent a car or use taxis.
- Budget:
  - Estimated per-person cost.
  - Flight, stay, rental, food categories.

## Components

The first implementation should include these components or equivalent local structure:

- `App`: owns the selected mobile tab and sample planning data.
- `ChatView`: renders header, message list, extraction hints, and composer.
- `PlanNote`: renders schedule, to-dos, decisions, and budget cards.
- `SettingsView`: renders member and preference controls.
- `BottomNav`: mobile tab navigation.
- `PanelTabs`: desktop side-panel toggle between Plan Note and Settings.

## Data Model

Static sample data is enough for the first draft. No backend is needed.

Suggested data objects:

- `messages`: sender, avatar or initials, timestamp, text, kind, optional extracted label.
- `scheduleItems`: title, date or relative label, status.
- `tasks`: title, owner, status.
- `decisions`: question, options, state.
- `budgetItems`: category, amount, note.
- `members`: name, role or status.

## Interactions

Minimum interactions for the first draft:

- Switch between Plan Note and Settings in the desktop side panel.
- Switch between Chat, Plan Note, and Settings on mobile.
- Type in the composer field without needing to persist messages.
- Toggle task checkboxes locally if simple to implement.
- Select an AI summary style in Settings if simple to implement.

Out of scope for the first draft:

- Authentication.
- Real chat persistence.
- Real AI extraction.
- Sharing links.
- Calendar integration.
- Push notifications.
- Multi-room workspace management.

## Responsive Behavior

The layout should be verified at desktop and mobile widths.

Desktop:

- Two-column layout.
- Chat remains the main visual weight.
- Right panel stays readable and does not squeeze message text.

Mobile:

- One active tab at a time.
- Bottom nav remains fixed or visually anchored.
- Composer and bottom navigation should not overlap.
- Plan cards should stack cleanly.

## Testing And Verification

Because this is a visual prototype, verification should include:

- Build or lint command if the chosen stack provides one.
- Local dev server smoke test.
- Browser check at desktop width.
- Browser check at mobile width.
- Confirm no obvious text overflow or incoherent overlap.

## Implementation Recommendation

Use a small Vite React app with CSS modules or plain CSS. React is appropriate because the UI has tab state, reusable panels, and responsive component structure, while the first draft remains lightweight.

