import type { Client, Job } from '../types';

export const clients: Record<string, Client> = {
  maya: {
    id: 'maya',
    name: 'MAYA RIVERA',
    role: 'NIGHTLIFE PROMOTER',
    personalityQuotes: [
      "People don't come to a club for the music. They come because they think everyone else is already there.",
      "Make it look expensive, make it look exclusive.",
    ],
  },
  dante: {
    id: 'dante',
    name: 'DANTE CROSS',
    role: 'LUXURY IMPORTS',
    personalityQuotes: [
      "I don't sell cars. I sell the illusion that you're better than everyone else on the road.",
    ],
  },
  elena: {
    id: 'elena',
    name: 'ELENA VEGA',
    role: 'UNDERGROUND MANAGER',
    personalityQuotes: [
      "If they don't look good on the cover, they don't get the streams. Fix it.",
    ],
  },
  marcus: {
    id: 'marcus',
    name: 'MARCUS VALE',
    role: 'THE RIVAL',
    personalityQuotes: [
      "Loyalty is just a question of price. What's yours?",
    ],
  },
};

export const jobs: Job[] = [
  {
    id: 'job-01',
    title: 'MAKE THEM WANT TO COME',
    clientId: 'maya',
    location: 'NIGHTCLUB ROW',
    brief: "Friday is dead unless we make people believe it isn't. Take this shot from the floor, slap some energy into it. Add the event details. No one asks questions if the flyer looks good.",
    clientBriefTasks: [
      'Improve the visual mood',
      'Crop the image for the campaign',
      'Add the event title',
      'Add a visual accent',
      'Add a frame'
    ],
    payment: 4500,
    repReward: 12,
    heatChange: 0,
    difficulty: 'easy',
    image: '/evidence/evidence-04.webp', // Nightclub image
    requirements: [
      { id: 'req-visual', label: 'IMAGE MODIFIED', type: 'visual' },
      { id: 'req-dim', label: 'CAMPAIGN FORMAT', type: 'dimension' },
      { id: 'req-save', label: 'FINAL EDIT SAVED', type: 'save' },
    ],
    status: 'available',
  },
  {
    id: 'job-02',
    title: 'THE ILLUSION OF WEALTH',
    clientId: 'dante',
    location: 'MARINA DISTRICT',
    brief: "Make this car look like it belongs to someone who doesn't check prices. I need it cropped tight, framed, and looking pristine. Put our dealership name on it.",
    clientBriefTasks: [
      'Crop the subject',
      'Apply a Filter to enhance color',
      'Add Dealership Text',
      'Add a Frame'
    ],
    payment: 6500,
    repReward: 18,
    heatChange: 2,
    difficulty: 'medium',
    image: '/evidence/evidence-03.webp', // Supercars
    requirements: [
      { id: 'req-dim', label: 'CAMPAIGN FORMAT', type: 'dimension' },
      { id: 'req-visual', label: 'IMAGE MODIFIED', type: 'visual' },
      { id: 'req-save', label: 'FINAL EDIT SAVED', type: 'save' },
    ],
    status: 'locked',
  },
  {
    id: 'job-03',
    title: 'STREETWEAR DROP',
    clientId: 'elena',
    location: 'TEXTILE CITY',
    brief: "We're dropping this tonight. Make it look expensive. Crop it, brand it, add some sticker flair.",
    clientBriefTasks: [
      'Crop the product',
      'Add brand Text',
      'Add a Sticker or Shape'
    ],
    payment: 8000,
    repReward: 25,
    heatChange: 5,
    difficulty: 'medium',
    image: '/evidence/evidence-02.webp', // Alleyway
    requirements: [
      { id: 'req-dim', label: 'CAMPAIGN FORMAT', type: 'dimension' },
      { id: 'req-visual', label: 'IMAGE MODIFIED', type: 'visual' },
      { id: 'req-save', label: 'FINAL EDIT SAVED', type: 'save' },
    ],
    status: 'locked',
  },
  {
    id: 'job-04',
    title: 'ALBUM ARTWORK',
    clientId: 'elena',
    location: 'SOUTH BEACH',
    brief: "The artist has no vision. We need an album cover by morning. Make it moody, make it pop.",
    clientBriefTasks: [
      'Heavy Filter',
      'Album Title (Text)',
      'Shapes / Composition',
      'Add a Frame'
    ],
    payment: 12000,
    repReward: 40,
    heatChange: 10,
    difficulty: 'hard',
    image: '/evidence/evidence-01.jpg', // Ocean drive bikers
    requirements: [
      { id: 'req-visual', label: 'IMAGE MODIFIED', type: 'visual' },
      { id: 'req-save', label: 'FINAL EDIT SAVED', type: 'save' },
    ],
    status: 'locked',
  },
  {
    id: 'job-05',
    title: 'THE DIRTY JOB',
    clientId: 'marcus',
    location: 'VICE HARBOR',
    brief: "Maya Rivera thinks she runs this city's nightlife. Make her new campaign look weak. Sabotage this image.",
    clientBriefTasks: [
      'Distort or Pixelate',
      'Add derogatory Text',
      'Draw over it'
    ],
    payment: 20000,
    repReward: -10, // Lose rep but gain cash
    heatChange: 30, // High heat
    difficulty: 'hard',
    image: '/evidence/evidence-05.jpg', // CCTV
    requirements: [
      { id: 'req-visual', label: 'IMAGE MODIFIED', type: 'visual' },
      { id: 'req-save', label: 'FINAL EDIT SAVED', type: 'save' },
    ],
    status: 'locked',
  },
];
