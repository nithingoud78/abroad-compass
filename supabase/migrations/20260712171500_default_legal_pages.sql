-- Migration: Insert default professional legal pages for Abroad Compass

INSERT INTO public.legal_pages (slug, title, content_md, updated_at)
VALUES 
(
  'about',
  'About Us',
  '# About Abroad Compass

Welcome to **Abroad Compass**, your dedicated companion for navigating the journey to study in Germany. 

## Our Mission
Our mission is to simplify the complex and often overwhelming process of applying to German universities, securing a visa, and integrating into a new culture. We believe that international education should be accessible, and the bureaucratic hurdles should not stand in the way of your dreams.

## Our Vision
We envision a world where every aspiring student can seamlessly transition to studying in Germany, fully equipped with the knowledge, tools, and community support they need to thrive both academically and personally.

## What is Abroad Compass?
Abroad Compass is a comprehensive study-abroad platform specifically designed for Germany. Whether you are taking your first steps by researching universities, preparing for language exams like IELTS or Goethe, or navigating the APS and TestAS requirements, our platform brings everything into one unified dashboard.

## Who is it for?
We built this platform for international students worldwide who are planning to pursue their Bachelor''s, Master''s, or Doctoral studies in Germany. 

## Features
- **Progress Tracking:** Step-by-step guidance from initial research to arrival in Germany.
- **Language & Exam Prep:** Integrated tools for tracking IELTS, TestAS, and German language proficiency (A1-C1).
- **Budget Planning:** Accurate estimators for blocked accounts and living expenses.
- **Visa Planning:** Clear checklists for APS certificates and German Student Visa applications.
- **Community:** Connect with fellow students and share experiences.

## Contact Statement
We are continuously evolving to meet the needs of our students. If you have any questions, feedback, or need assistance, please do not hesitate to reach out to our team via the Contact page.
',
  now()
),
(
  'privacy',
  'Privacy Policy',
  '# Privacy Policy

**Effective Date:** July 12, 2026

At Abroad Compass, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our platform to plan your studies in Germany.

## Information We Collect
We collect information that you voluntarily provide when creating an account, filling out your profile, or interacting with our tools. This may include:
- **Personal Details:** Name, email address, and profile picture.
- **Academic Information:** Target universities, intended courses, APS status, and TestAS scores.
- **Language Proficiency:** Self-reported or official scores for IELTS, Goethe, or other language certifications.

## Authentication
We use industry-standard authentication (powered by Supabase) to ensure your login credentials are secure. We do not store your raw passwords on our servers.

## Cookies
We use cookies to maintain your session and remember your preferences. Please refer to our [Cookie Policy](/legal/cookies) for more details.

## Analytics
We collect anonymized usage data to understand how our users interact with Abroad Compass. This helps us improve our features, such as the Budget Planner and Progress Tracker. We do not sell this data to third parties.

## Data Storage & Security
Your data is stored securely in encrypted databases. We implement strict Row Level Security (RLS) to ensure that only you can access your personal planning data and documents.

## Third-Party Services
We may integrate with third-party APIs (e.g., AI tools for essay review or mapping services). When using these features, only the strictly necessary data is shared under secure protocols.

## Your Rights
You have the right to access, modify, or delete your personal data at any time. You can manage your account directly from your Profile settings or request complete data deletion by contacting support.

## Contact Us
If you have any questions about this Privacy Policy, please contact us at privacy@abroadcompass.com.
',
  now()
),
(
  'terms',
  'Terms & Conditions',
  '# Terms & Conditions

**Effective Date:** July 12, 2026

By accessing or using Abroad Compass, you agree to be bound by these Terms & Conditions.

## 1. Acceptance of Terms
By creating an account, you confirm that you have read, understood, and agreed to these terms. If you do not agree, please do not use our platform.

## 2. User Responsibilities
You are responsible for the accuracy of the information you input into your tracking dashboard. Abroad Compass provides tools for organization and planning, but you are solely responsible for meeting actual university, APS, TestAS, and visa deadlines.

## 3. Account Usage
You must maintain the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.

## 4. Intellectual Property
All content, design, and code on Abroad Compass (excluding user-generated content) are the intellectual property of Abroad Compass. You may not copy, reproduce, or distribute our platform features without explicit permission.

## 5. Service Availability
While we strive for 100% uptime, we do not guarantee uninterrupted access to the platform. We reserve the right to perform maintenance or updates that may temporarily restrict access.

## 6. Prohibited Activities
Users must not use the platform to distribute spam, upload malicious files, or attempt to breach our security systems. Any such activities will result in immediate account termination.

## 7. Termination
We reserve the right to suspend or terminate your account at any time if you violate these terms.

## 8. Governing Law
These terms are governed by the laws applicable to international digital services. Any disputes shall be resolved in the appropriate jurisdiction where Abroad Compass operates.
',
  now()
),
(
  'disclaimer',
  'Disclaimer',
  '# Disclaimer

**Effective Date:** July 12, 2026

## Educational Purposes Only
Abroad Compass is designed as an organizational and educational tool to assist students planning to study in Germany. The checklists, budget calculators, and progress trackers provided are meant for guidance only.

## No Legal or Immigration Advice
We are **not** an official government entity, embassy, or legal firm. The information provided regarding German Student Visas, Blocked Accounts, and APS certificates does not constitute legal or immigration advice.

## University Requirements
Universities in Germany frequently update their admission requirements, application portals (like uni-assist), and language prerequisites (IELTS, TestDaF, Goethe). While we strive to keep our general guides updated, **we do not guarantee the accuracy of institutional requirements.**

## Verification is Required
Users must always verify deadlines, required documents, and procedures directly with the official sources, such as:
- The specific German university''s official website.
- The German Embassy or Consulate in your home country.
- The Akademische Prüfstelle (APS) official portal.
- DAAD (Deutscher Akademischer Austauschdienst).

Abroad Compass shall not be held liable for any rejected applications, missed deadlines, or financial losses incurred while using the platform.
',
  now()
),
(
  'cookies',
  'Cookie Policy',
  '# Cookie Policy

**Effective Date:** July 12, 2026

Abroad Compass uses cookies to enhance your experience. This policy explains what cookies are and how we use them.

## What Are Cookies?
Cookies are small text files stored on your device when you visit a website. They help the site remember your actions and preferences over time.

## Essential Cookies
These cookies are strictly necessary for the platform to function. They include:
- **Authentication Cookies:** To keep you securely logged in as you navigate between your Dashboard, Blog, and Profile.
- **Security Cookies:** To protect against CSRF attacks and ensure data integrity.

## Analytics Cookies
We use analytics cookies to understand how our users interact with our features (e.g., how often the Budget Planner is used versus the Application Tracker). This data is anonymized and helps us prioritize new features.

## Preference Cookies
These cookies remember your personalized settings, such as your UI theme (Light/Dark mode) or preferred language settings.

## Managing Cookies
You can control or delete cookies through your browser settings. However, please note that disabling Essential or Authentication cookies will prevent you from logging into Abroad Compass and using your personalized dashboard.
',
  now()
),
(
  'contact',
  'Contact Us',
  '# Contact Us

We’re here to help you navigate your journey to Germany! Whether you have a question about the platform, need technical support, or want to explore partnership opportunities, you can reach out to us.

## Support
Having trouble with your dashboard, visa tracker, or account settings? Our support team is ready to assist.
- **Email:** support@abroadcompass.com
- **Response Time:** We aim to respond to all inquiries within 24-48 business hours.

## Business Inquiries
Are you a university, language school, or service provider looking to partner with Abroad Compass? We’d love to hear from you.
- **Email:** partnerships@abroadcompass.com

## Feedback
Your feedback drives our development. If you have feature requests (e.g., adding a new language test or university portal to our tracking), please let us know!
- **Email:** feedback@abroadcompass.com

---

### Future Office Location
*Abroad Compass GmbH (Coming Soon)*  
Berlin, Germany

### Connect With Us
Stay updated with the latest news on studying in Germany, scholarship deadlines, and platform updates.
- [Twitter / X](#)
- [LinkedIn](#)
- [Instagram](#)
'
  ,now()
)
ON CONFLICT (slug) DO UPDATE 
SET 
  title = EXCLUDED.title,
  content_md = EXCLUDED.content_md,
  updated_at = EXCLUDED.updated_at;
