# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MCOMLINKS – Monetization & Billing System

---

# 1. Purpose of Monetization & Billing

The Monetization & Billing system controls how MCOMLINKS makes money.

It must:

- Define pricing plans
- Control subscriptions
- Handle payments
- Track invoices
- Manage renewals
- Manage failed payments
- Control access based on payment status

Important Principle:
No active payment = No active visibility in the rotator.

Billing status must directly control storefront visibility.

---

# 2. Revenue Model Overview

MCOMLINKS earns revenue from businesses through:

1. Monthly Subscription Plans
2. Premium Placement Upgrades
3. Featured Campaign Boosts (Optional future feature)
4. One-Time Setup Fees (Optional)

Each revenue type must be configurable in Admin.

---

# 3. Subscription Plans Structure

Admin must be able to create and manage plans.

Example Plans:

1. Basic Plan
   - 1 Active Offer at a time
   - Standard Rotator Placement
   - Basic Analytics

2. Premium Plan
   - Multiple Active Offers (configurable limit)
   - Higher Priority Placement
   - Advanced Analytics
   - Priority Approval

Plan Settings (Admin Controlled):

- Plan Name
- Monthly Price
- Offer Limit
- Placement Priority Level
- Feature Access
- Trial Period (Optional)

Plan changes must not automatically affect active businesses without confirmation.

---

# 4. Subscription Lifecycle

When a business subscribes:

Step 1: Business selects plan
Step 2: Payment is processed
Step 3: Subscription status becomes "Active"
Step 4: Business storefront becomes eligible for rotator

If payment fails:

Step 1: System retries payment (configurable retry logic)
Step 2: Notify Business Owner
Step 3: Notify Agent
Step 4: If still unpaid after grace period → Status becomes "Suspended"
Step 5: Business removed from active rotator

---

# 5. Payment Processing Requirements

System must support:

- Credit/Debit Cards
- Online Payment Gateway Integration

Billing system must:

- Store transaction ID
- Store payment status
- Store payment date
- Store renewal date

Sensitive payment details must NOT be stored directly in MCOMLINKS database.
Use secure third-party payment provider.

---

# 6. Invoices & Receipts

For every successful payment:

System must generate:

- Invoice Number
- Payment Date
- Plan Name
- Amount Paid
- Tax (if applicable)
- Total Amount

Business Owner must be able to:

- View invoice history
- Download invoice (PDF format future enhancement)

Admin must be able to:

- View all invoices
- Filter by date
- Filter by plan
- Filter by agent

---

# 7. Free Trial Logic (Optional)

If Free Trial is enabled:

Admin sets:
- Trial duration (e.g., 14 days)

Trial Flow:

Step 1: Business signs up
Step 2: Trial status = "Trial Active"
Step 3: Business visible in rotator during trial
Step 4: Before trial ends → Reminder notification
Step 5: If no payment → Status becomes "Expired" and removed from rotator

---

# 8. Grace Period Rules

Admin must define grace period (e.g., 7 days after failed payment).

During Grace Period:

- Business may remain visible (configurable)
- Dashboard shows "Payment Due"

After Grace Period:

- Business automatically suspended
- Offers become inactive
- Removed from rotator

This rule must be automatic.

---

# 9. Premium Placement & Add-Ons

Premium businesses may purchase:

1. Priority Rotator Boost
2. Featured Banner Slot
3. Seasonal Campaign Highlight

Admin must configure:

- Price
- Duration (7 days, 30 days, etc.)
- Placement weight multiplier

Once purchased:

- Boost automatically applied in rotator logic
- Boost expires automatically

System must log start and end date of boost.

---

# 10. Agent Commission Tracking (If Applicable)

If agents earn commission:

System must track:

- Business assigned to agent
- Subscription amount paid
- Commission percentage
- Commission earned

Admin must be able to export:

- Monthly commission report

This is reporting only.
Payment to agents handled outside system.

---

# 11. Refund Logic

Admin must have ability to:

- Issue partial refund
- Issue full refund

When refund occurs:

- System logs reason
- Adjust subscription status if needed
- Notify business

Refund must not automatically extend subscription unless manually configured.

---

# 12. Plan Upgrade & Downgrade Rules

Upgrade Flow:

- Business selects higher plan
- Immediate payment required
- Plan benefits activate immediately
- Billing cycle resets or prorated (Admin configurable)

Downgrade Flow:

- Downgrade scheduled for next billing cycle
- Benefits reduce after current cycle ends

System must prevent:

- Downgrade if active offers exceed new plan limit

---

# 13. Suspension & Reactivation

Suspension Triggers:

- Non-payment
- Admin manual suspension
- Policy violation

When suspended:

- All offers hidden
- Removed from rotator
- Dashboard shows "Account Suspended"

Reactivation:

- Payment made or Admin restores
- Status becomes Active
- Offers return to rotator eligibility

---

# 14. Reporting & Financial Dashboard (Admin)

Admin must see:

- Total Monthly Revenue
- Active Subscriptions Count
- Revenue by Plan Type
- Revenue by Agent Portfolio
- Churn Rate
- Trial Conversion Rate

Data must be exportable.

---

# 15. Security & Compliance

System must:

- Use secure payment gateway
- Not store raw card details
- Log all billing actions
- Restrict billing access to Admin only

Business Owners can only see their own billing.
Agents can only see summary (no payment details).

---

# FINAL SUMMARY

The MCOMLINKS Monetization & Billing System must:

1. Manage subscription plans
2. Process recurring payments
3. Control rotator eligibility based on payment
4. Generate invoices
5. Handle trials and grace periods
6. Manage upgrades and downgrades
7. Support premium placement add-ons
8. Track commissions (if required)
9. Provide full financial reporting for Admin

Billing status directly controls visibility in the rotator.

If payment stops, visibility stops.

This ensures revenue protection and system sustainability.

