import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { isValidUUID } from '../services/validate';

const router = Router();

const SOW_TEXTS = [
  `Project: Website Redesign for Brightside Marketing

Scope of Work:

1. Homepage redesign with hero section, service highlights, client testimonials
2. About page with team bios and company history
3. Services page (5 service offerings with descriptions)
4. Contact page with form and Google Maps integration
5. Responsive design for desktop, tablet, and mobile
6. SEO optimization including meta tags and sitemap
7. Performance optimization targeting 90+ Lighthouse score
8. CMS integration for blog posts (up to 5 pages)

Exclusions:
- Content writing (client to provide)
- Logo design or branding
- Social media integration
- E-commerce functionality
- Custom illustrations

Timeline: 6 weeks
Budget: $25,000`,
  `Project: Mobile App Development for Nexus Technologies

Scope of Work:

1. User authentication (email, Google, Apple)
2. Dashboard with real-time analytics charts
3. User profile management with avatar upload
4. Push notification system
5. In-app messaging between users
6. Payment integration (Stripe)
7. Admin panel for user management
8. API documentation

Exclusions:
- Third-party CRM integrations
- Custom reporting engine
- White-labeling
- Desktop application version
- Data migration from existing systems

Timeline: 12 weeks
Budget: $75,000`,
];

const REQUEST_SAMPLES = [
  {
    channel: 'email',
    message:
      'Can you also add a blog section with 10 articles and category filtering? We need this by next week.',
    verdict: 'out_of_scope',
    explanation:
      'Blog section with 10 articles goes beyond the CMS integration scope (up to 5 pages) and adds significant content management features not in the SOW.',
  },
  {
    channel: 'slack',
    message:
      'The homepage hero needs to be 50px taller and the CTA button should be more prominent.',
    verdict: 'in_scope',
    explanation:
      'Minor visual adjustment to the homepage hero section, which is explicitly included in the SOW scope.',
  },
  {
    channel: 'email',
    message:
      'Can we integrate Salesforce CRM? Our sales team needs to sync contacts automatically.',
    verdict: 'out_of_scope',
    explanation:
      'Third-party CRM integrations are explicitly listed as exclusions in the SOW.',
  },
  {
    channel: 'slack',
    message:
      'The login screen is missing a "Forgot Password" link. Can we add that?',
    verdict: 'in_scope',
    explanation:
      'Minor UI fix within the authentication scope already defined in the SOW.',
  },
  {
    channel: 'email',
    message:
      'We need a white-label version of the app for our enterprise clients.',
    verdict: 'out_of_scope',
    explanation:
      'White-labeling is explicitly listed as an exclusion in the SOW.',
  },
  {
    channel: 'slack',
    message:
      'Can you add a dark mode toggle to the dashboard?',
    verdict: 'unclear',
    explanation:
      'The SOW does not mention theme customization. This may require additional scoping to determine effort.',
  },
];

router.post('/', async (req: Request, res: Response) => {
  try {
    const { agency_id } = req.body;

    if (!agency_id || !isValidUUID(agency_id)) {
      return res.status(400).json({ error: 'agency_id is required and must be a valid UUID' });
    }

    const { data: agency, error: agencyError } = await supabase()
      .from('agencies')
      .select('id')
      .eq('id', agency_id)
      .single();

    if (agencyError || !agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    const { data: existingClients } = await supabase()
      .from('clients')
      .select('id')
      .eq('agency_id', agency_id)
      .limit(1);

    if (existingClients && existingClients.length > 0) {
      return res.status(200).json({ message: 'Demo data already loaded for this agency' });
    }

    const { data: client1, error: c1Err } = await supabase()
      .from('clients')
      .insert({ agency_id, name: 'Sarah Chen', company: 'Brightside Marketing' })
      .select()
      .single();

    if (c1Err) throw new Error('Failed to create client 1');

    const { data: client2, error: c2Err } = await supabase()
      .from('clients')
      .insert({ agency_id, name: 'Marcus Webb', company: 'Nexus Technologies' })
      .select()
      .single();

    if (c2Err) throw new Error('Failed to create client 2');

    const { error: s1Err } = await supabase().from('sows').insert({
      client_id: client1.id,
      raw_text: SOW_TEXTS[0],
      summary:
        'Website redesign for Brightside Marketing including homepage, about, services, contact pages, responsive design, SEO, performance optimization, and limited CMS integration. Excludes content writing, branding, social media, e-commerce, and custom illustrations. 6-week timeline at $25,000.',
    });

    if (s1Err) throw new Error('Failed to create SOW 1');

    const { error: s2Err } = await supabase().from('sows').insert({
      client_id: client2.id,
      raw_text: SOW_TEXTS[1],
      summary:
        'Mobile app development for Nexus Technologies including auth, analytics dashboard, profile management, push notifications, in-app messaging, Stripe payments, admin panel, and API docs. Excludes CRM integrations, custom reporting, white-labeling, desktop version, and data migration. 12-week timeline at $75,000.',
    });

    if (s2Err) throw new Error('Failed to create SOW 2');

    const requestInserts = REQUEST_SAMPLES.map((s, i) => ({
      client_id: i < 3 ? client1.id : client2.id,
      source_channel: s.channel,
      message_text: s.message,
      ai_verdict: s.verdict,
      explanation: s.explanation,
      status: 'pending',
    }));

    const { error: rErr } = await supabase().from('requests').insert(requestInserts);

    if (rErr) throw new Error('Failed to create requests');

    return res.status(201).json({
      message: 'Demo data loaded successfully',
      clients: [client1, client2],
      requests: requestInserts.length,
    });
  } catch (err) {
    console.error('POST /api/seed error:', err);
    return res.status(500).json({ error: 'Failed to seed data' });
  }
});

export default router;
