# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MCOMLINKS – Admin Platform

---

# 1. Purpose of the Admin Platform

The Admin Platform is the control center of MCOMLINKS.

This is where the company controls:
- All locations
- All rotators
- All offers
- All storefront templates
- All businesses
- All seasonal campaigns
- All priority placements
- All system rules
- All analytics

Important rule:
The Admin controls everything.
Other users (Agents, Business Owners) have limited access.

This is the brain of the system.

---

# 2. Admin Login & Access Control

The Admin system must include:

1. Secure login (email + password)
2. Two-factor authentication (recommended)
3. Role-based access control

Admin Roles Required:

A. Super Admin
- Full access to everything
- Can create and delete locations
- Can reset rotators
- Can override offers
- Can manage users

B. Operations Admin
- Can create and edit offers
- Can manage storefront templates
- Can manage businesses
- Cannot delete critical system data

C. Analytics Admin
- View-only access
- Can export reports

All actions must be logged (who changed what and when).

---

# 3. Main Admin Dashboard

When an Admin logs in, they must see a clean overview page showing:

- Total Active Locations
- Total Active Businesses
- Total Active Offers
- Total Scans Today
- Total Claims Today
- Top Performing Location
- Top Performing Offer

Quick action buttons:
- Create Location
- Add Business
- Create Offer
- View Rotator Status

Dashboard must be simple and not crowded.

---

# 4. Location Management

A Location represents:
- A high street
- A mall
- A market cluster
- Any grouped business area

Each Location must have:
- Location Name
- City
- Country
- Unique Location ID
- Status (Active / Paused)

Admin must be able to:
- Create new location
- Edit location details
- Pause a location
- Soft delete a location (keep data history)

Each Location automatically has one main Rotator.

---

# 5. Rotator Management (Core Control)

Each Location has one Rotator.

Admin must be able to:

- View the current rotation position (pointer)
- Manually reset pointer to beginning
- Pause the rotator
- Activate the rotator
- View full list of offers in order

Offer Order Control:
- Drag and drop to reorder
OR
- Edit sequence number manually

System must prevent:
- Duplicate sequence numbers
- Empty rotation list

If no active offers exist, system must alert Admin.

---

# 6. Offer Management

Admin must be able to create offers with the following fields:

Required Fields:
- Business Name
- Offer Headline
- Short Description
- Image Upload
- Call-to-Action Type (Claim, Redeem, Visit, etc.)
- Start Date
- End Date
- Assigned Location

Optional Fields:
- Priority status
- Redemption instructions
- External link
- Maximum claim limit
- Seasonal tag

Admin Actions:
- Create offer
- Edit offer
- Pause offer
- Duplicate offer
- Archive offer

Archived offers must remain visible in analytics.

System must automatically:
- Reject invalid date ranges
- Skip expired offers in rotation

---

# 7. Priority / Featured Placement Control

Admin must have a "Priority Campaign" section.

Admin can:
- Select an offer
- Set priority start date
- Set priority end date
- Choose priority type:
  1. Full Override (always shows first)
  2. Scheduled Appearance (appears every X scans)

When priority period ends:
System must automatically return to normal rotation.

No manual switching required.

---

# 8. Seasonal Campaign Manager

Admin must define seasons once per year:
- Winter
- Spring
- Summer
- Autumn

Each season must have:
- Start date
- End date

Offers can be assigned to:
- A specific season
OR
- Always active

System must automatically:
- Activate seasonal offers at start date
- Deactivate when season ends

No manual activation required each time.

---

# 9. Storefront Template Control

Admin controls the global storefront design.

Admin can:
- Edit header text
- Edit footer text
- Change brand colors
- Upload global logos

Admin cannot allow individual businesses to redesign the layout.

Template changes must apply instantly across all locations.

---

# 10. Business Management

Admin must manage business profiles with:

- Business Name
- Contact Person
- Phone
- Email
- Assigned Location
- Status (Active / Suspended)

Admin must be able to:
- Suspend business
- Remove business from rotation
- View business performance

Suspending a business must automatically deactivate its offers.

---

# 11. Analytics & Reporting

Admin must see analytics by:

Location:
- Total scans
- Total claims
- Conversion rate

Offer:
- Impressions
- Clicks
- Claims

Business:
- Performance ranking

System must support:
- Date range filters
- CSV export

Analytics should update near real time.

---

# 12. System Monitoring

Admin must see:
- Rotator status (Running / Paused)
- Error logs
- Failed scans
- System uptime

Admin must receive alerts if:
- Rotator has zero active offers
- Server errors increase
- Priority conflicts occur

---

# 13. Security & Protection

Admin platform must include:

- Role-based permissions
- Activity log history
- Confirmation before destructive actions
- Secure data handling

No critical change without confirmation prompt.

---

# 14. Data Backup & Retention

System must include:
- Automatic daily backups
- Restore capability
- Long-term scan history retention

Data must not be permanently deleted accidentally.

---

# 15. Performance Requirements

Admin system must:
- Load under 3 seconds
- Handle thousands of businesses
- Handle large scan volumes
- Scale as locations grow

---

# 16. Admin Experience Principles

The Admin side must feel:
- Clean
- Structured
- Logical
- Easy to use

No complicated menus.
No confusing settings.

If explanation is required for basic tasks, interface must be simplified.

---

# FINAL SUMMARY

The MCOMLINKS Admin Platform must:

1. Control all locations
2. Control all rotators
3. Manage offer sequence
4. Manage priority placements
5. Manage seasonal campaigns
6. Control storefront template
7. Manage businesses
8. Track analytics
9. Monitor system health
10. Protect system security
11. Run reliably without constant manual correction

This is the command center of MCOMLINKS.

