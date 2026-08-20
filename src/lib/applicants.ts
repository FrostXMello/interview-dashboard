/**
 * DEMO / SYNTHETIC application forms only.
 * No real personal information. Safe to ship in the client bundle for offline-demo mode.
 */

export interface ApplicantForm {
  timestamp?: string;
  fullName?: string;
  regNo?: string;
  email?: string;
  phone?: string;
  program?: string;
  whyInterested?: string;
  domains?: string;
  proficiencies?: Record<string, string>;
  commitment?: number;
  experience?: string;
  cvLink?: string;
}

const DOMAIN_CONTENT = 'Content Creation and Social Media';
const DOMAIN_EVENTS = 'Event Management and Operations';
const DOMAIN_OUTREACH = 'Outreach and Public Relations';
const DOMAIN_DOCS = 'Documentation and Administrative Support';

/** Synthetic applicants aligned with demo candidate reg numbers. */
const APPLICANTS: ApplicantForm[] = [
  {
    timestamp: '2026-03-01T10:00:00Z',
    fullName: 'Alex Rivera',
    regNo: 'DEMO-1001',
    email: 'alex.rivera@example.com',
    phone: '5550101001',
    program: 'B.Tech Computer Science',
    whyInterested: 'I want to help welcome international students and run inclusive campus events.',
    domains: `${DOMAIN_CONTENT}, ${DOMAIN_EVENTS}`,
    proficiencies: {
      Communication: 'Excellent',
      'Time Management': 'Good',
      'Team Work': 'Excellent',
      'Graphic Design': 'Average'
    },
    commitment: 5,
    experience: 'Organized two campus club meetups as a volunteer coordinator.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-01T10:05:00Z',
    fullName: 'Jordan Lee',
    regNo: 'DEMO-1002',
    email: 'jordan.lee@example.com',
    phone: '5550101002',
    program: 'BBA',
    whyInterested: 'I enjoy public speaking and would like to support outreach programs.',
    domains: `${DOMAIN_OUTREACH}, ${DOMAIN_DOCS}`,
    proficiencies: {
      Communication: 'Excellent',
      'Time Management': 'Excellent',
      'Team Work': 'Good',
      'Graphic Design': 'Average'
    },
    commitment: 4,
    experience: 'Debate society member; helped draft event proposals.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-01T10:10:00Z',
    fullName: 'Sam Patel',
    regNo: 'DEMO-1003',
    email: 'sam.patel@example.com',
    phone: '5550101003',
    program: 'B.Des',
    whyInterested: 'I want to create social content that showcases campus culture.',
    domains: DOMAIN_CONTENT,
    proficiencies: {
      Communication: 'Good',
      'Time Management': 'Good',
      'Team Work': 'Excellent',
      'Graphic Design': 'Excellent'
    },
    commitment: 5,
    experience: 'Designed posters for a student festival.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-01T10:15:00Z',
    fullName: 'Casey Nguyen',
    regNo: 'DEMO-1004',
    email: 'casey.nguyen@example.com',
    phone: '5550101004',
    program: 'B.Tech IT',
    whyInterested: 'Operations work appeals to me; I like structured execution.',
    domains: `${DOMAIN_EVENTS}, ${DOMAIN_DOCS}`,
    proficiencies: {
      Communication: 'Good',
      'Time Management': 'Excellent',
      'Team Work': 'Good',
      'Graphic Design': 'Average'
    },
    commitment: 4,
    experience: 'Logistics volunteer for a hackathon.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-01T10:20:00Z',
    fullName: 'Riley Brooks',
    regNo: 'DEMO-1005',
    email: 'riley.brooks@example.com',
    phone: '5550101005',
    program: 'BA Psychology',
    whyInterested: 'I care about peer support and clear documentation for newcomers.',
    domains: `${DOMAIN_DOCS}, ${DOMAIN_OUTREACH}`,
    proficiencies: {
      Communication: 'Excellent',
      'Time Management': 'Average',
      'Team Work': 'Excellent',
      'Graphic Design': 'Average'
    },
    commitment: 5,
    experience: 'Peer mentor for first-year students.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-01T10:25:00Z',
    fullName: 'Taylor Kim',
    regNo: 'DEMO-1006',
    email: 'taylor.kim@example.com',
    phone: '5550101006',
    program: 'B.Tech Electronics',
    whyInterested: 'I want hands-on event production experience.',
    domains: DOMAIN_EVENTS,
    proficiencies: {
      Communication: 'Average',
      'Time Management': 'Good',
      'Team Work': 'Excellent',
      'Graphic Design': 'Good'
    },
    commitment: 3,
    experience: 'Stage crew for a college cultural night.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-02T09:00:00Z',
    fullName: 'Morgan Shah',
    regNo: 'DEMO-2001',
    email: 'morgan.shah@example.com',
    phone: '5550102001',
    program: 'B.Com',
    whyInterested: 'Interested in administration and keeping records accurate.',
    domains: DOMAIN_DOCS,
    proficiencies: {
      Communication: 'Good',
      'Time Management': 'Excellent',
      'Team Work': 'Good',
      'Graphic Design': 'Average'
    },
    commitment: 4,
    experience: 'Treasurer for a small student club.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-02T09:05:00Z',
    fullName: 'Avery Chen',
    regNo: 'DEMO-2002',
    email: 'avery.chen@example.com',
    phone: '5550102002',
    program: 'B.Tech AI',
    whyInterested: 'I enjoy storytelling on social platforms and campus updates.',
    domains: `${DOMAIN_CONTENT}, ${DOMAIN_OUTREACH}`,
    proficiencies: {
      Communication: 'Excellent',
      'Time Management': 'Good',
      'Team Work': 'Good',
      'Graphic Design': 'Excellent'
    },
    commitment: 5,
    experience: 'Ran a club Instagram account for one semester.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-02T09:10:00Z',
    fullName: 'Quinn Alvarez',
    regNo: 'DEMO-2003',
    email: 'quinn.alvarez@example.com',
    phone: '5550102003',
    program: 'LLB',
    whyInterested: 'I want to improve communication between student groups.',
    domains: DOMAIN_OUTREACH,
    proficiencies: {
      Communication: 'Excellent',
      'Time Management': 'Good',
      'Team Work': 'Excellent',
      'Graphic Design': 'Average'
    },
    commitment: 4,
    experience: 'Student council communications volunteer.',
    cvLink: ''
  },
  {
    timestamp: '2026-03-02T09:15:00Z',
    fullName: 'Jamie Okonkwo',
    regNo: 'DEMO-2004',
    email: 'jamie.okonkwo@example.com',
    phone: '5550102004',
    program: 'B.Tech Mechanical',
    whyInterested: 'Looking to learn event operations end-to-end.',
    domains: `${DOMAIN_EVENTS}, ${DOMAIN_CONTENT}`,
    proficiencies: {
      Communication: 'Good',
      'Time Management': 'Good',
      'Team Work': 'Excellent',
      'Graphic Design': 'Good'
    },
    commitment: 5,
    experience: 'Helped set up exhibition booths at a tech fair.',
    cvLink: ''
  }
];

export default APPLICANTS;
