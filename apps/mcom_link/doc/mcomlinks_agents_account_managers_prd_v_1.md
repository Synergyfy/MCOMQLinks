# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MCOMLINKS – Agents / Account Managers Platform

---

# 1. Purpose of the Agents Platform

The Agents / Account Managers Platform is the working dashboard for field agents and relationship managers.

Agents are responsible for:
- Onboarding businesses
- Managing relationships
- Collecting offers
- Monitoring performance
- Ensuring businesses stay active
- Reporting back to Admin

Important Rule:
Agents do NOT control the rotator engine.
Agents do NOT control system rules.
Agents work within limits set by Admin.

This platform helps agents manage people, not the system core.

---

# 2. Agent Login & Access Control

Each Agent must have:
- Secure login (email + password)
- Role assigned by Admin

Agent Roles:

1. Field Agent
   - Can onboard businesses
   - Can submit offers for approval
   - Can view performance of assigned businesses

2. Senior Account Manager
   - Can approve draft offers before Admin review
   - Can view wider performance data
   - Can manage multiple locations (if assigned)

Agents must only see:
- Businesses assigned to them
- Locations assigned to them

They must NOT see global system data unless permitted.

---

# 3. Agent Dashboard Overview

When an Agent logs in, they must see:

- Number of Assigned Businesses
- Active Offers Under Management
- Total Scans (for their portfolio)
- Total Claims (for their portfolio)
- Businesses with Expiring Offers
- Businesses with No Active Offers

Quick action buttons:
- Add New Business
- Submit New Offer
- View Business Performance

Dashboard must be simple and performance-focused.

---

# 4. Business Onboarding Process

Agents must be able to onboard a business step by step.

Step 1: Create Business Profile
- Business Name
- Contact Person
- Phone Number
- Email Address
- Physical Location
- Assigned Location (High Street / Mall)

Step 2: Select Plan Type (if applicable)
- Basic
- Premium

Step 3: Submit for Admin Approval

Business must not go live until Admin approves.

System must notify Admin automatically.

---

# 5. Offer Collection & Submission

Agents collect offers from businesses.

Agent must be able to create an offer draft with:
- Offer Headline
- Short Description
- Image Upload
- CTA Type
- Start Date
- End Date

After submission:

Status options:
- Draft
- Submitted for Approval
- Approved
- Rejected (with reason)

Only Admin can approve final publishing.

Agent must see rejection reason clearly.

---

# 6. Portfolio Performance Monitoring

Agents must be able to see performance per business:

Per Business View:
- Total Scans
- Total Claims
- Conversion Rate
- Current Offer Status

Per Offer View:
- Impressions
- Clicks
- Claims

Agents must use this data to:
- Advise businesses
- Suggest better offers
- Improve engagement

Data should be simple and visual (charts optional).

---

# 7. Expiry & Renewal Alerts

The system must automatically notify Agents when:

- An offer is about to expire (7 days before)
- A business has no active offer
- A priority campaign is ending

Agent dashboard must show alert section:
"Action Required"

This ensures businesses stay active in the rotator.

---

# 8. Communication Log

Agents must have a simple communication notes section per business.

They can log:
- Meeting notes
- Call summaries
- Offer discussions
- Follow-up dates

This creates accountability and tracking.

Admin can view these logs.

---

# 9. Business Status Management

Agents can:
- Recommend suspension
- Recommend upgrade to premium
- Request priority placement

But only Admin can approve these actions.

Agents cannot directly:
- Activate priority override
- Delete businesses
- Change rotator order

---

# 10. Performance Ranking View

Agents should see ranking of their businesses:

- Top Performing Business
- Lowest Performing Business
- Highest Conversion Offer

This encourages:
- Healthy competition
- Better account management

---

# 11. Targets & Productivity Tracking (Optional but Recommended)

Admin may assign targets to Agents:

- New Businesses Per Month
- Active Offers Per Month
- Revenue Targets

Agent dashboard must show:
- Progress toward targets
- Monthly performance summary

---

# 12. Permissions & Restrictions

Agents must NOT be able to:
- Edit global storefront template
- Reset rotators
- Change sequence order
- Access other agents’ portfolios (unless permitted)

All changes must be logged.

---

# 13. Notifications System

Agents must receive notifications for:

- Offer approval
- Offer rejection
- Business suspension
- Performance alerts

Notifications can be:
- In-dashboard alerts
- Optional email notifications

---

# 14. Reporting & Export

Agents must be able to export performance reports for:
- Individual business
- Their entire portfolio

Export formats:
- CSV
- PDF (optional future feature)

---

# 15. User Experience Principles

The Agents platform must feel:
- Practical
- Clear
- Task-focused
- Simple

It should help them manage relationships easily.

It must not feel technical or overwhelming.

---

# FINAL SUMMARY

The MCOMLINKS Agents / Account Managers Platform must:

1. Allow onboarding of businesses
2. Allow offer draft creation and submission
3. Show portfolio performance
4. Alert agents of expiring or inactive offers
5. Track communication notes
6. Support performance monitoring
7. Enforce permission limits
8. Help agents keep businesses active in the rotator

Agents manage relationships.
Admin controls the system.

This platform connects the field to the core engine.

