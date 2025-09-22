import { Season } from './types';

// Initial prompts for each season - we'll expand this later
export const INITIAL_PROMPTS: Record<Season, string[]> = {
  Spring: [
    "A new settlement has been established. What is it called and what draws people there?",
    "Spring rains have revealed something previously hidden. What is it and how does it affect the community?"
  ],
  Summer: [
    "A traveling merchant arrives with unusual goods. What are they and what do they offer in exchange?",
    "The heat has caused a problem with the water supply. How do the communities respond?"
  ],
  Autumn: [
    "Harvest time brings both abundance and conflict. What resources are being contested?",
    "A mysterious figure arrives claiming to have knowledge of the coming winter. What do they say?"
  ],
  Winter: [
    "A harsh storm has trapped a group of people. How do the other communities respond?",
    "An old structure has collapsed under the weight of snow. What is discovered beneath it?"
  ]
};