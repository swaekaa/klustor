// ============================================================
// CASE 017: THE OCEAN DRIVE INCIDENT
// Full case data configuration
// ============================================================
import type { Case } from '../../types';

// Evidence image paths
// Primary: local files in /public/evidence/ (add your images here)
// Fallback: automatically handled by onError in components via picsum.photos
const IMG = {
  e01: '/evidence/ocean-drive.jpg',
  e02: '/evidence/parking-garage.jpg',
  e03: '/evidence/nightclub.jpg',
  e04: '/evidence/alley.jpg',
  e05: '/evidence/security-cam.jpg',
};

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
      imageSrc: IMG.e01,
      description:
        'Wide shot of Ocean Drive at 01:42 AM. The street is quiet except for one vehicle and a lone figure near a storefront.',
      anomalyHint: 'Something about the vehicle and the figure near the storefront.',
      status: 'unreviewed',
      clueIds: ['clue-vehicle-01', 'clue-person-01'],
      clueZones: [
        {
          id: 'zone-vehicle',
          label: 'VEHICLE',
          description: 'A black luxury sedan with engine running, exhaust visible.',
          region: 'bottom-right',
        },
        {
          id: 'zone-person',
          label: 'PERSON',
          description: 'A figure in a dark jacket near the storefront doorway.',
          region: 'bottom-right',
        },
      ],
    },
    {
      id: 'evidence-02',
      caseId: 'case-017',
      title: 'PARKING GARAGE',
      location: 'Harbor Street Garage, Level 2',
      timestamp: '02:03 AM',
      imageSrc: IMG.e02,
      description:
        'Dimly lit parking garage. A black SUV parked in shadows. A duffel bag on the floor. A second figure barely visible near a pillar.',
      anomalyHint: 'Multiple anomalies present. Look carefully at the vehicle and the floor.',
      status: 'unreviewed',
      clueIds: ['clue-plate-01', 'clue-bag-01', 'clue-person-02'],
      clueZones: [
        {
          id: 'zone-plate',
          label: 'LICENSE PLATE',
          description: 'License plate partially visible on the SUV. Plate: VC-4921.',
          region: 'center',
        },
        {
          id: 'zone-bag',
          label: 'DUFFEL BAG',
          description: 'A duffel bag abandoned on the concrete floor near the vehicle.',
          region: 'bottom-right',
        },
        {
          id: 'zone-figure',
          label: 'SECOND FIGURE',
          description: 'A blurry figure visible near a concrete pillar in the background.',
          region: 'bottom-right',
        },
      ],
    },
    {
      id: 'evidence-03',
      caseId: 'case-017',
      title: 'NIGHTCLUB ENTRANCE',
      location: 'The Velvet Pier, Ocean Beach',
      timestamp: '02:17 AM',
      imageSrc: IMG.e03,
      description:
        'Outside The Velvet Pier nightclub. A person in a red jacket is being escorted out by security. The same black vehicle is at the curb.',
      anomalyHint: 'Who is being removed? What vehicle is at the curb?',
      status: 'locked',
      clueIds: ['clue-redcoat-01', 'clue-vehicle-02', 'clue-location-velvet'],
      clueZones: [
        {
          id: 'zone-redcoat',
          label: 'RED JACKET PERSON',
          description: 'Person in red jacket being escorted from the nightclub.',
          region: 'center',
        },
        {
          id: 'zone-vehicle-2',
          label: 'BLACK VEHICLE',
          description: 'Same black vehicle seen on Ocean Drive, now at the nightclub.',
          region: 'bottom-left',
        },
        {
          id: 'zone-sign',
          label: 'CLUB SIGN',
          description: 'The Velvet Pier — connects the location to known criminal operations.',
          region: 'top-right',
        },
      ],
    },
    {
      id: 'evidence-04',
      caseId: 'case-017',
      title: 'THE ALLEY',
      location: 'Santeria Lane, Vice City',
      timestamp: '02:31 AM',
      imageSrc: IMG.e04,
      description:
        'A narrow alley behind Ocean Beach. A cracked phone on the ground. Muddy footprints. Spray-painted message on the wall.',
      anomalyHint: 'Someone left in a hurry. What does the message say?',
      status: 'locked',
      clueIds: ['clue-phone-01', 'clue-message-01', 'clue-footprints-01'],
      clueZones: [
        {
          id: 'zone-phone',
          label: 'CRACKED PHONE',
          description: 'A smartphone face-down on the cobblestones, screen shattered.',
          region: 'bottom-left',
        },
        {
          id: 'zone-message',
          label: 'WALL MESSAGE',
          description: 'Spray-painted on brick: LEAVE IT.',
          region: 'top-left',
        },
        {
          id: 'zone-prints',
          label: 'FOOTPRINTS',
          description: 'Muddy footprints leading away from the phone, heading north.',
          region: 'center',
        },
      ],
    },
    {
      id: 'evidence-05',
      caseId: 'case-017',
      title: 'SECURITY CAMERA',
      location: 'Harbor Parking, CH 3',
      timestamp: '02:17 AM',
      imageSrc: IMG.e05,
      description:
        'Grainy CCTV still from Harbor Parking. A suspect visible near a vehicle. Timestamp matches the nightclub ejection.',
      anomalyHint: 'Enhance the image. The suspect is identifiable.',
      status: 'locked',
      clueIds: ['clue-suspect-face', 'clue-vehicle-plate-2'],
      clueZones: [
        {
          id: 'zone-face',
          label: 'SUSPECT FACE',
          description: 'Male suspect, early 30s, dark hoodie. Facing camera.',
          region: 'bottom-right',
        },
        {
          id: 'zone-plate-2',
          label: 'VEHICLE PLATES',
          description: 'Front plate visible: VC-4921. Confirms same vehicle.',
          region: 'bottom-left',
        },
      ],
    },
  ],

  clues: [
    {
      id: 'clue-vehicle-01',
      title: 'BLACK SEDAN',
      description: 'A black luxury sedan spotted idling on Ocean Drive at 01:42 AM.',
      detail:
        'Engine was running. No plates visible from this angle. Consistent with a vehicle waiting for someone.',
      type: 'vehicle',
      evidenceId: 'evidence-01',
      linkedEntities: ['clue-plate-01', 'clue-vehicle-02'],
      xp: 10,
    },
    {
      id: 'clue-person-01',
      title: 'UNKNOWN FIGURE',
      description: 'A person in a dark jacket standing near a storefront on Ocean Drive.',
      detail: "Appears to be waiting. Could be the driver of the sedan, or someone they're meeting.",
      type: 'person',
      evidenceId: 'evidence-01',
      linkedEntities: ['clue-redcoat-01'],
      xp: 10,
    },
    {
      id: 'clue-plate-01',
      title: 'LICENSE PLATE VC-4921',
      description: 'Partial plate visible on the black SUV in the parking garage.',
      detail:
        'VC-4921. Vehicle registered under a shell company: Coastal Holdings LLC. Seen at multiple locations within 35 minutes.',
      type: 'object',
      evidenceId: 'evidence-02',
      linkedEntities: ['clue-vehicle-01', 'clue-vehicle-02', 'clue-vehicle-plate-2'],
      xp: 20,
    },
    {
      id: 'clue-bag-01',
      title: 'ABANDONED DUFFEL BAG',
      description: 'A heavy duffel bag left near the vehicle in the parking garage.',
      detail: 'The bag was not there when the garage was last checked at midnight. Contents unknown.',
      type: 'object',
      evidenceId: 'evidence-02',
      linkedEntities: ['clue-phone-01'],
      xp: 15,
    },
    {
      id: 'clue-person-02',
      title: 'SECOND FIGURE IN GARAGE',
      description: 'A blurry figure visible near a pillar in the parking garage.',
      detail:
        'Could be a lookout or a witness. Position suggests they were watching the vehicle without approaching it.',
      type: 'person',
      evidenceId: 'evidence-02',
      linkedEntities: ['clue-footprints-01'],
      xp: 15,
    },
    {
      id: 'clue-redcoat-01',
      title: 'RED JACKET SUSPECT',
      description: 'Person in red jacket being forcibly ejected from The Velvet Pier at 02:17 AM.',
      detail:
        'Security footage timestamps align. This person had a verbal altercation inside the club before ejection.',
      type: 'person',
      evidenceId: 'evidence-03',
      linkedEntities: ['clue-suspect-face', 'clue-message-01'],
      xp: 20,
    },
    {
      id: 'clue-vehicle-02',
      title: 'VEHICLE AT VELVET PIER',
      description: 'The same black vehicle from Ocean Drive is now outside the nightclub.',
      detail: 'Same vehicle, different location. This confirms it was following the red jacket suspect.',
      type: 'vehicle',
      evidenceId: 'evidence-03',
      linkedEntities: ['clue-plate-01'],
      xp: 15,
    },
    {
      id: 'clue-location-velvet',
      title: 'THE VELVET PIER',
      description: 'Known nightclub with connections to Vice City underworld operations.',
      detail:
        'The Velvet Pier has been under VCI surveillance since Case 012. A known meeting point for Coastal Holdings associates.',
      type: 'location',
      evidenceId: 'evidence-03',
      linkedEntities: ['clue-vehicle-01'],
      xp: 10,
    },
    {
      id: 'clue-phone-01',
      title: 'ABANDONED PHONE',
      description: 'A shattered smartphone left in Santeria Lane at 02:31 AM.',
      detail:
        "Last signal traced to The Velvet Pier. The screen is broken but the owner's partial ID is visible under the crack: ...RCELOS.",
      type: 'object',
      evidenceId: 'evidence-04',
      linkedEntities: ['clue-redcoat-01'],
      xp: 20,
    },
    {
      id: 'clue-message-01',
      title: 'GRAFFITI WARNING',
      description: 'Spray-painted message on the alley wall: LEAVE IT.',
      detail:
        'Fresh paint — applied within hours of the photograph. A threat or a warning. Someone does not want this investigated.',
      type: 'text',
      evidenceId: 'evidence-04',
      linkedEntities: [],
      xp: 10,
    },
    {
      id: 'clue-footprints-01',
      title: 'MUDDY FOOTPRINTS',
      description: 'Footprints in the alley leading north toward the harbor.',
      detail: 'Two sets — one heavy, one lighter. Both heading toward the Harbor Street Garage area.',
      type: 'object',
      evidenceId: 'evidence-04',
      linkedEntities: ['clue-person-02'],
      xp: 10,
    },
    {
      id: 'clue-suspect-face',
      title: 'SUSPECT IDENTIFIED',
      description: 'A male suspect, early 30s, visible on security camera at 02:17 AM.',
      detail:
        'Dark hoodie, athletic build. Facial recognition (VCI database) returns a partial match: Marco Bautista, known associate of Coastal Holdings.',
      type: 'person',
      evidenceId: 'evidence-05',
      linkedEntities: ['clue-redcoat-01', 'clue-plate-01'],
      xp: 25,
    },
    {
      id: 'clue-vehicle-plate-2',
      title: 'PLATE CONFIRMED: VC-4921',
      description: 'Front plate on the CCTV still confirms: VC-4921.',
      detail:
        'This is the same vehicle seen on Ocean Drive, at the parking garage, and outside The Velvet Pier. The timeline is now complete.',
      type: 'vehicle',
      evidenceId: 'evidence-05',
      linkedEntities: ['clue-plate-01'],
      xp: 20,
    },
  ],

  suspects: [
    {
      id: 'suspect-marco',
      alias: 'MARCO BAUTISTA',
      description: 'Known associate of Coastal Holdings LLC. Partial facial match from CCTV.',
      linkedClueIds: ['clue-suspect-face', 'clue-redcoat-01'],
    },
    {
      id: 'suspect-unknown',
      alias: 'UNKNOWN DRIVER',
      description: 'Driver of VC-4921. Identity not yet confirmed.',
      linkedClueIds: ['clue-vehicle-01', 'clue-plate-01'],
    },
  ],

  locations: [
    {
      id: 'loc-ocean-drive',
      name: 'OCEAN DRIVE',
      description: 'The starting point. Where the vehicle was first spotted.',
      linkedClueIds: ['clue-vehicle-01', 'clue-person-01'],
    },
    {
      id: 'loc-parking-garage',
      name: 'HARBOR STREET GARAGE',
      description: 'Where the vehicle was left. The bag was found here.',
      linkedClueIds: ['clue-plate-01', 'clue-bag-01'],
    },
    {
      id: 'loc-velvet-pier',
      name: 'THE VELVET PIER',
      description: 'The nightclub. Red jacket suspect ejected here.',
      linkedClueIds: ['clue-redcoat-01', 'clue-location-velvet'],
    },
    {
      id: 'loc-alley',
      name: 'SANTERIA LANE',
      description: 'The alley behind Ocean Beach. Warning message found.',
      linkedClueIds: ['clue-phone-01', 'clue-message-01'],
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
    {
      id: 'investigate',
      label: 'DIG DEEPER',
      description: 'There is more to this. You can feel it. Keep investigating.',
      consequence: 'A new lead surfaces. The rabbit hole goes deeper.',
      reputationDelta: 8,
      heatDelta: 12,
      endingId: 'dig-deeper',
    },
  ],

  endings: [
    {
      id: 'good-investigator',
      title: 'THE GOOD INVESTIGATOR',
      headline: 'JUSTICE SERVED',
      narrative:
        'You handed the evidence to VCPD. Within 48 hours, Marco Bautista was arrested at a Coastal Holdings warehouse. The duffel bag contained ledgers connecting a city councilman to the operation. The story made page 3. You sleep well tonight.',
      reputationChange: 24,
      heatChange: -12,
      badge: 'CIVIC HERO',
    },
    {
      id: 'the-scoop',
      title: 'THE SCOOP',
      headline: 'STORY GOES VIRAL',
      narrative:
        'You published everything. Vice City woke up to photographs it could not ignore. By noon, Coastal Holdings had frozen accounts and Marco Bautista had disappeared. Your name is everywhere. So is your face. Someone is watching your apartment.',
      reputationChange: 38,
      heatChange: 24,
      badge: 'PRESS FREEDOM',
    },
    {
      id: 'the-fixer',
      title: 'THE FIXER',
      headline: 'COMPROMISE',
      narrative:
        'The buyer paid in cash. The photographs disappeared. Marco Bautista was never identified. Three weeks later, a different journalist published a watered-down version of the story. Your name was not on it. Your conscience was not clean.',
      reputationChange: -18,
      heatChange: 32,
      badge: 'THE FIXER',
    },
    {
      id: 'dig-deeper',
      title: 'DIG DEEPER',
      headline: 'THE RABBIT HOLE',
      narrative:
        'You kept investigating. The phone in the alley belonged to Councilman Arcelos. The duffel bag contained more than ledgers. The vehicle is registered to a name you recognize from Case 012. This is bigger than one incident. Case 018 is already forming in your mind.',
      reputationChange: 8,
      heatChange: 12,
      badge: 'RELENTLESS',
    },
  ],
};
