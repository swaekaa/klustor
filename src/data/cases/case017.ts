// ============================================================
// CASE 017: THE OCEAN DRIVE INCIDENT
// Full case data configuration
// ============================================================
import type { Case } from '../../types';

export const case017: Case = {
  id: 'case-017',
  title: 'THE OCEAN DRIVE INCIDENT',
  subtitle: 'CASE FILE 017',
  description:
    'At 2:13 AM, a mysterious incident took place near Ocean Drive. An anonymous witness sends you several photographs. The police have not connected the evidence. You must determine what happened.',
  briefing:
    "Someone was in the wrong place at the wrong time. Or the right place. You received five photographs — shot in the span of 35 minutes across Vice City. The police have a description: 'unknown incident, no suspects.' But these photos say otherwise. Find the connections before someone finds you.",
  timestamp: '02:13 AM',
  status: 'open',

  evidence: [
    {
      id: 'evidence-01',
      caseId: 'case-017',
      title: 'OCEAN DRIVE',
      location: 'Ocean Drive, Vice City',
      timestamp: '01:42 AM',
      imageSrc: '/evidence/evidence-01.jpg',
      description:
        'Wide shot of Ocean Drive at 01:42 AM. A gang of bikers gathered on the sidewalk. A man in a grey suit stands observing them.',
      anomalyHint: 'Look closely at the man in the suit and the group he is observing.',
      status: 'unreviewed',
      clueIds: ['clue-suit', 'clue-bikers'],
      clueZones: [
        {
          id: 'zone-suit',
          label: 'MAN IN SUIT',
          description: 'A man in a grey suit standing motionless, observing the bikers.',
          x: 28, y: 50, width: 15, height: 40
        },
        {
          id: 'zone-bikers',
          label: 'BIKER GANG',
          description: 'A group of bikers idling on the sidewalk.',
          x: 55, y: 40, width: 35, height: 45
        },
      ],
    },
    {
      id: 'evidence-02',
      caseId: 'case-017',
      title: 'THE ALLEY',
      location: 'Simmet Alley, Textile City',
      timestamp: '02:03 AM',
      imageSrc: '/evidence/evidence-02.webp',
      description:
        'An entrance to Simmet Alley. Two figures walking in the distance beneath the welcome sign.',
      anomalyHint: 'Identify the location and the individuals present.',
      status: 'unreviewed',
      clueIds: ['clue-sign', 'clue-walkers'],
      clueZones: [
        {
          id: 'zone-sign',
          label: 'SIMMET ALLEY SIGN',
          description: 'Welcome to Simmet Alley sign overhead.',
          x: 35, y: 25, width: 30, height: 15
        },
        {
          id: 'zone-walkers',
          label: 'TWO FIGURES',
          description: 'Two individuals walking down the alleyway.',
          x: 45, y: 65, width: 10, height: 15
        },
      ],
    },
    {
      id: 'evidence-03',
      caseId: 'case-017',
      title: 'PARKING LOT',
      location: 'Luxury Auto Lot',
      timestamp: '02:17 AM',
      imageSrc: '/evidence/evidence-03.webp',
      description:
        'An open parking lot with several luxury vehicles and supercars parked in formation.',
      anomalyHint: 'The vehicles match profiles from known syndicates.',
      status: 'locked',
      clueIds: ['clue-supercar-black', 'clue-supercar-white'],
      clueZones: [
        {
          id: 'zone-supercar-black',
          label: 'BLACK SUPERCAR',
          description: 'A sleek black supercar parked in the foreground.',
          x: 10, y: 70, width: 40, height: 25
        },
        {
          id: 'zone-supercar-white',
          label: 'WHITE SUPERCAR',
          description: 'A white supercar parked near the center.',
          x: 55, y: 50, width: 25, height: 15
        },
      ],
    },
    {
      id: 'evidence-04',
      caseId: 'case-017',
      title: 'NIGHTCLUB',
      location: 'The Velvet Pier, Ocean Beach',
      timestamp: '02:31 AM',
      imageSrc: '/evidence/evidence-04.webp',
      description:
        'Inside a nightclub bathed in purple neon. A DJ is performing with their hands raised.',
      anomalyHint: 'The DJ matches a known person of interest.',
      status: 'locked',
      clueIds: ['clue-dj', 'clue-lights'],
      clueZones: [
        {
          id: 'zone-dj',
          label: 'THE DJ',
          description: 'The DJ performing on stage.',
          x: 35, y: 15, width: 15, height: 20
        },
        {
          id: 'zone-lights',
          label: 'NEON LIGHTS',
          description: 'Distinctive hexagon neon lights on the ceiling.',
          x: 30, y: 0, width: 45, height: 25
        },
      ],
    },
    {
      id: 'evidence-05',
      caseId: 'case-017',
      title: 'SECURITY CAMERA',
      location: 'Mansion Hallway, CH 3',
      timestamp: '02:17 AM',
      imageSrc: '/evidence/evidence-05.jpg',
      description:
        'A black and white CCTV capture of a shootout in a hallway. One man firing a weapon.',
      anomalyHint: 'Identify the shooter and the victim.',
      status: 'locked',
      clueIds: ['clue-shooter', 'clue-victim'],
      clueZones: [
        {
          id: 'zone-shooter',
          label: 'THE SHOOTER',
          description: 'A man in a vest firing an assault rifle.',
          x: 40, y: 45, width: 20, height: 45
        },
        {
          id: 'zone-victim',
          label: 'THE VICTIM',
          description: 'A figure falling backward over the railing.',
          x: 25, y: 15, width: 10, height: 25
        },
      ],
    },
  ],

  clues: [
    {
      id: 'clue-suit',
      title: 'OBSERVING FIGURE',
      description: 'A man in a grey suit watching the biker gang.',
      detail: 'He seems out of place on this street. An overseer or a target?',
      type: 'person',
      evidenceId: 'evidence-01',
      linkedEntities: ['clue-bikers', 'clue-shooter'],
      xp: 15,
    },
    {
      id: 'clue-bikers',
      title: 'BIKER GANG',
      description: 'A large group of bikers gathered together.',
      detail: 'Known affiliates of a local syndicate. Why are they gathered here?',
      type: 'person',
      evidenceId: 'evidence-01',
      linkedEntities: ['clue-suit'],
      xp: 10,
    },
    {
      id: 'clue-sign',
      title: 'SIMMET ALLEY',
      description: 'The entrance to Simmet Alley in Textile City.',
      detail: 'A known drop-off location for illicit goods.',
      type: 'location',
      evidenceId: 'evidence-02',
      linkedEntities: ['clue-walkers'],
      xp: 10,
    },
    {
      id: 'clue-walkers',
      title: 'TWO FIGURES',
      description: 'Two people walking down the alley.',
      detail: 'They appear to be carrying something. Heading towards the drop-off point.',
      type: 'person',
      evidenceId: 'evidence-02',
      linkedEntities: ['clue-sign'],
      xp: 15,
    },
    {
      id: 'clue-supercar-black',
      title: 'BLACK SUPERCAR',
      description: 'A high-end sports car.',
      detail: 'Registered to a shell company used by the syndicate.',
      type: 'vehicle',
      evidenceId: 'evidence-03',
      linkedEntities: ['clue-supercar-white'],
      xp: 20,
    },
    {
      id: 'clue-supercar-white',
      title: 'WHITE SUPERCAR',
      description: 'Another high-end vehicle in the lot.',
      detail: 'Often used by the syndicate bosses for quick getaways.',
      type: 'vehicle',
      evidenceId: 'evidence-03',
      linkedEntities: ['clue-supercar-black'],
      xp: 15,
    },
    {
      id: 'clue-dj',
      title: 'THE DJ',
      description: 'A DJ performing at the club.',
      detail: 'Known to be an informant. Is he passing messages through the music?',
      type: 'person',
      evidenceId: 'evidence-04',
      linkedEntities: ['clue-lights'],
      xp: 20,
    },
    {
      id: 'clue-lights',
      title: 'HEXAGON LIGHTS',
      description: 'Custom lighting rig at the club.',
      detail: 'The lights flash in a pattern that matches a Morse code distress signal.',
      type: 'object',
      evidenceId: 'evidence-04',
      linkedEntities: ['clue-dj'],
      xp: 10,
    },
    {
      id: 'clue-shooter',
      title: 'THE SHOOTER',
      description: 'A man firing a weapon in the hallway.',
      detail: 'He matches the profile of the man in the grey suit, now heavily armed.',
      type: 'person',
      evidenceId: 'evidence-05',
      linkedEntities: ['clue-victim', 'clue-suit'],
      xp: 25,
    },
    {
      id: 'clue-victim',
      title: 'THE VICTIM',
      description: 'A figure being shot and falling.',
      detail: 'Appears to be one of the bikers from Ocean Drive. The syndicate is cleaning house.',
      type: 'person',
      evidenceId: 'evidence-05',
      linkedEntities: ['clue-shooter', 'clue-bikers'],
      xp: 20,
    },
  ],

  suspects: [
    {
      id: 'suspect-suit',
      alias: 'THE OVERSEER',
      description: 'Man in the grey suit, later seen as the shooter.',
      linkedClueIds: ['clue-suit', 'clue-shooter'],
    },
    {
      id: 'suspect-informant',
      alias: 'THE DJ',
      description: 'Club DJ and suspected informant.',
      linkedClueIds: ['clue-dj'],
    },
  ],

  locations: [
    {
      id: 'loc-ocean-drive',
      name: 'OCEAN DRIVE',
      description: 'Where the bikers and the overseer were spotted.',
      linkedClueIds: ['clue-suit', 'clue-bikers'],
    },
    {
      id: 'loc-alley',
      name: 'SIMMET ALLEY',
      description: 'The suspected drop-off location.',
      linkedClueIds: ['clue-sign', 'clue-walkers'],
    },
    {
      id: 'loc-parking',
      name: 'LUXURY AUTO LOT',
      description: 'Where the syndicate vehicles are kept.',
      linkedClueIds: ['clue-supercar-black', 'clue-supercar-white'],
    },
  ],

  decisions: [
    {
      id: 'report',
      label: 'REPORT IT',
      description: 'Hand the evidence to Vice City Police Department. Let the law handle it.',
      consequence: 'The case enters the official system. Slower, but safer.',
      reputationDelta: 24,
      heatDelta: -12,
      endingId: 'good-investigator',
    },
    {
      id: 'publish',
      label: 'PUBLISH THE STORY',
      description: 'Release the evidence to the public. Let the city decide.',
      consequence: 'The story goes viral. You become known. Powerful people take notice.',
      reputationDelta: 38,
      heatDelta: 24,
      endingId: 'the-scoop',
    },
    {
      id: 'sell',
      label: 'SELL THE EVIDENCE',
      description: 'An anonymous buyer has already reached out. The price is generous.',
      consequence: 'You get paid. But you lose something more valuable.',
      reputationDelta: -18,
      heatDelta: 32,
      endingId: 'the-fixer',
    },
  ],

  endings: [
    {
      id: 'good-investigator',
      title: 'THE GOOD INVESTIGATOR',
      headline: 'JUSTICE SERVED',
      narrative: 'You handed the evidence to VCPD. The syndicate was dismantled.',
      reputationChange: 24,
      heatChange: -12,
      badge: 'CIVIC HERO',
    },
    {
      id: 'the-scoop',
      title: 'THE SCOOP',
      headline: 'STORY GOES VIRAL',
      narrative: 'You published everything. Vice City woke up to photographs it could not ignore.',
      reputationChange: 38,
      heatChange: 24,
      badge: 'PRESS FREEDOM',
    },
    {
      id: 'the-fixer',
      title: 'THE FIXER',
      headline: 'COMPROMISE',
      narrative: 'The buyer paid in cash. The photographs disappeared.',
      reputationChange: -18,
      heatChange: 32,
      badge: 'THE FIXER',
    },
  ],
};
