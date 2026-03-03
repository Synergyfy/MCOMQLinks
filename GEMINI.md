# MCOMLINKS - Project Context & Guidelines

## 1. Project Overview
MCOMLINKS is a centralized, automated "Rotator System" designed to revitalize high-street commerce. It transforms physical storefronts into dynamic digital billboards triggered by QR codes or NFC taps.

**Core Vision:** A "set-and-forget" marketing machine that helps local businesses make money through automated, sequential offer rotation, centralized control, and seasonal automation.

---

## 2. The Core Engine: The Rotator
The heart of the system is the **Rotator Logic**. It is NOT a static directory; it is a sequential engine.
- **Sequential Delivery:** Each scan triggers the *next* offer in a global list (Scan 1 -> Offer A, Scan 2 -> Offer B).
- **Persistent Memory:** The system must remember the last shown offer across thousands of concurrent scans.
- **Looping:** When the list ends, it automatically resets to the first offer.
- **Never Blank:** The system must fallback to a branded default if no offers are active. No 404s or error pages.

---

## 3. System Architecture
The platform consists of five interconnected modules:

### A. Front-Facing Storefront (Consumer Experience)
- **Trigger:** QR Code / NFC at a physical location.
- **Entry Point:** Dynamic route (`/r/{location-id}`) that calls the rotator engine.
- **Layout:** Fixed, mobile-first template (Header, Offer Block, CTA, Trust Section, Footer).
- **Engagement:** Tracking scans, clicks (CTAs), and claims (forms/redemptions).

### B. Admin Platform (The Brain)
- **Role:** Full control over the entire ecosystem.
- **Management:** Locations, Rotators, Offers, Businesses, Agents, and Global Templates.
- **Automation:** Setting seasonal dates (Winter, Spring, etc.) and priority override rules.
- **Monitoring:** System health, error logs, and global analytics ("Gold Dust").

### C. Agents Platform (Relationship Management)
- **Role:** Field agents onboarding businesses and managing portfolios.
- **Focus:** Onboarding, drafting offers for Admin approval, and tracking business performance.
- **Restrictions:** No control over rotator logic or system rules.

### D. Business Owner Dashboard (Content Management)
- **Role:** Content visibility and performance tracking for individual shop owners.
- **Features:** Create/Edit offer drafts, view scan/claim metrics, and communicate with Agents.
- **Workflow:** Submit offer -> Agent Review -> Admin Approval -> Live in Rotator.

### E. Monetization & Billing (Sustainability)
- **Model:** Monthly subscriptions (Basic/Premium) + Premium placement upgrades.
- **Rule:** **No Payment = No Visibility.** Billing status directly controls rotator eligibility.
- **Automated Actions:** Grace periods, automatic suspension on failed payment, and pro-rated upgrades.

---

## 4. Key Business Rules & Constraints
- **Centralized Control:** Individual shops cannot redesign the storefront; branding is consistent across the high street.
- **Storefront as Billboard:** The display is a controlled advertising panel, not a personal website for the shop.
- **Priority Overrides:** Premium tiers or "Boosts" allow offers to appear first or more frequently for a limited time before returning to normal rotation.
- **Seasonal Automation:** Offers can be tagged to seasons (Winter, Summer, etc.) and activate/deactivate automatically based on preset dates.
- **Data Tracking:** Every scan, click, and claim must be logged for optimization and reporting.

---

## 5. Technical Principles
- **Performance:** Load time under 3 seconds; mobile-first design.
- **Reliability:** Handle high concurrent traffic without resetting the rotation pointer.
- **Simplicity:** "If it needs explaining, it isn't finished." Interfaces for Admin and Business Owners must be intuitive and non-technical.
- **Security:** Secure payment handling (Stripe/similar), role-based access control, and protection against "offer farming."

---

## 6. Implementation Checklist (High Level)
1. [ ] **Infrastructure:** Setup Backend (NestJS) and Frontend (React/Vite).
2. [ ] **Rotator Engine:** Implement sequential logic with atomic state management for pointer tracking.
3. [ ] **Admin/Agent/Business Dashboards:** Build the multi-tenant management interfaces.
4. [ ] **Storefront:** Create the high-performance, fixed-layout consumer view.
5. [ ] **Billing Integration:** Connect subscription management to the rotator eligibility logic.
