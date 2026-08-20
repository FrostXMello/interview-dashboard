import { canonicalizeDomain, extractPreferredDomains, skillRating, DOMAIN_OPTIONS } from './data';
import { describe, expect, it } from 'vitest';

describe('domain helpers', () => {
  it('maps old long domain strings onto the five current domains', () => {
    const raw =
      'Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)';
    expect(extractPreferredDomains(raw)).toEqual([
      'Content Creation and Social Media',
      'Event Management and Operations',
      'Outreach and Public Relations'
    ]);
  });

  it('keeps official comma-separated domains in applicant order', () => {
    expect(
      extractPreferredDomains(
        'Event Management and Operations, Outreach and Public Relations, Graphic Designing & Video Editing'
      )
    ).toEqual([
      'Event Management and Operations',
      'Outreach and Public Relations',
      'Graphic Designing & Video Editing'
    ]);
  });

  it('does not split on commas inside domain parentheses', () => {
    expect(
      extractPreferredDomains('Content Creation & Social Media Management (Design, Writing, Scheduling)')
    ).toEqual(['Content Creation and Social Media']);
  });

  it('canonicalizes legacy short names', () => {
    expect(canonicalizeDomain('Content Creation & Social Media')).toBe('Content Creation and Social Media');
    expect(canonicalizeDomain('Documentation & Administration')).toBe('Documentation and Administrative Support');
    expect(DOMAIN_OPTIONS).toHaveLength(5);
  });

  it('reads camelCase self-ratings', () => {
    expect(skillRating({ communication: 'Good', timeManagement: 'Excellent' }, 'Communication')).toBe('Good');
    expect(skillRating({ communication: 'Good', timeManagement: 'Excellent' }, 'Time Management')).toBe('Excellent');
    expect(skillRating({ communication: 'Good' }, 'Graphic Design')).toBe('—');
  });
});
