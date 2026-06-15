
import type { ApplicantForm } from '@/lib/applicants';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  password: string;
  role: string;
  panelId?: number;
}

export interface Student {
  id: string;
  regNo: string;
  name: string;
  timing: string;
  panelId: number;
  status: 'pending' | 'interviewing' | 'completed';
  form?: ApplicantForm;
}

export interface Rating {
  studentId: string;
  panelistId: string;
  scores: Record<string, number | string[]>;
  comment: string;
  bestDomain: string;
  domainPriorities: string[];
  submitted: boolean;
  active: boolean;
}

export const CRITERIA = [
  'Interview Score'
];

export const DOMAIN_OPTIONS = [
  'Content Creation & Social Media',
  'Event Management & Operations',
  'Outreach & Public Relations',
  'Documentation & Administration'
];

export const RANKING_TABS = ['all', ...DOMAIN_OPTIONS] as const;

export const DOMAIN_PRIORITY_POINTS = [3, 2, 1];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Aarnav', phone: '7355037343', password: '4821', role: 'Head of Events' },
  { id: 'u2', name: 'Somyadeepa', phone: '6290450096', password: '1937', role: 'Head of Events' },
  { id: 'u3', name: 'Manaswini', phone: '9867451329', password: '6502', role: 'Head of Events' },
  { id: 'u4', name: 'Sharanya', phone: '9663922320', password: '2745', role: 'Head of Events' },
  { id: 'u5', name: 'Manya', phone: '9811686180', password: '3158', role: 'Head of Marketing' },
  { id: 'u6', name: 'Snigdha', phone: '7428028155', password: '7094', role: 'Head of Marketing' },
  { id: 'u7', name: 'Aarushi', phone: '9821043947', password: '5612', role: 'Head of Marketing' },
  { id: 'u8', name: 'Pragya', phone: '8292213965', password: '8472', role: 'Head of Creatives' },
  { id: 'u9', name: 'Yagyansh', phone: '7987050428', password: '1209', role: 'Head of Creatives' },
  { id: 'u10', name: 'Ansh', phone: '7976125345', password: '3348', role: 'Head of Operations' },
  { id: 'u11', name: 'Akshat', phone: '9122250442', password: '9051', role: 'Head of Operations' },
  { id: 'u12', name: 'Itisha', phone: '7007828096', password: '4763', role: 'Head of Operations' },
  { id: 'u13', name: 'Nandan', phone: '7355037343', password: '4821', role: 'Head of Administration' },
  { id: 'u14', name: 'Gagneet', phone: '9321748849', password: '2187', role: 'superadmin' },
  { id: 'u15', name: 'Shishir', phone: '6301485530', password: '6720', role: 'Head of Finance' },
  { id: 'u16', name: 'Kanishka', phone: '9893984824', password: '1536', role: 'Head of Finance' },
  { id: 'u17', name: 'Ojas', phone: '9322411079', password: '7843', role: 'President' },
  { id: 'u18', name: 'Pihu', phone: '9307509958', password: '2095', role: 'Vice-President' },
  { id: 'u19', name: 'Vedica', phone: '8368864911', password: '4682', role: 'Senior Board' },
  { id: 'u20', name: 'Asmi', phone: '9923112488', password: '3951', role: 'Senior Board' },
  { id: 'u21', name: 'Arsh', phone: '9599917331', password: '5874', role: 'Senior Board' },
  { id: 'u22', name: 'Nandan Patil', phone: '9119140010', password: '0010', role: 'Head of Administration' },
  { id: 'senior-1', name: 'Senior Panelist A', email: 'senior1@interview.com', phone: '9000000001', password: 'pass', role: 'senior', panelId: 1 },
  { id: 'junior-1', name: 'Junior Panelist A', email: 'junior1@interview.com', phone: '9000000002', password: 'pass', role: 'junior', panelId: 1 },
  { id: 'senior-2', name: 'Senior Panelist B', email: 'senior2@interview.com', phone: '9000000003', password: 'pass', role: 'senior', panelId: 2 },
  { id: 'junior-2', name: 'Junior Panelist B', email: 'junior2@interview.com', phone: '9000000004', password: 'pass', role: 'junior', panelId: 2 }
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 's16', regNo: '2504070024', name: 'Prashant', timing: '5:30 PM-5:40 PM', panelId: 1, status: 'pending' },
  { id: 's22', regNo: '2503090062', name: 'Akshit Sharma', timing: '5:30 PM-5:40 PM', panelId: 2, status: 'pending' },
  { id: 's34', regNo: '2506110090', name: 'Anshi Sisodia', timing: '5:40 PM-5:50 PM', panelId: 1, status: 'pending' },
  { id: 's29', regNo: '2503080038', name: 'Anushna Saxena Dixit', timing: '5:40 PM-5:50 PM', panelId: 2, status: 'pending' },
  { id: 's15', regNo: '2506030073', name: 'Aadya Goenka', timing: '5:50 PM-6:00 PM', panelId: 1, status: 'pending' },
  { id: 's5', regNo: '2502050013', name: 'Avika Dwivedi', timing: '5:50 PM-6:00 PM', panelId: 2, status: 'pending' },
  { id: 's3', regNo: '2502052774', name: 'Akshat Dwivedi', timing: '6:00 PM-6:10 PM', panelId: 1, status: 'pending' },
  { id: 's17', regNo: '2502050902', name: 'Debendra Nath Bandyopadhyay', timing: '6:00 PM-6:10 PM', panelId: 2, status: 'pending' },
  { id: 's10', regNo: '2506030308', name: 'Anjali Nirvikar', timing: '6:10 PM-6:20 PM', panelId: 1, status: 'pending' },
  { id: 's21', regNo: '2503090034', name: 'Arnav Asrani', timing: '6:20 PM-6:30 PM', panelId: 1, status: 'pending' },
  { id: 's33', regNo: '2502052007', name: 'Hiten Singh', timing: '6:20 PM-6:30 PM', panelId: 2, status: 'pending' },
  { id: 's18', regNo: '2503080359', name: 'Atharva Sinha', timing: '6:30 PM-6:40 PM', panelId: 1, status: 'pending' },
  { id: 's12', regNo: '2506070046', name: 'Kaushiki Agrawal', timing: '6:30 PM-6:40 PM', panelId: 2, status: 'pending' },
  { id: 's13', regNo: '2507020033', name: 'Ayushi Mohakhire', timing: '6:40 PM-6:50 PM', panelId: 1, status: 'pending' },
  { id: 's6', regNo: '2502050453', name: 'Kaustav Halder', timing: '6:40 PM-6:50 PM', panelId: 2, status: 'pending' },
  { id: 's36', regNo: '2502051287', name: 'Blessy Priyani', timing: '6:50 PM-7:00 PM', panelId: 1, status: 'pending' },
  { id: 's25', regNo: '2502052050', name: 'Lolla Apurva Devi', timing: '6:50 PM-7:00 PM', panelId: 2, status: 'pending' },
  { id: 's7', regNo: '2502050414', name: 'Dhairya Malhotra', timing: '7:00 PM-7:10 PM', panelId: 1, status: 'pending' },
  { id: 's24', regNo: '2502050582', name: 'Rajeev Borra', timing: '7:00 PM-7:10 PM', panelId: 2, status: 'pending' },
  { id: 's40', regNo: '2503130024', name: 'Harsh Agarwal', timing: '7:30 PM-7:40 PM', panelId: 1, status: 'pending' },
  { id: 's28', regNo: '2502052617', name: 'Ridhima Gurung', timing: '7:30 PM-7:40 PM', panelId: 2, status: 'pending' },
  { id: 's20', regNo: '2502052148', name: 'Ivan Goel', timing: '7:40 PM-7:50 PM', panelId: 1, status: 'pending' },
  { id: 's41', regNo: '2504010048', name: 'Ridhima Heera', timing: '7:40 PM-7:50 PM', panelId: 2, status: 'pending' },
  { id: 's26', regNo: '2502051927', name: 'Kavya Das', timing: '7:50 PM-8:00 PM', panelId: 1, status: 'pending' },
  { id: 's4', regNo: '2503110062', name: 'Ronak Adwani', timing: '7:50 PM-8:00 PM', panelId: 2, status: 'pending' },
  { id: 's35', regNo: '2506010168', name: 'Kudrat Shergill', timing: '8:00 PM-8:10 PM', panelId: 1, status: 'pending' },
  { id: 's32', regNo: '2508020015', name: 'Ruhee Jiwani', timing: '8:00 PM-8:10 PM', panelId: 2, status: 'pending' },
  { id: 's2', regNo: '2502050256', name: 'Lokesh Kumar Singh', timing: '8:10 PM-8:20 PM', panelId: 1, status: 'pending' },
  { id: 's11', regNo: '2503020040', name: 'Sara Sharma', timing: '8:10 PM-8:20 PM', panelId: 2, status: 'pending' },
  { id: 's23', regNo: '2502052826', name: 'Manasvee Gupta', timing: '8:20 PM-8:30 PM', panelId: 1, status: 'pending' },
  { id: 's37', regNo: '2427010004', name: 'Shaurya Jasrotia', timing: '8:20 PM-8:30 PM', panelId: 2, status: 'pending' },
  { id: 's30', regNo: '2421040026', name: 'Mohak', timing: '8:30 PM-8:40 PM', panelId: 1, status: 'pending' },
  { id: 's27', regNo: '2502050514', name: 'Vansh Raj Saini', timing: '8:30 PM-8:40 PM', panelId: 2, status: 'pending' },
  { id: 's38', regNo: '2507020034', name: 'Priyanshu', timing: '8:40 PM-8:50 PM', panelId: 1, status: 'pending' },
  { id: 's19', regNo: '2503090033', name: 'Vikas Sirvi', timing: '8:40 PM-8:50 PM', panelId: 2, status: 'pending' },
  { id: 's42', regNo: '2502050061', name: 'Arshpreet Singh', timing: '8:50 PM-9:00 PM', panelId: 1, status: 'pending' },
  { id: 's39', regNo: '2502052785', name: 'Krishna Tripathi', timing: '8:50 PM-9:00 PM', panelId: 2, status: 'pending' },

  // Day 2 schedule (IDs prefixed with d2- so day data can coexist safely with day 1)
  { id: 'd2-s1', regNo: '2506110090', name: 'Anshi Sisodia', timing: '3:00 PM-3:10 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s2', regNo: '2506070046', name: 'Kaushiki Agrawal', timing: '3:00 PM-3:10 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s3', regNo: '2506030073', name: 'Aadya Goenka', timing: '3:10 PM-3:20 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s4', regNo: '2502050013', name: 'Avika Dwivedi', timing: '3:10 PM-3:20 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s5', regNo: '2502052774', name: 'Akshat Dwivedi', timing: '3:20 PM-3:30 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s6', regNo: '2503020040', name: 'Sara Sharma', timing: '3:20 PM-3:30 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s7', regNo: '2506030308', name: 'Anjali Nirvikar', timing: '3:30 PM-3:40 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s8', regNo: '2502052617', name: 'Ridhima Gurung', timing: '3:30 PM-3:40 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s9', regNo: '2507020033', name: 'Ayushi Saini', timing: '3:40 PM-3:50 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s10', regNo: '2504010048', name: 'Ridhima Heera', timing: '3:40 PM-3:50 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s11', regNo: '2503130024', name: 'Harsh Agarwal', timing: '3:50 PM-4:00 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s12', regNo: '2502050606', name: 'Himanshu Singh', timing: '3:50 PM-4:00 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s13', regNo: '2502051927', name: 'Kavya Das', timing: '4:00 PM-4:10 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s14', regNo: '2502052592', name: 'Krish Rawat', timing: '4:00 PM-4:10 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s15', regNo: '2506010168', name: 'Kudrat Shergill', timing: '4:10 PM-4:20 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s16', regNo: '2502051811', name: 'Aman Shah', timing: '4:10 PM-4:20 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s17', regNo: '2502050256', name: 'Lokesh Kumar Singh', timing: '4:20 PM-4:30 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s18', regNo: '2503080096', name: 'Upasna Madaan', timing: '4:20 PM-4:30 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s19', regNo: '2507020034', name: 'Priyanshu', timing: '4:30 PM-4:40 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s20', regNo: '2502051884', name: 'Vrinda Bhawar', timing: '4:30 PM-4:40 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s21', regNo: '2503120082', name: 'Swwastik Jain', timing: '4:40 PM-4:50 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s22', regNo: '2502050961', name: 'Ridhima Sharma', timing: '4:40 PM-4:50 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s23', regNo: '2502050849', name: 'Yana Mishra', timing: '4:50 PM-5:00 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s24', regNo: '2503090019', name: 'Kevin Bipinbhai Tilala', timing: '4:50 PM-5:00 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s25', regNo: '2502051087', name: 'Aadrit Chatterjee', timing: '5:00 PM-5:10 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s26', regNo: '2503090011', name: 'Parth Agarwal', timing: '5:00 PM-5:10 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s27', regNo: '2502051057', name: 'Mayank Kashyap', timing: '5:10 PM-5:20 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s28', regNo: '2502051471', name: 'Aman Kumar Tiwari', timing: '5:10 PM-5:20 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s29', regNo: '2502052730', name: 'Kruti', timing: '5:20 PM-5:30 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s30', regNo: '2502052815', name: 'Yuvraj Sethi', timing: '5:20 PM-5:30 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s31', regNo: '2502052274', name: 'Siddharth Singh', timing: '5:30 PM-5:40 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s32', regNo: '2502062857', name: 'Mahiraj Singh Rathore', timing: '5:30 PM-5:40 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s33', regNo: '2502051078', name: 'Pranav Magar', timing: '5:40 PM-5:50 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s34', regNo: '2502050458', name: 'Harshita Kapoor', timing: '5:40 PM-5:50 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s35', regNo: '2503130027', name: 'Akshita Gupta', timing: '5:50 PM-6:00 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s36', regNo: '2502052505', name: 'Maulik Gupta', timing: '5:50 PM-6:00 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s37', regNo: '2502051710', name: 'Aazeen Hazariwala', timing: '6:00 PM-6:10 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s38', regNo: '2503020055', name: 'Niharika Singh', timing: '6:00 PM-6:10 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s39', regNo: '2508020088', name: 'Bhavya Sri Suravajhala', timing: '6:10 PM-6:20 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s40', regNo: '2508010066', name: 'Jayantika Kishore', timing: '6:10 PM-6:20 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s41', regNo: '2502052621', name: 'Ishan Srivastava', timing: '6:20 PM-6:30 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s42', regNo: '2506030032', name: 'Mayank Singh', timing: '6:20 PM-6:30 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s43', regNo: '2502050461', name: 'Shruti Agrawal', timing: '6:30 PM-6:40 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s44', regNo: '2508020017', name: 'Trisha Srivastava', timing: '6:30 PM-6:40 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s45', regNo: '2502050498', name: 'Vanshika Goyal', timing: '6:40 PM-6:50 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s46', regNo: '2502051650', name: 'Krishna Kakkar', timing: '6:40 PM-6:50 PM', panelId: 2, status: 'pending' },
  { id: 'd2-s47', regNo: '2503090032', name: 'Atharv Sumesh', timing: '6:50 PM-7:00 PM', panelId: 1, status: 'pending' },
  { id: 'd2-s48', regNo: '2503090005', name: 'Aryan Bareria', timing: '6:50 PM-7:00 PM', panelId: 2, status: 'pending' }
];
