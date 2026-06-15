
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

const APPLICANTS: ApplicantForm[] = [
  {
    "timestamp": "09/03/2026 15:40:36",
    "fullName": "Aadrit Chatterjee",
    "regNo": "2502051087",
    "email": "aadrit.2502051087@muj.manipal.edu",
    "phone": "7303657943",
    "program": "Btech Cse",
    "whyInterested": "I am interested in joining the working team because it provides an opportunity to interact with students from diverse cultural and academic backgrounds. Additionally, working with the International Student Cell would help me develop teamwork, leadership, and organizational skills while representing the university in a positive way.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "09/03/2026 15:41:04",
    "fullName": "Mayank kashyap",
    "regNo": "2502051057",
    "email": "mayank.2502051057",
    "phone": "9105628285",
    "program": "Btech Cse",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it will give me good exposure and new learning opportunities. I have not worked in an international environment before, so it would be a very interesting experience for me. I would also like to interact with international students and learn about different cultures. Additionally, I am planning to go abroad for higher studies in the future, so this experience will help me understand the international environment better and improve my communication and teamwork skills.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "No",
    "cvLink": ""
  },
  {
    "timestamp": "09/03/2026 15:49:28",
    "fullName": "Ayushi",
    "regNo": "",
    "email": "ayushi.2507020033@muj.manipal.com",
    "phone": "7426860880",
    "program": "BBA LLB",
    "whyInterested": "I have always seeked connecting to more and more people, working at ISC I'll get an opportunity to know people worldwide and network.",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "At case and share initiative (student based NGO) I'm the director of HR and volunteer management. Working with the org I have learned how to manage my time for NGO and studies and also to be proactive in the fields of communication and HR",
    "cvLink": ""
  },
  {
    "timestamp": "09/03/2026 15:57:39",
    "fullName": "2502052730",
    "regNo": "2502052730",
    "email": "hirekerurkriti@gmail.com",
    "phone": "9923465002",
    "program": "Btech CSE",
    "whyInterested": "I have always been interested in meeting people from around the globe. I have always been interested in different cultures, their history and their people. Being part of the international students cell, will help me get to know the world better, through people and their stories.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "Yes, i am part of the club glitch, I am in the media and coverage sect, and I have helped out it their events",
    "cvLink": ""
  },
  {
    "timestamp": "09/03/2026 17:15:18",
    "fullName": "Mohak",
    "regNo": "",
    "email": "mohak.2421040026@muj.manipal.edu",
    "phone": "9794606661",
    "program": "IMBA",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides an opportunity to interact with students from diverse cultural backgrounds and contribute to creating an inclusive environment on campus. As a IMBA student, I want to develop my communication, coordination, and organizational skills through practical experience. Being part of the team will also allow me to assist international students in adapting to campus life while learning teamwork and event management, which will help me grow both personally and professionally.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "No",
    "cvLink": "https://drive.google.com/open?id=10uZqXR45_fQr5mzl75OmTXX2VoCbdqLF"
  },
  {
    "timestamp": "09/03/2026 19:10:55",
    "fullName": "Siddharth singh",
    "regNo": "2502052274",
    "email": "siddharth.2502052274@muj.manipal.edu",
    "phone": "8978578943",
    "program": "Btech cse",
    "whyInterested": "I am interested in joining the international students cell because it provides an opportunity to interact with students from diverse cultures and backgrounds I believe that helping international students feel welcome and supported in a new environment is very important",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "I was part of corporate affairs team in cyberspace club and also used to market their events and manage them",
    "cvLink": "https://drive.google.com/open?id=18EOaIcoxI3_bWFRUnljmYQdcxS3FbZaO"
  },
  {
    "timestamp": "09/03/2026 22:17:33",
    "fullName": "Pranav Magar",
    "regNo": "2502051078",
    "email": "Magar.2502051078@muj.manipal.edu",
    "phone": "8421711104",
    "program": "B.Tech CSE",
    "whyInterested": "For exposure",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Fair",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "10/03/2026 04:40:44",
    "fullName": "Anushka Trivedi",
    "regNo": "2430010076",
    "email": "anushka.2430010076@muj.manipal.edu",
    "phone": "7755804447",
    "program": "Btech CSE data science",
    "whyInterested": "My interest in the International Student Cell is deeply personal. For a long time, I lived and breathed the dream of studying abroad. I want to join the Junior Working Team because I want to be the support system I once looked for.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 3,
    "experience": "Yes, I have significant experience in leadership and social work through my venture, Anudhya Welfare. Founder & Lead, Event Coordination, Teamwork & Communication.",
    "cvLink": "https://drive.google.com/open?id=1w35zYxAQf2bxvTDS0qvi_Bg1Gb6XlvrM"
  },
  {
    "timestamp": "10/03/2026 09:47:01",
    "fullName": "Yana Mishra",
    "regNo": "2502050849",
    "email": "yana.2502050849@muj.manipal.edu",
    "phone": "9352416770",
    "program": "B.Tech CSE",
    "whyInterested": "Being super straightforward I'm interested because I want to explore, make connections, develop skills.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 2,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "10/03/2026 10:04:19",
    "fullName": "Kartik jangid",
    "regNo": "23fm10bba00337",
    "email": "Kartik.23fm10bba00337@muj.manipal.edu",
    "phone": "8003434485",
    "program": "BBA",
    "whyInterested": "Toh Learn about social media",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 1,
    "experience": "Yes",
    "cvLink": ""
  },
  {
    "timestamp": "10/03/2026 10:07:05",
    "fullName": "Piyush Jha",
    "regNo": "2430030106",
    "email": "piyush.2430030106@muj.manipal.edu",
    "phone": "8928701937",
    "program": "B.Tech",
    "whyInterested": "am interested in joining the International Student Cell Junior Working Team because it provides a unique opportunity to interact with students from diverse cultures and help create a welcoming environment for them on campus.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Yes, I have prior experience in volunteer work in Dandiya Night, Logistics Head of ISA, Core Committee of INDGenius.",
    "cvLink": "https://drive.google.com/open?id=1zFXAtk7iPL6prqImnkRSnMAJIbpTtJ07"
  },
  {
    "timestamp": "10/03/2026 10:32:11",
    "fullName": "Swwastik Jain",
    "regNo": "2503120082",
    "email": "swwastik.2503120082@muj.manipal.edu",
    "phone": "9145544795",
    "program": "BTech Mechatronics",
    "whyInterested": "Tu build networks",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Was volunteer in convocation 25",
    "cvLink": ""
  },
  {
    "timestamp": "10/03/2026 12:55:37",
    "fullName": "Himanshu Singh",
    "regNo": "2502050606",
    "email": "himanshu.2502050606@muj.manipal.edu",
    "phone": "9455598776",
    "program": "B. Tech CSE",
    "whyInterested": "I have keen interest in public relations. Being part of this team would allow me to contribute my public speaking and communication skills while also gaining practical experience in teamwork and leadership.",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Fair",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "",
    "cvLink": "https://drive.google.com/open?id=1mD9ITblhFlGCuUlsAOQrE4arWH01OC_X"
  },
  {
    "timestamp": "10/03/2026 17:10:55",
    "fullName": "Ashutosh Sharma",
    "regNo": "2424130161",
    "email": "ashutosh.2424130161@muj.manipal.edu",
    "phone": "8306204169",
    "program": "BCA",
    "whyInterested": "I want to join the ISC Junior Working Team to learn how international programs and collaborations are managed in the university.",
    "domains": "Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 5,
    "experience": "IAESTE - FOREIGN SRO & ITDA COORDINATOR, HackX 3.0, The Cypher technical club, 5th international conference on SSIC, TechIdeate2026 volunteer",
    "cvLink": "https://drive.google.com/open?id=1dnL4kJZ_0cBFZHi_1LESbz_AviWRsdOE"
  },
  {
    "timestamp": "10/03/2026 21:34:14",
    "fullName": "Krishna Tripathi",
    "regNo": "2502052785",
    "email": "krishna.2502052785@muj.manipal.edu",
    "phone": "8299762152",
    "program": "Btech CSE",
    "whyInterested": "Yes",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Randomize-jwt, IEEE-jwt, Techideate-oc, Oneiros-oc(technical)",
    "cvLink": "https://drive.google.com/open?id=1iXyyHaDrxRsxrMLjnaSTSLTuijmVPOOV"
  },
  {
    "timestamp": "10/03/2026 23:18:49",
    "fullName": "Krish Rawat",
    "regNo": "2502052592",
    "email": "krish.2502052592@muj.manipal.edu",
    "phone": "7302805199",
    "program": "B.TECH CSE",
    "whyInterested": "I want to join the International Student Cell Junior Working Team because I see it as a great opportunity to support students, improve my teamwork and communication skills, and contribute to a positive campus environment.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Fair",
      "Graphic Design": "Good"
    },
    "commitment": 3,
    "experience": "Yes I have done coverages on the behalf of Aperture in TechIdeate and ghs carnival",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 01:44:59",
    "fullName": "Hiten Singh",
    "regNo": "2502052007",
    "email": "hiten.2502052007@muj.manipal.edu",
    "phone": "9137167747",
    "program": "B Tech CSE",
    "whyInterested": "Although there are many clubs in the college but what I find interesting about the club that this club has a unique goal as there are many tech clubs, there is dance, photography and other clubs but this one is not set to those barriers and allows you to meet people who are here for some kind of exchange which makes it more engaging to work here.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "",
    "cvLink": "https://drive.google.com/open?id=1OZ0WVbDiohJDeeFw-oWVVjHBZ1wyEdAr"
  },
  {
    "timestamp": "11/03/2026 11:50:05",
    "fullName": "Ridhima Heera",
    "regNo": "2504010048",
    "email": "ridhima.2504010048@muj.manipal.edu",
    "phone": "9599565336",
    "program": "B.Sc (Hons) microbiology 1st year",
    "whyInterested": "I am interested in joining the International Junior Cell Working Team because it provides an opportunity to connect with students from diverse backgrounds and contribute to initiatives that promote global exposure and collaboration on campus.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 12:49:56",
    "fullName": "Akshat Dwivedi",
    "regNo": "2502052774",
    "email": "akshat.2502052774@muj.manipal.edu",
    "phone": "9555456482",
    "program": "Btech CSE",
    "whyInterested": "I want to gain international exposure.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "In the working team of marksoc in events domain.. was part of multiple events",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 12:57:55",
    "fullName": "AMAN SHAH",
    "regNo": "2502051811",
    "email": "aman.2502051811@muj.manipal.edu",
    "phone": "7869099222",
    "program": "B.Tech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it offers an opportunity to interact with students of different cultures and help create a welcoming environment for them.",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, I have prior experience volunteering at a college event. I worked as an OC member in ProdxOps during Oneiros.",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 13:12:22",
    "fullName": "Prakhar Singh",
    "regNo": "2424130052",
    "email": "prakhar.2424130052@muj.manipal.edu",
    "phone": "7060304633",
    "program": "Bca",
    "whyInterested": "For gaining experience",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Fair",
      "Graphic Design": "Good"
    },
    "commitment": 5,
    "experience": "I was the president of science club but In school.",
    "cvLink": "https://drive.google.com/open?id=1OTtIrWy4sDDaUPYX8wFQS6Sth_zFB58l"
  },
  {
    "timestamp": "11/03/2026 13:15:58",
    "fullName": "SHAURYA JASROTIA",
    "regNo": "2427010004",
    "email": "shaurya.2427010004@muj.manipal.edu",
    "phone": "8100276227",
    "program": "B.Tech",
    "whyInterested": "I would love to showcase my communication and networking skills while increasing my connections in the industry as a future employee/entrepreneur.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Previously handled a team in hackathon and event management at an intra club level.",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 16:17:02",
    "fullName": "Harsh agarwal",
    "regNo": "2503130024",
    "email": "harsh.2503130024@muj.manipal.edu",
    "phone": "9000086489",
    "program": "B.tech(RAI)",
    "whyInterested": "Would love to interact and know about different cultures",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 3,
    "experience": "Yes I have helped my club organise a big event and also played a supporting role in many other events",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 16:26:24",
    "fullName": "Akshita Gupta",
    "regNo": "2503130027",
    "email": "akshita.2503130027@muj.manipal.edu",
    "phone": "6386798993",
    "program": "Btech",
    "whyInterested": "woudl love to interact with different people",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 2,
    "experience": "yes i have worked in oneiros oc team",
    "cvLink": ""
  },
  {
    "timestamp": "11/03/2026 19:07:24",
    "fullName": "Kudrat Shergill",
    "regNo": "2506010168",
    "email": "kudrat.2506010168@muj.manipal.edu",
    "phone": "9929951048",
    "program": "BBA Business Analytics",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides a great opportunity to interact with students from diverse cultural backgrounds.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "I have been actively volunteering at NGOs for children and families affected and infected by AIDs. I'm an active member of the Finance Club and Enactus Club of the college.",
    "cvLink": "https://drive.google.com/open?id=1ht9969ya1mVqQ0xTSe5kz_INBjXw7Lh4"
  },
  {
    "timestamp": "11/03/2026 21:43:02",
    "fullName": "Manasvee Gupta",
    "regNo": "2502052826",
    "email": "manasvee.2502052826@muj.manipal.edu",
    "phone": "8957623124",
    "program": "Btech cse",
    "whyInterested": "Passionate about diffrent cultures and super interested in languages, politicaly informed and would love to dedicate a part of my college life to this",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Yes, Qureka (official Quizzing club of manipal) junior working team and successful part of organising Quriosity 6.0 in techideate",
    "cvLink": "https://drive.google.com/open?id=1CiWFEtGeXGNjOnZwwttXxPp5JL9wVDJr"
  },
  {
    "timestamp": "11/03/2026 21:47:20",
    "fullName": "Anshi Sisodia",
    "regNo": "2506110090",
    "email": "anshi.2506110090@muj.manipal.edu",
    "phone": "6378414357",
    "program": "MBA",
    "whyInterested": "To gain experience",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 5,
    "experience": "no",
    "cvLink": "https://drive.google.com/open?id=1wS5w4_8aKn5RBI7pIyJ0-ikM4nYK7u9M"
  },
  {
    "timestamp": "12/03/2026 00:05:59",
    "fullName": "Ivan goel",
    "regNo": "2502052148",
    "email": "Ivan.2502052148@muj.manipal.edu",
    "phone": "9599026883",
    "program": "Btech Cse",
    "whyInterested": "I'm looking to join the ISC Junior Working Team because I'm highly ambitious and want a platform where I can actually make an impact.",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "I'm currently a Finance Coordinator at IAESTE, so I'm already familiar with how things work within the DOIC.",
    "cvLink": "https://drive.google.com/open?id=16Pr6zpf0ZLdBteCUZqCqMAi9amJLKMrP"
  },
  {
    "timestamp": "12/03/2026 00:15:33",
    "fullName": "Priyanshu",
    "regNo": "2507020034",
    "email": "priyanshu.2507020034@muj.manipal.edu",
    "phone": "7988768157",
    "program": "Bba llb",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it will help me interact with students from different cultures, improve my communication skills, and contribute to making international students feel welcome on campus.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Currently working with human rights cell And worked for bhajan club, litmus, indgenius",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 00:46:27",
    "fullName": "Avika Dwivedi",
    "regNo": "2502050013",
    "email": "avika.2502050013@muj.manipal.edu",
    "phone": "8840565988",
    "program": "B. Tech",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I have a strong interest in geopolitics, global collaboration, and international education opportunities.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, I have prior experience in volunteer work and organizing events during my school years.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 01:20:32",
    "fullName": "Ruhee jiwani",
    "regNo": "2508020015",
    "email": "Ruhee.2508020015@muj.manipal.edu",
    "phone": "7483097168",
    "program": "Bsc hons psychology",
    "whyInterested": "I'm interested in joining the International Student Cell because I'm curious about global opportunities and interacting with people from different cultures.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Fair",
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "I have been involved in club activities in my first year and was part of the working team of the Aperture club at MUJ.",
    "cvLink": "https://drive.google.com/open?id=1m012MQOQKKoeF8uiEyn8nS53O3p04al_"
  },
  {
    "timestamp": "12/03/2026 01:37:56",
    "fullName": "Lokesh Kumar Singh",
    "regNo": "2502050256",
    "email": "lokesh.2502050256@muj.manipal.edu",
    "phone": "8787060847",
    "program": "Btech CSE",
    "whyInterested": "Want to connect to more and more people out there to get more exposure and also in order to lift up my communication skills which is very much needed",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes.. Currently in JC of ACM SIGBED CHAPTER in logistics.. worked in curations team for robowars, Worked in events of Techideate",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 08:04:49",
    "fullName": "Vansh Raj Saini",
    "regNo": "2502050514",
    "email": "vansh.2502050514@muj.manipal.edu",
    "phone": "7217287444",
    "program": "BTech CSE",
    "whyInterested": "As my",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 3,
    "experience": "Yes as being prefect in my school played a major role in organising school's founder's day and farewell party. Also played part in MUJ's convocation 2025",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 13:38:17",
    "fullName": "Debendra Nath Bandyopadhyay",
    "regNo": "2502050902",
    "email": "debendra.2502050902@muj.manipal.edu",
    "phone": "9830193679",
    "program": "B.Tech",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides an opportunity to interact with students from diverse cultures and backgrounds.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 5,
    "experience": "Member Of Google Developer Group Manipal Jaipur",
    "cvLink": "https://drive.google.com/open?id=1TBAXIVJOcze-lhgsrXYCmoRK7TLOPWO3"
  },
  {
    "timestamp": "12/03/2026 14:43:51",
    "fullName": "Trisha Srivastava",
    "regNo": "2508020017",
    "email": "Trisha.2508020017@muj.manipal.edu",
    "phone": "8949303198",
    "program": "BSC psychology (HONS)",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I enjoy interacting with people from different cultures and learning about perspectives from around the world.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, I have been actively involved in various activities during my school years.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 20:19:46",
    "fullName": "Prashant",
    "regNo": "2504070024",
    "email": "Prashant.2504070024@muj.manipal.edu",
    "phone": "9660253436",
    "program": "Bsc Mathematics hons",
    "whyInterested": "To get more exposure and to show my capabilities as well .",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Yes",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 20:23:13",
    "fullName": "Upasna Madaan",
    "regNo": "2503080096",
    "email": "upasna.2503080096@muj.manipal.edu",
    "phone": "9306236488",
    "program": "Btech ECE",
    "whyInterested": "I'm interested in joining the International Student Cell Junior Working Team because I enjoy interacting with people from different cultures and helping create a welcoming environment on campus.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "not really",
    "cvLink": "https://drive.google.com/open?id=1HBgkpthVBBvYLS67Cf0vpsAaw27SmvcU"
  },
  {
    "timestamp": "12/03/2026 20:36:31",
    "fullName": "Dhairya Malhotra",
    "regNo": "2502050414",
    "email": "dhairya.2502050414@muj.manipal.edu",
    "phone": "8401621855",
    "program": "Btech CSE",
    "whyInterested": "I have a past on trying to apply in some international universities and getting selected in each one of them, but due to some circumstances i was not able to continue with the process. I think my skills that i learnt from applying on my own would be a great hand in ISC's JWT.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "I am in the oneiros working team and helping them in some major events.",
    "cvLink": "https://drive.google.com/open?id=1Iinw80i_Zc9ZwmxYjg1GbWbMQT_spjYt"
  },
  {
    "timestamp": "12/03/2026 21:05:38",
    "fullName": "Vrinda Bhawar",
    "regNo": "2502051884",
    "email": "Vrinda.2502051884@muj.manipal.edu",
    "phone": "6264483312",
    "program": "B.Tech CSE",
    "whyInterested": "I want to join the ISC to develop my leadership and communication skills in a multicultural environment.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 21:46:28",
    "fullName": "Ridhima Sharma",
    "regNo": "2502050961",
    "email": "Ridhima.2502050961@muj.manipal.edu",
    "phone": "9318360336",
    "program": "Btech Cse",
    "whyInterested": "Global Mindset, Leadership & Management, Adaptive Collaboration, Strategic Networking",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Jwt acm sigbed events, Jwt litmus, Jwt 180 DC",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 22:49:29",
    "fullName": "Kevin Bipinbhai Tilala",
    "regNo": "2503090019",
    "email": "kevin.2503090019@muj.manipal.edu",
    "phone": "7874029000",
    "program": "B.Tech ECE",
    "whyInterested": "For knowledge",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "No",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 22:53:42",
    "fullName": "Parth Agarwal",
    "regNo": "2503090011",
    "email": "parth.2503090011@muj.manipal.edu",
    "phone": "8506052763",
    "program": "B.Tech -ECE VLSI Design and Technology",
    "whyInterested": "Im intrested to work in junior internation working team student cell as it gives the opportunity to work with international students and also to gain experience in volunteer work.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Fair",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Enrolled in Working team of Aperture and also participated in events.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:00:40",
    "fullName": "Arnav Asrani",
    "regNo": "2503090034",
    "email": "arnav.2504090034@muj.manipal.edu",
    "phone": "6260508064",
    "program": "B.Tech ECE(VLSI)",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides an opportunity to interact with students from different cultures and help them feel welcomed in the campus community.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "Yes, i was in working team of Aperature, organising committee of oneiros, Ghs annual carnival",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:05:56",
    "fullName": "Vikas sirvi",
    "regNo": "2503090033",
    "email": "vikas.2503090033@muj.manipal.edu",
    "phone": "8239924408",
    "program": "B.tech electronic engineering VLSI designing and technology",
    "whyInterested": "Being part of this team would allow me to develop my communication, teamwork, and organizational skills while also creating a positive impact on the campus community.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Enrolled in aperture working team and participate in events management in Techideate.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:07:42",
    "fullName": "Akshit Sharma",
    "regNo": "2503090062",
    "email": "akshit.2503090062@muj.manipal.edu",
    "phone": "9749376343",
    "program": "Btech ECE VLSI",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides a great opportunity to interact with students from diverse cultural and academic backgrounds.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Yes, I have been actively involved in organizing and volunteering for several events at MUJ. ACM sigbed, Tech Ideate OC, Oneiros Fest OC.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:08:19",
    "fullName": "Yuvraj Sethi",
    "regNo": "2502052815",
    "email": "yuvraj.2502052815@muj.manipal.edu",
    "phone": "9229381423",
    "program": "B Tech Cse",
    "whyInterested": "I want to upgrade myself by gaining exposure and experience and contribute my knowledge and expertise",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Yes I do, I was the headboy of my school where I had organised numerous inter and intra school events, here in college I have volunteered for Janmashtami, Saraswati Puja, TechIdeate and Oneiros (currently in OC)",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:17:35",
    "fullName": "Kaustav Halder",
    "regNo": "2502050453",
    "email": "kaustav.2502050453@muj.manipal.edu",
    "phone": "6296504870",
    "program": "B.Tech",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides a platform to interact with students from diverse cultural backgrounds and help them feel welcomed and supported.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "Yes, in Google Developer Groups MUJ, I have managed the events in this tenure and also as a Junior Committee Member of IEEE, WIE.",
    "cvLink": "https://drive.google.com/open?id=1lUnmAAxqlE_ORfDdYuFNScuBcb2Dkl0_"
  },
  {
    "timestamp": "12/03/2026 23:18:35",
    "fullName": "Kaushiki Agrawal",
    "regNo": "2506070046",
    "email": "kaushiki.2506070046@muj.manipal.edu",
    "phone": "8765385884",
    "program": "BA Hons Economics",
    "whyInterested": "I am eager to join the International Student Cell Junior Working Team because it offers a unique platform to interact with students from diverse cultural and academic backgrounds.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Fair",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, I have prior work experience as a member of newly formed Earth Club, an initiative by the Economics Department.",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:31:09",
    "fullName": "Ronak Adwani",
    "regNo": "2503110062",
    "email": "ronak.2503110062@muj.manipal.edu",
    "phone": "8077075505",
    "program": "btech",
    "whyInterested": "I was born and brought up in Tanzania half my life and shifted to the states then India, well, the diversified journey has induced me open mindedness and has given me a communication skill that helps me build a bond with almost everyone.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "FTC robotics captain, founded NGO-Stem Sparks, Lead strategist of STEAM vision foundation, Administration FY coordinator at IAESTE LC MUJ, Junior board core member in RPM club.",
    "cvLink": "https://drive.google.com/open?id=1fR7ZQoGsxxdtR1gKW2izBZtU1C3kWnYx"
  },
  {
    "timestamp": "12/03/2026 23:33:36",
    "fullName": "Aman kumar tiwari",
    "regNo": "2502051471",
    "email": "aman.2502051471@muj.manipal.edu",
    "phone": "8447704401",
    "program": "Btech 1st year",
    "whyInterested": "Because I want to interact with new people around the campus with different background",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Fair",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 3,
    "experience": "Yes",
    "cvLink": ""
  },
  {
    "timestamp": "12/03/2026 23:48:14",
    "fullName": "Abhishek Yadav",
    "regNo": "23FE10CDS00341",
    "email": "ABHISHEK.23FE10CDS00341@muj.manipal.edu",
    "phone": "7651894960",
    "program": "B Tech",
    "whyInterested": "This is because it will give me an opportunity to interact with students from different countries and cultures.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 3,
    "experience": "Yes I took the responsibility of marketing in marathon event. Currently I am EC for oneiros 2026.",
    "cvLink": "https://drive.google.com/open?id=1BfP_DeQpjMEMxxcLUWS92t728iiLRxwO"
  },
  {
    "timestamp": "12/03/2026 23:57:09",
    "fullName": "Ridhima Gurung",
    "regNo": "2502052617",
    "email": "ridhima.2502052617@muj.manipal.edu",
    "phone": "7451820005",
    "program": "B.Tech CSE",
    "whyInterested": "I personally believe MUJ offers an excellent exchange program with great global exposure. Being part of a team that works toward this goal would be empowering and a completely new experience for me.",
    "domains": "Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "No",
    "cvLink": ""
  },
  {
    "timestamp": "13/03/2026 00:02:47",
    "fullName": "Blessy Priyani",
    "regNo": "2502051287",
    "email": "blessy.2502051287@muj.manipal.edu",
    "phone": "7294003114",
    "program": "Btech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I have always dreamed of studying abroad and exploring global opportunities.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, I have experience in volunteer work through my church. I led a donation drive during Christmas that raised around 12000 in three days.",
    "cvLink": ""
  },
  {
    "timestamp": "13/03/2026 00:05:08",
    "fullName": "Blessy Priyani",
    "regNo": "2502051287",
    "email": "blessy.2502051287@muj.manipal.edu",
    "phone": "7294003114",
    "program": "Btech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I have always dreamed of studying abroad and exploring global opportunities.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "Yes, I have experience in volunteer work through my church. I led a donation drive during Christmas that raised around 12000 in three days.",
    "cvLink": "https://drive.google.com/open?id=1tKMacGc8CWHajEFg4FEsRwwuc4Kcssrb"
  },
  {
    "timestamp": "13/03/2026 00:22:46",
    "fullName": "Niharika Singh",
    "regNo": "2503020055",
    "email": "niharika.2503020055@muj.manipal.edu",
    "phone": "7217708917",
    "program": "B.Tech Biotechnology",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I like interacting with people from different cultures and background.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Part of JWT of Club Garuda, JWT of Club IEEE WIE, OC member for Oneiros 2026, Volunteered for Utsaah 2025.",
    "cvLink": ""
  },
  {
    "timestamp": "13/03/2026 12:00:54",
    "fullName": "RAJEEV BORRA",
    "regNo": "2502050582",
    "email": "rajeev.2502050582@muj.manipal.edu",
    "phone": "9441111154",
    "program": "B. Tech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I strongly value global exposure and cross-cultural learning.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Yes. I served as Head Boy in school, coordinating academic and co-curricular events.",
    "cvLink": "https://drive.google.com/open?id=1InlG7AbiZUiUvwu8ILXuZuVXuRl_J-LF"
  },
  {
    "timestamp": "14/03/2026 13:38:34",
    "fullName": "Mahiraj singh rathore",
    "regNo": "2502062857",
    "email": "mahiraj.250252857@muj.manipal.edu",
    "phone": "6378575097",
    "program": "Btech",
    "whyInterested": "Want to be part of it and explore and learn new things",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 3,
    "experience": "Yes working in IEI MECHATRONICS junior working team and also part of aperture working team",
    "cvLink": ""
  },
  {
    "timestamp": "14/03/2026 13:44:48",
    "fullName": "Atharva Sinha",
    "regNo": "2503080359",
    "email": "atharva.2503080359.muj.manipal.edu",
    "phone": "7229091421",
    "program": "Btech in Electronics and communications",
    "whyInterested": "Would really enjoy with working in the International student cell as since my school life I have enjoyed managing events and handling them.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Have been a part of Omphalos club managing events and promotions and have been a part of numerous event management teams during school time",
    "cvLink": ""
  },
  {
    "timestamp": "14/03/2026 13:45:36",
    "fullName": "Aadya goenka",
    "regNo": "2506030073",
    "email": "Aadya.2506030073@muj.manipal.edu",
    "phone": "7209062678",
    "program": "Bba hons",
    "whyInterested": "Honestly, what caught my attention was the people. I find it genuinely fascinating how students from completely different cultural backgrounds approach the same spaces differently. ISC seems like exactly that kind of room.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Graphic Design Team Member at Managria, 180 Degrees Consulting R&D and Social Media team, Jashn-e-Bharat coordination, campus tree plantation drive, Sociothon, ICEWSTEAM, Techideate competitions.",
    "cvLink": "https://drive.google.com/open?id=1YQsJ-BAQODYKbO-FO7JiwA_kYmVQsIUZ"
  },
  {
    "timestamp": "14/03/2026 14:06:56",
    "fullName": "Arshpreet Singh",
    "regNo": "2502050061",
    "email": "arshpreet.2502050061@muj.manipal.edu",
    "phone": "9625495302",
    "program": "Btech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because I have a keen interest in global work and cultural interaction.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 5,
    "experience": "Yes, part of JWT in Glitch Club of MUJ, productions and events. Major role in several international events during school life.",
    "cvLink": "https://drive.google.com/open?id=1Lhadg1WyRcNE8v64RoGQ_WkLfzHbU9Hs"
  },
  {
    "timestamp": "14/03/2026 14:39:21",
    "fullName": "Maulik Gupta",
    "regNo": "2502052505",
    "email": "maulik.2502052505@muj.manipal.edu",
    "phone": "8439011150",
    "program": "BTech CSE",
    "whyInterested": "Opportunity to blend personal growth with service",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 2,
    "experience": "",
    "cvLink": ""
  },
  {
    "timestamp": "14/03/2026 15:36:01",
    "fullName": "Harshita Kapoor",
    "regNo": "2502050458",
    "email": "harshita.2502050458@muj.manipal.edu",
    "phone": "9893426777",
    "program": "B.Tech CSE",
    "whyInterested": "I would like to join the International Students Cell because I am interested in interacting with people from diverse cultural and academic backgrounds.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "During my time as the Vice Head Girl of my school, I actively participated in organizing and managing several school events and activities.",
    "cvLink": ""
  },
  {
    "timestamp": "14/03/2026 16:06:14",
    "fullName": "Anjali Nirvikar",
    "regNo": "2506030308",
    "email": "anjali2506030308@muj.manipal.edu",
    "phone": "8290766144",
    "program": "BBA Hons",
    "whyInterested": "I love being part of teamworks and i like working",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Good"
    },
    "commitment": 5,
    "experience": "I have worked at NEW YORK FW, DUBAI FW and LONDON FW and at many more events in my school and other places",
    "cvLink": ""
  },
  {
    "timestamp": "15/03/2026 00:15:20",
    "fullName": "Aazeen Hazariwala",
    "regNo": "2502051710",
    "email": "aazeen.2502051710@muj.manipal.edu",
    "phone": "8200381577",
    "program": "Btech cse",
    "whyInterested": "I have a little experience in event management and I am interested in being part of more such opportunities",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "I have participated in organising and managing my previous school's student exchange programs",
    "cvLink": ""
  },
  {
    "timestamp": "15/03/2026 12:10:07",
    "fullName": "Anushna Saxena Dixit",
    "regNo": "2503080038",
    "email": "anushna.2503080038@muj.manipal.edu",
    "phone": "7760794874",
    "program": "B.tech ECE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it provides an opportunity to interact with students from diverse cultural backgrounds and help them feel welcomed on campus.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "Hosted, Organized and was in-charge of many events/fests/farewell parties.",
    "cvLink": "https://drive.google.com/open?id=1Y_B0qISEAs2R7DvZmrGBYMIAUm7UOUQR"
  },
  {
    "timestamp": "15/03/2026 12:44:39",
    "fullName": "Kavya das",
    "regNo": "2502051927",
    "email": "kavya.2502051927",
    "phone": "7684800830",
    "program": "B.Tech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it offers a chance to interact with students from diverse cultures and backgrounds.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Part of IEEE WOMEN IN ENGINEERING, contributed in promptopia and elysium events. Assistant director for community service team of SAI TED.",
    "cvLink": "https://drive.google.com/open?id=1SDTaCnLiA-L64FAKekkmUaADjy2d5nLb"
  },
  {
    "timestamp": "15/03/2026 14:25:58",
    "fullName": "Lolla Apurva Devi",
    "regNo": "2502052050",
    "email": "lolla.2502052050@muj.manipal.edu",
    "phone": "7400168449",
    "program": "BTech CSE",
    "whyInterested": "I'm interested in joining ISC JWT as it would provide me with the opportunity to expand my immersive networking, broaden my perspective, and hone my communication skills.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Good",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Member of Cyberspace Club, assisted with Rewind and Recode, coordinated Bounty Bonanza 3.0, JWT Member for Novus.",
    "cvLink": "https://drive.google.com/open?id=1xhd2A1j-v_ZOzQ7ZqHXEv2i0p5tY807Y"
  },
  {
    "timestamp": "15/03/2026 15:16:11",
    "fullName": "Sara Sharma",
    "regNo": "2503020040",
    "email": "sara.2503020040@muj.manipal.edu",
    "phone": "9007975111",
    "program": "BTech Biotechnology",
    "whyInterested": "To develop valuable professional and leadership qualities",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "No",
    "cvLink": ""
  },
  {
    "timestamp": "16/03/2026 09:26:12",
    "fullName": "Bhavya Sri Suravajhala",
    "regNo": "2508020088",
    "email": "bhavya.2508020088@muj.manipal.edu",
    "phone": "9461159760",
    "program": "B.Sc (Hons.) Psychology",
    "whyInterested": "Being part of ISC would allow me to develop important skills such as communication, teamwork, and event coordination while actively assisting international students in adapting to campus life. I believe that a supportive and culturally aware community enhances the overall university experience, and I would be excited to contribute to initiatives that promote global engagement at MUJ.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Excellent"
    },
    "commitment": 4,
    "experience": "yes.\nSPIC MACAY\nOrganising team in international and national conferences and events. Yes, I have significant experience in volunteering and organizing cultural events through SPIC MACAY. I have been actively volunteering with the organization for the past 8 years, contributing to various initiatives that promote Indian classical music, arts, and cultural heritage among students.\n\nRecently, I played a key role in organizing a major cultural event on 14th March 2025, where renowned classical musician Ustad Amjad Ali Khan performed. I led the organizing team and was responsible for overseeing operations, logistics, coordination, and overall event management, ensuring that every detail was handled smoothly.\n\nThe event witnessed a large audience of over 2,000 attendees, and managing such a large-scale program required strong teamwork, planning, and communication. This experience strengthened my leadership, problem-solving, and organizational skills while reinforcing my passion for cultural volunteering and community engagement.\n\nIn addition, I have also been part of several organizing committees for national and international conferences and events, where I contributed to planning, coordination, and smooth execution of programs",
    "cvLink": "https://drive.google.com/open?id=1iwKzEINwDmpdqlGAZBA4Zcmv-2J86raF"
  },
  {
    "timestamp": "16/03/2026 10:13:04",
    "fullName": "Ishan Srivastava",
    "regNo": "2502052621",
    "email": "ishan.2502052621@muj.manipal.edu",
    "phone": "9555727447",
    "program": "B.Tech CSE",
    "whyInterested": "I’m interested in joining the ISC Junior Working Team because I genuinely want to be more involved in MUJ’s international ecosystem. I’m particularly interested in semester exchange programs and global collaborations, so working with ISC would give me a closer understanding of how these opportunities function while allowing me to contribute to the international student community on campus. I also enjoy working in collaborative environments and believe interacting with students from different cultures adds a unique perspective to campus life.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Good",
      "Team Work": "Excellent",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "Yes, I have experience in student leadership and event organization. I was part of the School Council, am currently a member of the ACM SIGBED Events Team, and have also been involved in organizing Model United Nations (MUN) conferences.",
    "cvLink": ""
  },
  {
    "timestamp": "16/03/2026 12:38:55",
    "fullName": "Shruti Agrawal",
    "regNo": "2502050461",
    "email": "Shruti.2502050461@muj.edu.in",
    "phone": "6200208159",
    "program": "B.Tech CSE",
    "whyInterested": "I am interested in joining the International Student Cell Junior Working Team because it would give me the opportunity to interact with people from diverse backgrounds and learn about different cultures. I believe such interactions help broaden one’s perspective and create a more inclusive campus environment. My school also had an international students program, so I already have some experience being around students from different countries. Because of this, I understand how important it is for international students to feel welcomed and supported. I would enjoy contributing to creating that kind of environment in our college. Being part of this team would also help me improve my communication and teamwork skills. At the same time, it would benefit me personally by broadening my horizons and allowing me to learn from different cultures and experiences.",
    "domains": "Content Creation & Social Media Management (Design, Writing, Scheduling), Event Management & Operations (Planning, Execution, Venue Setup), Documentation & Administration (Record keeping, Email correspondence)",
    "proficiencies": {
      "Communication": "Good",
      "Time Management": "Excellent",
      "Team Work": "Excellent",
      "Graphic Design": "Good"
    },
    "commitment": 4,
    "experience": "I have helped organize a few events during my time in school, where I assisted with planning, decorations, and coordinating with other students. These experiences helped me understand the importance of teamwork and communication while working on events. Recently, being a part of the Junior Working Team of a college club has given me some exposure to how clubs and events function in college. I have started understanding how different tasks are managed and how team members coordinate with each other. Although I am still learning, these experiences have helped me gain some basic understanding of event organization. I am eager to learn more and contribute wherever I can.",
    "cvLink": ""
  },
  {
    "timestamp": "16/03/2026 12:52:19",
    "fullName": "Vanshika Goyal",
    "regNo": "2502050498",
    "email": "vanshika.2502050498@muj.manipal.edu",
    "phone": "6375711184",
    "program": "Btech",
    "whyInterested": "I aspire to study in an international campus be it for a semester or for masters. Thus I wish to expand my knowledge in the sector and help other students like meee.",
    "domains": "Event Management & Operations (Planning, Execution, Venue Setup), Outreach & Public Relations (Connecting with other student bodies, promoting events)",
    "proficiencies": {
      "Communication": "Excellent",
      "Time Management": "Excellent",
      "Team Work": "Good",
      "Graphic Design": "Fair"
    },
    "commitment": 4,
    "experience": "I am a part of jwt of LearnIT and also CFO of a newly established Yuva Vibes Organisation. This Organisation is started by a student of NMIMS to promote engagement of peers in co-curricular activities and communication skills.",
    "cvLink": ""
  }
];

export default APPLICANTS;
