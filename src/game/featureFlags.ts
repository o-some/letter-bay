export const featureFlags = Object.freeze({
  v2StateMachine: false,
  enhancedAnimations: false,
  wordLearningCard: false,
  masteryChallenge: false,
  comboEnergy: false,
  helperSelection: false,
  bossMechanics: false,
  recoveryTraining: false,
  bayRestoration: false,
  audioPronunciation: false,
  bossWordReaction: true,
  bossReactionDialogue: true,
});

export type FeatureFlags = typeof featureFlags;
