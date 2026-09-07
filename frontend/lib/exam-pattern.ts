export type PatternSection = {
  title: string;
  topics: string[];
};

export type GradePattern = {
  grades: number[];
  totalQuestions: number;
  time: string;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  sections: PatternSection[];
  instructions: string[];
};

export type OlympiadId = "imo" | "iso" | "ieo";

export type OlympiadPattern = {
  id: OlympiadId;
  shortName: string;
  fullName: string;
  patterns: GradePattern[];
};

export function formatGradeLabel(grades: number[]): string {
  if (grades.length === 1) return `Grade ${grades[0]}`;
  if (grades.length === 2) return `Grades ${grades[0]} & ${grades[1]}`;
  const head = grades.slice(0, -1).join(", ");
  const last = grades[grades.length - 1];
  return `Grades ${head} & ${last}`;
}

export const allGrades = [3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Current English (IEO) patterns — kept as-is */
const ieoPatterns: GradePattern[] = [
  {
    grades: [3],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Word Meanings, Homonyms, Synonyms, Antonyms, Singulars, Plurals, Spellings, Homophones, Genders, Number, Proverbs, Idioms, Analogy",
          "Parts of Speech – Nouns, Pronouns, Verbs, Adverbs, Adjectives, Prepositions, Articles, Tenses, Punctuations, Jumbled Words",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Read and interpret stories, anecdotes, and other text types",
          "Understand information given in pictorial and time-table formats",
          "Comprehend short texts and identify key details in messages, invitations, and similar formats",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Ability to interpret and respond appropriately to functions such as apologies, greetings, introductions, conversations, and requests based on the situation",
        ],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
  {
    grades: [4],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Word Meanings, Homonyms, Synonyms, Antonyms, Singulars, Plurals, Spellings, Homophones, Genders, Number, Proverbs, Idioms, Analogy",
          "Parts of Speech – Nouns, Pronouns, Verbs, Adverbs, Adjectives, Prepositions, Conjunctions, Articles, Tenses, Punctuations, Jumbled Words",
          "Basic Questions and Question Tags",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Read and interpret stories, anecdotes, and other text types",
          "Understand information given in pictorial and time-table formats",
          "Comprehend short texts and identify key details in messages, invitations, and similar formats",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Ability to interpret and respond appropriately to functions such as apologies, greetings, introductions, conversations, and requests based on the situation, passing information, etc.",
        ],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
  {
    grades: [5],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Word meanings, homonyms, synonyms, antonyms, singulars, plurals, spellings, homophones, genders, number, proverbs, idioms, analogy",
          "Parts of speech – nouns, pronouns, verbs, adverbs, adjectives, prepositions, conjunctions, articles, punctuations, tenses, active voice and passive voice, subject – verb agreement, direct and indirect speech, etc.",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Read and interpret stories, anecdotes, and other text types",
          "Understand information given in pictorial and time-table formats",
          "Comprehend short texts and identify key details in messages, invitations, and similar formats",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Ability to interpret and respond appropriately to functions such as apologies, greetings, introductions, conversations, and requests based on the situation, passing information, etc.",
        ],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
  {
    grades: [6, 7],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Parts of speech and their correct usage in the sentences, articles, tenses, punctuations, jumbled words, syllables, and word formation; vocabulary development; analogies; synonyms and antonyms; determiners, quantifiers, collocations; phrasal verbs; clauses and phrases; sentence structure; subject–verb agreement; identifying the odd-one-out; one-word substitutes; idiomatic expressions; direct and indirect speech; active and passive voice; etc.",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Understanding the story holistically and interpreting information in detail; comprehending phrases, phrasal verbs, and idioms both contextually and independently; analysing specific details and their implications; extracting information about events, characters, and references within the text; identifying underlying messages and moral perspectives; and related comprehension skills.",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Using language for exchanging pleasantries; greeting; thanking; apologising; offering consolation; giving warnings; expressing opinions and advice; showing polite disagreement; introducing oneself; making requests; seeking permission; conveying information clearly and completely; and demonstrating proper etiquette in personal as well as telephonic conversations.",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
  {
    grades: [8, 9],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Parts of speech and their correct usage in the sentences, articles, tenses, punctuations, jumbled words, syllables, and word formation; vocabulary development; analogies; synonyms and antonyms; determiners, quantifiers, collocations; phrasal verbs; clauses and phrases; sentence structure; subject–verb agreement; identifying the odd-one-out; one-word substitutes; idiomatic expressions; direct and indirect speech; active and passive voice; etc.",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Understanding the story holistically and interpreting information in detail; comprehending phrases, phrasal verbs, and idioms both contextually and independently; analysing specific details and their implications; extracting information about events, characters, and references within the text; identifying underlying messages and moral perspectives; and related comprehension skills.",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Formal written communication; expressing surprises, etiquette in personal and telephonic conversations; appropriate expressions; seeking permission; introducing oneself; ability to understand situation-based variations, conveying information clearly; giving advice; consoling; warning; engaging in arguments; and expressing polite disagreement.",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
  {
    grades: [10],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Vocabulary and Functional Grammar",
        topics: [
          "Parts of speech and their correct usage in the sentences, articles, tenses, punctuations, jumbled words, syllables, and word formation; vocabulary development; analogies; synonyms and antonyms; determiners, quantifiers, collocations; phrasal verbs; clauses and phrases; sentence structure; subject–verb agreement; identifying the odd-one-out; one-word substitutes; idiomatic expressions; direct and indirect speech; active and passive voice; etc.",
        ],
      },
      {
        title: "Reading Comprehension",
        topics: [
          "Understanding the story holistically and interpreting information in detail; comprehending phrases, phrasal verbs, and idioms both contextually and independently; analysing specific details and their implications; extracting information about events, characters, and references within the text; identifying underlying messages and moral perspectives; and related comprehension skills.",
        ],
      },
      {
        title: "Interactive English",
        topics: [
          "Using language for exchanging pleasantries; greeting; thanking; apologising; offering consolation; giving warnings; expressing opinions and advice; showing polite disagreement; introducing oneself; making requests; seeking permission; conveying information clearly and completely; and demonstrating proper etiquette in personal as well as telephonic conversations.",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marks for wrong answers.",
    ],
  },
];

/** Innovative Maths Olympiad (IMO) */
const imoPatterns: GradePattern[] = [
  {
    grades: [3],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Numbers",
        topics: [
          "Number names (3-digit and 4-digit), comparing and forming numbers, and basic arithmetic operations (+, -, ×, ÷)",
        ],
      },
      {
        title: "Measurement",
        topics: [
          "Length, area, mass, volume, temperature, time, and money",
        ],
      },
      {
        title: "Geometry",
        topics: ["Shapes, patterns, and lines"],
      },
      {
        title: "Data Handling",
        topics: ["Reading pictographs, tally marks, and bar graphs"],
      },
      {
        title: "Fractions",
        topics: ["Understanding and identifying fractions"],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks. There is no negative marking for incorrect answers.",
      "Students must use a blue or black ball-point pen to mark their answers on the OMR sheet.",
      "The use of electronic gadgets, including calculators, mobile phones, and smartwatches, is strictly prohibited.",
    ],
  },
  {
    grades: [4],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Number Sense",
        topics: [
          "5-digit and 6-digit number names, comparing and forming numbers, basic arithmetic operations, factors and multiples",
        ],
      },
      {
        title: "Arithmetic and Measurement",
        topics: [
          "Fractions and decimals, time and money, and the measurement of length, area, mass, and volume",
        ],
      },
      {
        title: "Geometry and Data",
        topics: ["Plane geometry, symmetry, and data handling"],
      },
    ],
    instructions: [
      "This question paper contains 35 compulsory questions.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks, totaling 70 marks. There are no negative marks for incorrect answers.",
      "Students must use a blue or black ball-point pen on the OMR sheet.",
      "Electronic devices such as calculators, mobile phones, smartwatches, and log tables are strictly prohibited.",
    ],
  },
  {
    grades: [5],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Numbers",
        topics: [
          "7-digit and 8-digit numbers, patterns, and formation",
          "Basic operations (+, -, ×, ÷), factors, and multiples",
        ],
      },
      {
        title: "Fractions and Decimals",
        topics: ["Fractions and decimals"],
      },
      {
        title: "Geometry",
        topics: ["Geometry, shapes, and patterns"],
      },
      {
        title: "Measurement",
        topics: [
          "Length, mass, volume, time, speed, and temperature",
          "Money, perimeter, area, and volume",
        ],
      },
      {
        title: "Data Handling",
        topics: ["Data handling"],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks. There is no negative marking for incorrect answers.",
      "Students must use a blue or black ball-point pen for the OMR sheet.",
      "Electronic devices such as calculators, mobile phones, smartwatches, and log tables are strictly prohibited.",
    ],
  },
  {
    grades: [6],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Numbers",
        topics: [
          "Knowing Our Numbers, Whole Numbers, and Playing with Numbers",
          "Integers, Fractions and Decimals",
        ],
      },
      {
        title: "Geometry",
        topics: [
          "Basic Geometrical Ideas and Understanding Elementary Shapes",
          "Symmetry",
        ],
      },
      {
        title: "Mensuration and Data",
        topics: ["Data Handling, Perimeter, and Area"],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for incorrect answers.",
      "Students must use a blue or black ball-point pen on an OMR sheet.",
      "Electronic devices such as calculators, mobile phones, or smartwatches are strictly prohibited.",
    ],
  },
  {
    grades: [7],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Numbers and Algebra",
        topics: [
          "Integers, Fractions and Decimals, and Rational Numbers",
          "Exponents and Powers, and Algebraic Expressions",
          "Simple Equations",
        ],
      },
      {
        title: "Data Handling",
        topics: ["Data Handling"],
      },
      {
        title: "Geometry and Mensuration",
        topics: [
          "Lines and Angles, Triangles and Their Properties, Congruence of Triangles",
          "Comparing Quantities, Perimeter and Area, and Visualising Solid Shapes",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 compulsory questions.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for incorrect answers.",
      "Students must use a blue or black ball-point pen for the OMR sheet.",
      "Electronic devices, including calculators, mobile phones, smart watches, and log tables, are strictly prohibited.",
    ],
  },
  {
    grades: [8],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Numbers",
        topics: [
          "Rational Numbers, Playing with Numbers, and Exponents and Powers",
          "Squares and Square Roots, Cubes and Cube Roots",
        ],
      },
      {
        title: "Algebra",
        topics: [
          "Algebraic Expressions, Identities, Factorisation, and Linear Equations in One Variable",
        ],
      },
      {
        title: "Commercial Mathematics and Proportion",
        topics: ["Direct and Inverse Proportion, Commercial Mathematics"],
      },
      {
        title: "Geometry and Mensuration",
        topics: ["Visualising Solid Shapes and Mensuration"],
      },
    ],
    instructions: [
      "This question paper contains 50 compulsory questions.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks, totaling 100 marks. There are no negative marks for incorrect answers.",
      "Answers must be marked on an OMR sheet using a blue or black ball-point pen.",
      "Electronic devices such as calculators, mobile phones, smartwatches, or log tables are strictly prohibited.",
    ],
  },
  {
    grades: [9],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Algebra and Number System",
        topics: [
          "Number System and Polynomials",
          "Coordinate Geometry and Linear Equations in Two Variables",
        ],
      },
      {
        title: "Geometry",
        topics: [
          "Euclid's Geometry, Lines and Angles, Triangles, Quadrilaterals, and Circles",
        ],
      },
      {
        title: "Mensuration and Statistics",
        topics: [
          "Heron's Formula, Surface Areas and Volumes, and Statistics",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for incorrect answers.",
    ],
  },
  {
    grades: [10],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Algebra",
        topics: [
          "Real Numbers, Polynomials, Pair of Linear Equations, and Quadratic Equations",
          "Progressions",
        ],
      },
      {
        title: "Geometry",
        topics: ["Triangles and Coordinate Geometry", "Circles"],
      },
      {
        title: "Trigonometry",
        topics: [
          "Introduction to Trigonometry and Applications of Trigonometry",
        ],
      },
      {
        title: "Mensuration and Data",
        topics: ["Surface Areas and Volumes, Statistics, and Probability"],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for incorrect answers.",
      "Students must use a blue or black ball-point pen to mark their answers on an OMR sheet.",
      "Electronic devices, including calculators, mobile phones, and smartwatches, are strictly prohibited.",
    ],
  },
];

