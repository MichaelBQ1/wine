
export enum Step {
  MODE_SELECTION = 'MODE_SELECTION',
  PREPARATION = 'PREPARATION',
  FERMENTATION = 'FERMENTATION',
  FILTRATION = 'FILTRATION',
  // Sparkling specific
  TIRAGE = 'TIRAGE',
  RIDDLING = 'RIDDLING',
  FREEZING = 'FREEZING',
  DISGORGEMENT = 'DISGORGEMENT',
  // Still specific
  AGING = 'AGING',
  BOTTLING = 'BOTTLING',
  RESULTS = 'RESULTS'
}

export enum WineMode {
  STILL = 'STILL',
  SPARKLING = 'SPARKLING'
}

export interface AppState {
  currentStep: Step;
  wineMode: WineMode | null;
  // Step 1
  isWashed: boolean;
  isWashing: boolean;
  isCrushed: boolean;
  crushGranularity: number; 
  isYeastAdded: boolean;
  // Step 2
  isFermenting: boolean;
  fermentationTemp: number;
  fermentationProgress: number; 
  fermentationTime: number;
  fermentationStatus: 'active' | 'done' | 'spoiled';
  // Step 3
  isPressed: boolean;
  isFiltered: boolean;
  isCleaning: boolean;
  // Step 4+
  agingWeeks: number;
  riddlingProgress: number;
  isFrozen: boolean; // For sparkling
  isDisgorged: boolean; // For sparkling
  isBottled: boolean;
  isHermetic: boolean;
  // Quality Tracking
  qualityLogs: string[];
  finalScore: number;
}
