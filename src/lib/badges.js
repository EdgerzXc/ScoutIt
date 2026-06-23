import { Compass, Bookmark, Briefcase, MapPin, Handshake } from "lucide-react";

export const BADGE_REGISTRY = [
  {
    id: "pioneer",
    name: "The Pioneer",
    description: "Joined ScoutIt during the Early Access phase.",
    unlockCondition: "Create an account before July 2026.",
    icon: Compass,
    rarity: "legendary"
  },
  {
    id: "master_scout",
    name: "Master Scout",
    description: "Built an extensive library of spatial intelligence.",
    unlockCondition: "Save 50+ properties to your Spatial Vault.",
    icon: Bookmark,
    rarity: "epic"
  },
  {
    id: "guildmaster",
    name: "The Guildmaster",
    description: "Master of logistics and service delegation.",
    unlockCondition: "Hire 3+ service providers (Movers, Cleaners, etc.).",
    icon: Briefcase,
    rarity: "rare"
  },
  {
    id: "spatial_analyst",
    name: "Spatial Analyst",
    description: "Contributed critical ground truth data to the ecosystem.",
    unlockCondition: "Submit 10+ location reviews or market insights.",
    icon: MapPin,
    rarity: "rare"
  },
  {
    id: "dealmaker",
    name: "Dealmaker",
    description: "Successfully navigated the market and closed a deal.",
    unlockCondition: "Close a transaction through the ScoutIt platform.",
    icon: Handshake,
    rarity: "epic"
  }
];
