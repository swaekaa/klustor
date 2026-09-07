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
    payment: 4500,
    repReward: 12,
    heatChange: 0,
    difficulty: 'easy',
    image: '/evidence/evidence-04.webp', // Nightclub image
    requirements: [
      { id: 'req-1', label: 'Apply a Filter', type: 'filter' },
      { id: 'req-2', label: 'Crop to the subject', type: 'crop' },
      { id: 'req-3', label: 'Add Event Title (Text)', type: 'text' },
      { id: 'req-4', label: 'Add a Shape or Accent', type: 'shape' },
      { id: 'req-5', label: 'Add a Frame', type: 'frame' },
    ],
    status: 'available',
  },
  {
    id: 'job-02',
    title: 'THE ILLUSION OF WEALTH',
    clientId: 'dante',
    location: 'MARINA DISTRICT',
    brief: "Make this car look like it belongs to someone who doesn't check prices. I need it cropped tight, framed, and looking pristine. Put our dealership name on it.",
    payment: 6500,
    repReward: 18,
    heatChange: 2,
    difficulty: 'medium',
    image: '/evidence/evidence-03.webp', // Supercars
    requirements: [
      { id: 'req-1', label: 'Crop the subject', type: 'crop' },
      { id: 'req-2', label: 'Apply a Filter to enhance color', type: 'filter' },
      { id: 'req-3', label: 'Add Dealership Text', type: 'text' },
      { id: 'req-4', label: 'Add a Frame', type: 'frame' },
    ],
    status: 'locked',
  },
  {
    id: 'job-03',
    title: 'STREETWEAR DROP',
    clientId: 'elena',
    location: 'TEXTILE CITY',
    brief: "We're dropping this tonight. Make it look expensive. Crop it, brand it, add some sticker flair.",
    payment: 8000,
    repReward: 25,
    heatChange: 5,
    difficulty: 'medium',
    image: '/evidence/evidence-02.webp', // Alleyway
    requirements: [
      { id: 'req-1', label: 'Crop the product', type: 'crop' },
      { id: 'req-2', label: 'Add brand Text', type: 'text' },
      { id: 'req-3', label: 'Add a Sticker or Shape', type: 'sticker' },
    ],
    status: 'locked',
  },
  {
    id: 'job-04',
    title: 'ALBUM ARTWORK',
    clientId: 'elena',
    location: 'SOUTH BEACH',
    brief: "The artist has no vision. We need an album cover by morning. Make it moody, make it pop.",
    payment: 12000,
    repReward: 40,
    heatChange: 10,
    difficulty: 'hard',
    image: '/evidence/evidence-01.jpg', // Ocean drive bikers
    requirements: [
      { id: 'req-1', label: 'Heavy Filter', type: 'filter' },
      { id: 'req-2', label: 'Album Title (Text)', type: 'text' },
      { id: 'req-3', label: 'Shapes / Composition', type: 'shape' },
      { id: 'req-4', label: 'Add a Frame', type: 'frame' },
    ],
    status: 'locked',
  },
  {
    id: 'job-05',
    title: 'THE DIRTY JOB',
    clientId: 'marcus',
    location: 'VICE HARBOR',
    brief: "Maya Rivera thinks she runs this city's nightlife. Make her new campaign look weak. Sabotage this image.",
    payment: 20000,
    repReward: -10, // Lose rep but gain cash
    heatChange: 30, // High heat
    difficulty: 'hard',
    image: '/evidence/evidence-05.jpg', // CCTV
    requirements: [
      { id: 'req-1', label: 'Distort or Pixelate', type: 'filter' },
      { id: 'req-2', label: 'Add derogatory Text', type: 'text' },
      { id: 'req-3', label: 'Draw over it', type: 'draw' },
    ],
    status: 'locked',
  },
];