/** Innovative Science Olympiad (ISO) — syllabi differ per grade, no grouping */
const isoPatterns: GradePattern[] = [
  {
    grades: [3],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Living World",
        topics: ["Plants, Animals, and Birds", "Food and Human Needs", "Human Body"],
      },
      {
        title: "Physical Science",
        topics: [
          "Matter and Materials",
          "Light, Sound, and Force",
        ],
      },
      {
        title: "Earth and Environment",
        topics: [
          "Transport, Communication, and Safety Rules",
          "Earth and Universe",
          "Our Environment",
        ],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks, totaling 70 marks. There is no negative marking.",
      "Students must use blue or black ball-point pens on OMR sheets.",
      "Electronic gadgets, such as calculators or mobile phones, are strictly prohibited.",
    ],
  },
  {
    grades: [4],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Living World and Daily Life",
        topics: [
          "Plants and animals, food, and clothes",
          "Safety and first-aid, human body, and matter",
        ],
      },
      {
        title: "Physical Science",
        topics: ["Force, work, energy, air, and water"],
      },
      {
        title: "Earth and Environment",
        topics: ["Earth, the universe, and the environment"],
      },
    ],
    instructions: [
      "This question paper contains 35 compulsory questions.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks, totaling 70 marks. There are no negative marks for incorrect answers.",
      "Candidates must use a blue or black ball-point pen to mark their answers on the OMR sheet.",
      "Prohibited items include calculators, mobile phones, smartwatches, log tables, and other electronic gadgets.",
    ],
  },
  {
    grades: [5],
    totalQuestions: 35,
    time: "1 hr",
    totalMarks: 70,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Matter and Earth Materials",
        topics: [
          "Matter Around Us, Rocks and Minerals, and Air and Water",
        ],
      },
      {
        title: "Biology and Health",
        topics: [
          "Food and Health, Diseases, and the Human Body",
          "Plants Around Us and Animals Around Us",
        ],
      },
      {
        title: "Physics",
        topics: ["Work and Energy, Force and Simple Machines"],
      },
      {
        title: "Earth and Environment",
        topics: [
          "Sun, Moon and Earth, Pollution and Natural Disasters",
        ],
      },
    ],
    instructions: [
      "This question paper contains 35 questions. All questions are compulsory.",
      "The duration of the examination is 60 minutes.",
      "Each question carries 2 marks, totaling 70 marks. There is no negative marking.",
      "Students must use a blue or black ball-point pen for the OMR sheet.",
      "Electronic devices such as calculators, mobile phones, or smartwatches are strictly prohibited.",
    ],
  },
  {
    grades: [6],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Biology",
        topics: [
          "Components of Food",
          "Diversity in the Living World and Living Creatures Characteristics",
        ],
      },
      {
        title: "Chemistry",
        topics: [
          "Materials Around Us and Methods of Separation",
          "Air and Water",
        ],
      },
      {
        title: "Physics and Earth",
        topics: [
          "Motion, Measurement, and Temperature",
          "Exploring Magnets, Light, and Beyond Earth",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 compulsory questions, totaling 100 marks.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marking.",
      "Only blue or black ball-point pens are permitted for marking the OMR sheet.",
      "The use of electronic gadgets such as calculators, mobile phones, or smartwatches is strictly prohibited.",
    ],
  },
  {
    grades: [7],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Biology",
        topics: [
          "Nutrition in Plants and Animals, Respiration in Organisms, Transportation in Plants and Animals, and Reproduction in Plants",
        ],
      },
      {
        title: "Chemistry",
        topics: [
          "Acids, Bases, and Salts; Physical and Chemical Changes",
        ],
      },
      {
        title: "Physics / General Science",
        topics: [
          "Water as a Precious Resource, Heat, Motion and Time, Electric Current and Its Effects, and Light",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions, totaling 100 marks.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marking for incorrect answers.",
      "Students must use a blue or black ball-point pen to fill the OMR Answer Sheet.",
      "Calculators, mobile phones, smartwatches, log tables, and other electronic gadgets are strictly forbidden.",
    ],
  },
  {
    grades: [8],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Biology",
        topics: [
          "Cell structure and functions, microorganisms, and reproduction in animals",
          "Crop production and management, and conservation of plants and animals",
        ],
      },
      {
        title: "Chemistry",
        topics: [
          "Coal, petroleum, combustion, and flame",
          "Metals and non-metals",
        ],
      },
      {
        title: "Physics",
        topics: [
          "Force and pressure, friction, sound, light, and the chemical effects of electric current",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions, totaling 100 marks.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There is no negative marking for incorrect answers.",
      "Students must use a blue or black ball-point pen for the OMR sheet.",
      "Electronic devices such as calculators, mobile phones, and smartwatches are strictly prohibited.",
    ],
  },
  {
    grades: [9],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Chemistry",
        topics: [
          "Matter in Our Surroundings and Is Matter Around Us Pure?",
          "Atoms and Molecules and Structure of the Atom",
        ],
      },
      {
        title: "Biology",
        topics: [
          "The Fundamental Unit of Life, Tissues, and Improvement in Food Resources",
        ],
      },
      {
        title: "Physics",
        topics: [
          "Motion, Force and Laws of Motion, Gravitation, and Work and Energy",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are compulsory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for wrong answers.",
      "Answers must be marked on an OMR sheet using a blue or black ball-point pen.",
      "The use of calculators and electronic gadgets is strictly prohibited.",
    ],
  },
  {
    grades: [10],
    totalQuestions: 50,
    time: "1.5 hr",
    totalMarks: 100,
    marksPerQuestion: 2,
    negativeMarking: false,
    sections: [
      {
        title: "Chemistry",
        topics: [
          "Chemical Reactions and Equations, Acids, Bases and Salts, Metals and Non-metals, and Carbon and Its Compounds",
        ],
      },
      {
        title: "Biology",
        topics: [
          "Life Processes, Control and Coordination, Organism Reproduction, Heredity, and Our Environment",
        ],
      },
      {
        title: "Physics",
        topics: [
          "Light (Reflection and Refraction), The Human Eye and the Colourful World, Electricity, and Magnetic Effects of Electric Current",
        ],
      },
    ],
    instructions: [
      "This question paper contains 50 questions. All questions are mandatory.",
      "The duration of the examination is 90 minutes.",
      "Each question carries 2 marks. There are no negative marks for incorrect answers.",
      "Candidates must use a blue or black ball-point pen to mark their OMR sheets.",
      "Electronic gadgets such as calculators, mobile phones, smart watches, and log tables are strictly prohibited.",
    ],
  },
];

/** Order on Pattern page: IMO → ISO → IEO */
export const olympiadPatterns: OlympiadPattern[] = [
  {
    id: "imo",
    shortName: "IMO",
    fullName: "Innovative Maths Olympiad",
    patterns: imoPatterns,
  },
  {
    id: "iso",
    shortName: "ISO",
    fullName: "Innovative Science Olympiad",
    patterns: isoPatterns,
  },
  {
    id: "ieo",
    shortName: "IEO",
    fullName: "Innovative English Olympiad",
    patterns: ieoPatterns,
  },
];
