// Keep dialog state changes immediate when the device asks for reduced motion.
// The backdrop keeps its settled blur; panels never travel or scale.
export const stillBackdropVariants = {
  hidden: { opacity: 1, backdropFilter: "blur(8px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)" },
  exit: { opacity: 1, backdropFilter: "blur(8px)" },
};

export const stillPanelVariants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: 0, scale: 1 },
};

export const instantDialogTransition = { duration: 0 };
