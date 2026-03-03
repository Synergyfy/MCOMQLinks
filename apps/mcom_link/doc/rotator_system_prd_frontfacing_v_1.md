# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Rotator System – Frontfacing Side Only

---

# 1. Purpose of This Document

This document explains in full detail how the Frontfacing Side of the Rotator System must be built.

It is written in simple English so that:
- Developers understand exactly what to build.
- Designers understand the user experience.
- No part of the process is missed.

This document covers ONLY the front-facing (customer-facing) experience.
Admin, Agents, and Business Owner dashboards will be documented separately.

---

# 2. What Is the Frontfacing Side?

The frontfacing side is:

Everything the customer sees after scanning the QR code or tapping NFC.

It includes:
- The loading process
- The rotating offer display
- The storefront layout
- The call-to-action buttons
- The reward/engagement process
- The confirmation screens
- The fallback screens

It does NOT include:
- Admin dashboards
- Business dashboards
- Offer creation tools

---

# 3. High-Level Customer Flow

The complete frontfacing flow must work like this:

1. Customer scans QR or taps NFC
2. System selects next offer in rotation
3. Storefront page loads
4. Offer is displayed clearly
5. Customer chooses action (Claim, Redeem, View, etc.)
6. System tracks engagement
7. Confirmation screen appears

The process must feel fast, simple, and automatic.

Target load time: Under 3 seconds.

---

# 4. Step-by-Step Build Requirements

---

# STEP 1: QR / NFC Entry Point

When the customer scans:

The link must NOT open a fixed page.

It must open a dynamic route such as:

example.com/r/{location-id}

This route must:
- Trigger the rotator engine
- Fetch the correct next offer
- Log the scan immediately

If the rotator fails for any reason:
- Show fallback branded offer
- Never show error page

---

# STEP 2: Loading Screen

While the system fetches the next offer:

Display a simple branded loading screen with:
- Logo
- Short message ("Loading your local offer...")

This prevents blank screens.

---

# STEP 3: Storefront Layout Structure

The storefront must follow a fixed template.
Businesses cannot redesign it.

Layout must include:

1. Header Section
   - Brand logo (small)
   - Location or campaign name

2. Main Offer Block (Dynamic Content)
   - Business name
   - Offer headline
   - Short description
   - Offer image (if provided)

3. Call-to-Action Button
   - Claim Offer
   - Redeem Now
   - Get Reward
   - Visit Website

4. Trust Section (Optional)
   - "Powered by [Platform Name]"
   - Simple credibility message

5. Footer
   - Terms link
   - Privacy link

The design must be:
- Mobile-first
- Clean
- Easy to read
- No clutter

---

# STEP 4: Offer Display Rules

When the offer loads:

The system must:
- Confirm offer is active
- Confirm date validity
- Confirm it has not expired

If expired:
- Automatically skip to next active offer

If no active offers exist:
- Show default branded campaign

Never show empty offer space.

---

# STEP 5: Offer Rotation Logic (User Perspective)

From the customer side, it must feel like:

"Every time I scan, I see something new."

Customers must not:
- See the same offer repeatedly in normal rotation
- See broken sequences

Even if 50 people scan at once:
- Each scan must move the system forward

Rotation must feel continuous and fair.

---

# STEP 6: Call-to-Action Behaviour

When customer taps CTA button:

The system must:
- Log the click
- Associate it with the displayed offer
- Move user to next action screen

Possible next screens:

A. Claim Screen
   - Simple form (Name, Email, Phone if required)
   - Consent checkbox

B. Instant Redeem Screen
   - Show redemption code
   - Show instructions

C. External Redirect
   - Open business website
   - Log redirect event first

---

# STEP 7: Claim / Reward Process

If the offer requires form submission:

Process must be:

1. User fills form
2. User taps submit
3. System validates fields
4. System saves data
5. System shows confirmation screen

Confirmation screen must include:
- "Offer Claimed Successfully"
- What happens next
- Optional secondary offer suggestion

The form must:
- Be minimal
- Not require unnecessary fields
- Work smoothly on mobile

---

# STEP 8: Engagement Tracking

Every frontfacing interaction must log:

- Scan event
- Offer shown
- CTA click
- Form submission
- Redemption event

Tracking must happen in background.
Customer should not see tracking activity.

---

# STEP 9: Premium / Priority Overrides (Frontfacing Effect)

If a premium business has temporary priority:

Frontfacing system must:
- Show their offer first
- Clearly display it as normal offer
- Not break visual consistency

After priority period ends:
- System returns to normal rotation automatically

No manual switching required.

---

# STEP 10: Seasonal Switching

The frontfacing side must automatically reflect:
- Winter campaigns
- Summer campaigns
- Special events

Customer does not see seasons manually.
They simply see relevant offers.

System must:
- Respect offer active dates
- Automatically exclude inactive ones

---

# STEP 11: Fallback Behaviour

If anything fails:

The system must:

1. Show branded fallback offer
2. Show campaign-wide promotion
3. Never display technical error messages

No:
- 404 pages
- Server errors
- Blank screens

User experience must always continue.

---

# STEP 12: Performance Requirements

Frontfacing must:

- Load under 3 seconds
- Handle high traffic
- Work on low internet speeds
- Be fully mobile responsive

Images must be compressed.
Pages must be lightweight.

---

# STEP 13: Security Requirements

Frontfacing system must:

- Prevent direct manipulation of rotation order
- Prevent offer URL guessing
- Validate form inputs
- Protect user data

Customer must not be able to:
- Force next offer manually
- Reload repeatedly to farm rewards

Optional:
- Device/session tracking limits

---

# STEP 14: User Experience Principles

The frontfacing experience must feel:

- Fast
- Simple
- Clean
- Reward-driven
- Professional

It must never feel:
- Complicated
- Confusing
- Technical
- Slow

If explanation is needed, design must be simplified.

---

# 15. Final Frontfacing Summary

Developers must build a front-facing system that:

1. Opens via QR/NFC trigger
2. Calls the rotator engine
3. Displays the next valid offer
4. Uses a fixed storefront template
5. Logs all engagement
6. Handles forms and redirections
7. Supports priority overrides
8. Automatically respects seasonal campaigns
9. Never shows blank pages
10. Works smoothly on mobile
11. Feels automatic and intelligent
12. Runs like a machine without daily manual intervention

---

END OF FRONTFACING PRD – VERSION 1

Next Phase: Admin Platform PRD

