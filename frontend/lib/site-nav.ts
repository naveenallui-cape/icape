export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: readonly NavChild[];
};

function olympiadChildren(code: "IMO" | "ISO" | "IEO", slug: string): NavChild[] {
  return [
    {
      label: `About ITSE ${code} Exam`,
      href: `/${slug}`,
    },
    {
      label: `ITSE ${code} Syllabus`,
      href: `/pattern#${slug}`,
    },
    {
      label: `ITSE ${code} Model & Previous Papers`,
      href: `/sample-papers?olympiad=${slug}`,
    },
  ];
}

export const siteNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "IMO",
    href: "/imo",
    children: olympiadChildren("IMO", "imo"),
  },
  {
    label: "ISO",
    href: "/iso",
    children: olympiadChildren("ISO", "iso"),
  },
  {
    label: "IEO",
    href: "/ieo",
    children: olympiadChildren("IEO", "ieo"),
  },
  { label: "Gallery", href: "/gallery" },
  { label: "About us", href: "/about" },
  { label: "Contact us", href: "/contact" },
];


export type HomeCard = {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
};

export const homeCards: HomeCard[] = [
  {
    title: "DOWNLOAD REGISTRATION FORMS",
    description:
      "Download School & Student Registration Forms For Olympiad Year 2026-27",
    href: "/registration-forms",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop&q=80",
    imageAlt: "Registration forms and documents on a desk",
  },
  {
    title: "EXAM SCHEDULE",
    description: "i-CAPE Exam Schedule for Olympiad Year 2026-27",
    href: "/exam-schedule",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=500&fit=crop&q=80",
    imageAlt: "Calendar marking exam schedule dates",
  },
  {
    title: "REGISTRATION FEE",
    description: "INR 150 per student per Olympiad — payment details inside",
    href: "/registration-fee",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop&q=80",
    imageAlt: "Calculator and finance documents for registration fees",
  },
  {
    title: "REWARDS AND RECOGNITIONS",
    description:
      "Trophies, medals, certificates, scholarships, and school & teacher awards.",
    href: "/rewards",
    image: "/images/rewards-certificates.jpg",
    imageAlt:
      "Students receiving certificates at an awards and recognition ceremony",
  },
  {
    title: "PATTERN OF QUESTIONS, SYLLABUS AND MARKING SCHEME",
    description:
      "Question pattern, syllabus, and marking scheme for Grades 3 to 10",
    href: "/pattern",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop&q=80",
    imageAlt: "Student writing answers during an examination",
  },
  {
    title: "RANKINGS / 2ND LEVEL QUALIFICATION",
    description:
      "Students fulfilling either of the following 3 criteria will qualify for 2nd...",
    href: "/rankings",
    image:
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&h=500&fit=crop&q=80",
    imageAlt: "Winners podium representing rankings and qualification",
  },
  {
    title: "ZONE/STATE CATEGORIZATION",
    description:
      "All States and Union Territories in India and all International countries...",
    href: "/zones",
    image:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=500&fit=crop&q=80",
    imageAlt: "World map for zone and state categorization",
  },
  {
    title: "MODEL PAPERS & PREVIOUS PAPERS",
    description:
      "IMO, ISO & IEO model papers (Grades 3–10) and Level 1 / Level 2 previous papers.",
    href: "/sample-papers",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=500&fit=crop&q=80",
    imageAlt: "Student practising with written exam model papers",
  },
  {
    title: "RESULTS",
    description:
      "Check student and school olympiad results for Olympiad Year 2025-26.",
    href: "/results",
    image:
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&h=500&fit=crop&q=80",
    imageAlt: "Student taking an exam representing results",
  },
  {
    title: "NOTICE BOARD",
    description:
      "Latest important notices, deadlines, and official updates from i-CAPE.",
    href: "/notice-board",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop&q=80",
    imageAlt: "Notice board with important announcements and updates",
  },
];

export const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop&q=80",
    alt: "Students in a classroom learning together",
  },
  {
    src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop&q=80",
    alt: "School classroom ready for learning",
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop&q=80",
    alt: "Young learners in a study group",
  },
  {
    src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=600&fit=crop&q=80",
    alt: "School students raising hands in class",
  },
  {
    src: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&h=600&fit=crop&q=80",
    alt: "Teacher guiding students during an exam prep session",
  },
  {
    src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop&q=80",
    alt: "Students celebrating academic achievement",
  },
  {
    src: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop&q=80",
    alt: "Stack of educational books for olympiad prep",
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop&q=80",
    alt: "Team discussing academic plans",
  },
  {
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&q=80",
    alt: "Open books in a library study space",
  },
  {
    src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&q=80",
    alt: "Children learning with colorful classroom materials",
  },
];
