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
    title: "ONLINE SCHOOL REGISTRATION & LOGIN",
    description:
      "Create a school account, fill school & student details, and submit payment online for Olympiad Year 2026-2027.",
    href: "/school/login",
    image:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=500&fit=crop&q=80",
    imageAlt: "Person completing online school registration on a laptop",
  },
  {
    title: "DOWNLOAD REGISTRATION FORMS",
    description:
      "Download School & Student Registration Forms For Olympiad Year 2026-2027",
    href: "/registration-forms",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop&q=80",
    imageAlt: "Registration forms and documents on a desk",
  },
  {
    title: "EXAM SCHEDULE",
    description: "i-CAPE Exam Schedule for Olympiad Year 2026-2027",
    href: "/exam-schedule",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=500&fit=crop&q=80",
    imageAlt: "Calendar marking exam schedule dates",
  },
  {
    title: "REGISTRATION FEE",
    description: "INR 150 per Olympiad — payment details inside",
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
      "Students fulfilling either of the following 2 criteria will qualify for 2nd...",
    href: "/rankings",
    image:
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&h=500&fit=crop&q=80",
    imageAlt: "Winners podium representing rankings and qualification",
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
      "Check student and school olympiad results for Olympiad Year 2026-2027.",
    href: "/results",
    image:
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&h=500&fit=crop&q=80",
    imageAlt: "Student taking an exam representing results",
  },
];

export const galleryImages = [
  {
    src: "/images/gallery/awards-group-1.jpg",
    alt: "Students with i-CAPE certificates and medals alongside teachers",
  },
  {
    src: "/images/gallery/awards-group-2.jpg",
    alt: "i-CAPE award winners holding certificates at the school awards event",
  },
  {
    src: "/images/gallery/awards-group-3.jpg",
    alt: "Group of students with i-CAPE certificates of achievement",
  },
  {
    src: "/images/gallery/medal-winners.jpg",
    alt: "i-CAPE medal winners with certificates on stage with guests",
  },
  {
    src: "/images/gallery/medal-presentation-1.jpg",
    alt: "Guest presenting an i-CAPE medal to a student",
  },
  {
    src: "/images/gallery/medal-presentation-2.jpg",
    alt: "Student receiving an i-CAPE medal and certificate",
  },
  {
    src: "/images/gallery/certificate-presentation.jpg",
    alt: "Student receiving an i-CAPE certificate at the awards ceremony",
  },
];
