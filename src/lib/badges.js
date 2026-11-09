import { Compass, Bookmark, Briefcase, MapPin, Handshake, Building2, Sparkles, Award, UserCheck } from "lucide-react";

export const BADGE_REGISTRY = [
  {
    id: "PIONEER_BROKER",
    name: "Pioneer Advisor",
    description: "One of the first 25 verified luxury brokers on ScoutIt. Holds a permanent Founding Charter.",
    unlockCondition: "Submit broker credentials, verify PRC, and publish 1 listing.",
    icon: Briefcase,
    rarity: "legendary",
    isPioneer: true,
  },
  {
    id: "PIONEER_OWNER",
    name: "Pioneer Landlord",
    description: "One of the first 20 trophy asset developers and landlords on ScoutIt.",
    unlockCondition: "Verify title or lease deed and publish 1 active trophy asset.",
    icon: Building2,
    rarity: "legendary",
    isPioneer: true,
  },
  {
    id: "PIONEER_CREATOR",
    name: "Pioneer Creator",
    description: "One of the first 15 premier visual architects and spatial photographers on ScoutIt.",
    unlockCondition: "Complete certified spatial capture missions on Metropolis.",
    icon: Sparkles,
    rarity: "epic",
    isPioneer: true,
  },
  {
    id: "FOUNDING_SEEKER",
    name: "Founding Seeker",
    description: "The original 100 accredited luxury seekers and investors on ScoutIt.",
    unlockCondition: "Hold verified seeker status and activate Spatial Vault.",
    icon: Compass,
    rarity: "rare",
    isPioneer: true,
  },
  {
    id: "ALPHA_CARTOGRAPHER",
    name: "Alpha Cartographer",
    description: "Mapped the very first 50 properties into the ScoutIt engine before public launch.",
    unlockCondition: "Contributed foundational GIS data during alpha testing.",
    icon: MapPin,
    rarity: "legendary",
    isPioneer: true,
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
    icon: Award,
    rarity: "rare"
  },
  {
    id: "spatial_analyst",
    name: "Spatial Analyst",
    description: "Contributed critical ground truth data to the ecosystem.",
    unlockCondition: "Submit 10+ location reviews or market insights.",
    icon: UserCheck,
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
