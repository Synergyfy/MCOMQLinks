# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MCOMLINKS – Rotator Engine (Full Build Specification in Simple English)

---

# 1. Purpose of the Rotator Engine

The Rotator Engine is the core system that controls where a single public link sends people.

Instead of sharing many different links everywhere, the system allows a user to share ONE main link.

When someone clicks that one link, the system decides which destination link to show.

This decision is controlled by a selected rotation type.

The Rotator Engine must:

- Accept one main public link
- Store multiple destination links inside it
- Decide which destination to send the visitor to
- Track clicks
- Allow pausing or removing links
- Allow different rotation behaviors

The goal is control, flexibility, and long-term link stability.

---

# 2. Basic Rotator Structure

Every Rotator must contain:

1. One Main Public Link (this is the link shared online)
2. A list of Destination Links (1 or more)
3. A selected Rotation Type
4. Link status controls (Active / Paused)

Example Structure:

Main Link: mcomlinks.com/special

Inside it:
- Link A
- Link B
- Link C

When someone clicks the main link, the engine chooses which of the internal links to show.

---

# 3. Core System Behavior

Every time someone clicks the main link, the system must:

Step 1: Receive the click request
Step 2: Identify which rotator campaign it belongs to
Step 3: Check which internal links are Active
Step 4: Apply the selected Rotation Type logic
Step 5: Choose the correct destination link
Step 6: Record the click in the database
Step 7: Redirect the visitor instantly

This process must happen in milliseconds.

---

# 4. Rotation Type 1 – Normal Rotation

Definition:
Visitors rotate through links in order.

How It Works:

- The system keeps track of position number.
- First click → Link 1
- Second click → Link 2
- Third click → Link 3
- Fourth click → Back to Link 1

Important Rule:
Every new visitor also starts at Link 1.

This means:
- Joe clicks → sees Link 1
- Mary clicks → sees Link 1
- Bob clicks → sees Link 1

The system does NOT remember users individually.
It simply moves down the list with each click.

If a link is Paused:
- It is skipped.

If only one link is Active:
- That link always shows.

---

# 5. Rotation Type 2 – Random Rotation

Definition:
The system randomly selects one active link each time.

How It Works:

- Every click triggers a random selection.
- Only Active links are eligible.
- Each click is independent.

Example:
- Joe clicks → Link 2
- Mary clicks → Link 1
- Bob clicks → Link 3

There is no fixed order.

Optional Advanced Setting (Recommended):
Allow weighted random, meaning some links can have higher chance than others.

---

# 6. Rotation Type 3 – Scarcity Rotation

Definition:
Each link has a maximum number of clicks allowed.
The system sends traffic to the first link that still has remaining clicks available.

Setup Example:

Link A → Max 500 clicks
Link B → Max 200 clicks
Link C → Max 50 clicks

How It Works:

Step 1: System checks Link A.
If remaining clicks > 0 → send traffic there.

Step 2: Each click reduces remaining count by 1.

When Link A reaches 0:
System moves to Link B.

When Link B reaches 0:
System moves to Link C.

Rule:
The system always selects the first link in the list that has not exceeded its limit.

If all links reach their limit:
System must either:
- Show fallback link, OR
- Show "Offer Expired" page

Admin must define fallback behavior.

---

# 7. Rotation Type 4 – Split Rotation

Definition:
Traffic is distributed evenly between links.

Main Purpose:
Used when two or more parties want equal traffic.

Example Setup:

Link A → Owner 1
Link B → Owner 2

How It Works:

Click 1 → Link A
Click 2 → Link B
Click 3 → Link A
Click 4 → Link B

The system alternates back and forth.

If 3 links:
- Click 1 → Link 1
- Click 2 → Link 2
- Click 3 → Link 3
- Click 4 → Link 1

This ensures equal distribution.

If one link is paused:
System evenly splits among remaining active links.

---

# 8. Link Controls (Pause / Activate / Remove)

Each destination link must have:

- Active status
- Pause toggle
- Delete option

If Paused:
- Link remains stored
- Not eligible for rotation

If Deleted:
- Permanently removed
- Historical data retained

Changes must apply instantly.

---

# 9. Single Master Link Advantage

The system must support the concept of:

ONE permanent public link.

Users can:
- Change destinations anytime
- Add new links
- Pause old offers

All old emails, blog posts, social posts continue working.

The public link never changes.

This protects long-term marketing efforts.

---

# 10. Database Requirements

For each Rotator:

Store:
- Rotator ID
- Public URL
- Rotation Type
- Created date
- Owner ID

For each Destination Link:
- Link ID
- Parent Rotator ID
- URL
- Status (Active/Paused)
- Click Count
- Max Click Limit (if scarcity)
- Order Position

For each Click:
- Timestamp
- Rotator ID
- Destination Link ID
- IP (optional)

---

# 11. Performance Requirements

The rotator must:

- Handle high traffic
- Redirect instantly
- Prevent duplicate counting
- Avoid redirect loops

Click counting must occur before redirect.

---

# 12. Error Handling

If selected link is broken:

System must:
- Log error
- Automatically skip to next eligible link

If no eligible links exist:
- Show fallback page

---

# 13. Admin Controls

Admin must be able to:

- View all rotators
- View click stats
- Force pause links
- Change rotation type
- Set default fallback behavior

---

# 14. Scalability Design

Engine must support:

- Unlimited rotators
- Unlimited links per rotator
- Thousands of clicks per minute

System should be built using:
- Efficient database queries
- Caching for active links
- Lightweight redirect logic

---

# FINAL SUMMARY

The MCOMLINKS Rotator Engine must:

1. Accept one public link
2. Store multiple destination links
3. Support four rotation types:
   - Normal
   - Random
   - Scarcity
   - Split
4. Allow instant control via pause/unpause
5. Track clicks accurately
6. Protect long-term shared links
7. Redirect instantly and reliably

This engine is the core control system that allows users to share one link and control what people see at any time.

