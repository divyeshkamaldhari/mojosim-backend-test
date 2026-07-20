const contentKeys = [
  'homeHero',
  'homeHighlights',
  'homeFeaturedPromoCardOne',
  'homeFeaturedPromoCardTwo',
  'homeBenefitsGrid',
  'homeSteps',
  'homeEcoBanner',
  'homeFaq',
  'planFaq',
  'reviewFaq',
  'destinationFaq',
  'aboutEsimFaq',
  'howEsimWorksFaq',
  'mojosimServicesFaq',
  'aboutHero',
  'aboutJourneyTimeline',
  'aboutTeamTestimonials',
  'reviewHero',
  'termsConditionsContent',
  'destinationWhyChooseUs',
  'destinationSupportBanner',
  'contactHero',
  'contactWay',
  'globalFooter',
  'navbar',
  'plansHero',
  'plansFeatures',
  'reviewsBenefits',
  'recentReviews',
  'destinationHero',
  'destinationCalculator',
  'destinationAdvantages',
  'destinationEsimPrices',
  'destinationConnection',
] as const

export type ContentBlockKey = (typeof contentKeys)[number]

const uploadSlotsByKey: Record<ContentBlockKey, readonly string[]> = {
  homeHero: ['heroPrimaryImage', 'heroBackgroundImage'],
  homeHighlights: [
    'featureOneIcon',
    'featureTwoIcon',
    'featureThreeIcon',
    'featureFourIcon',
  ],
  homeFeaturedPromoCardOne: [
    'cardImage',
    'highlightOneIcon',
    'highlightTwoIcon',
    'highlightThreeIcon',
    'highlightFourIcon',
  ],
  homeFeaturedPromoCardTwo: [
    'cardImage',
    'highlightOneIcon',
    'highlightTwoIcon',
    'highlightThreeIcon',
    'highlightFourIcon',
  ],
  homeBenefitsGrid: [
    'benefitOneIcon',
    'benefitTwoIcon',
    'benefitThreeIcon',
    'benefitFourIcon',
    'benefitFiveIcon',
    'benefitSixIcon',
  ],
  homeSteps: [
    'stepOneIcon',
    'stepTwoIcon',
    'stepThreeIcon',
    'stepFourIcon',
    'stepFiveIcon',
    'stepSixIcon',
  ],
  homeEcoBanner: [
    'logoMark',
    'highlightOneIcon',
    'highlightTwoIcon',
    'highlightThreeIcon',
    'highlightFourIcon',
  ],
  homeFaq: [],
  planFaq: [],
  reviewFaq: [],
  destinationFaq: [],
  aboutEsimFaq: [],
  howEsimWorksFaq: [],
  mojosimServicesFaq: [],
  aboutHero: [
    'teamMemberOneImage',
    'teamMemberTwoImage',
    'teamMemberThreeImage',
    'teamMemberFourImage',
    'teamMemberFiveImage',
    'teamMemberSixImage',
  ],
  aboutJourneyTimeline: [],
  aboutTeamTestimonials: [
    'testimonialOneThumbnail',
    'testimonialTwoThumbnail',
    'testimonialThreeThumbnail',
    'testimonialOneVideo',
    'testimonialTwoVideo',
    'testimonialThreeVideo',
  ],
  reviewHero: [
    'reviewerOneAvatar',
    'reviewerTwoAvatar',
    'reviewerThreeAvatar',
    'reviewerFourAvatar',
    'reviewerFiveAvatar',
  ],
  termsConditionsContent: [],
  destinationWhyChooseUs: [],
  destinationSupportBanner: ['illustrationImage'],
  contactHero: ['heroImage'],
  contactWay: [
    'itemOneIcon',
    'itemTwoIcon',
    'itemThreeIcon',
    'itemFourIcon',
    'itemFiveIcon',
    'itemSixIcon',
  ],
  globalFooter: ['footerLogo'],
  navbar: [],
  plansHero: ['heroImage'],
  plansFeatures: [
    'featureOneIcon',
    'featureTwoIcon',
    'featureThreeIcon',
    'featureFourIcon',
    'featureFiveIcon',
    'featureSixIcon',
  ],
  reviewsBenefits: [
    'benefitOneIcon',
    'benefitTwoIcon',
    'benefitThreeIcon',
    'benefitFourIcon',
  ],
  recentReviews: [],
  destinationHero: ['heroImage'],
  destinationCalculator: [],
  destinationAdvantages: [
    'advantageOneIcon',
    'advantageTwoIcon',
    'advantageThreeIcon',
    'advantageFourIcon',
    'advantageFiveIcon',
    'advantageSixIcon',
  ],
  destinationEsimPrices: [],
  destinationConnection: ['illustrationImage'],
}

const allowedContentKeys = new Set<string>(contentKeys)

export const isAllowedContentKey = (key: string): key is ContentBlockKey => {
  return allowedContentKeys.has(key)
}

/** Slots 1–6 use word names (legacy); 7+ use `teamMember7Image`, `teamMember8Image`, … */
const ABOUT_HERO_TEAM_IMAGE_SLOT_RE =
  /^teamMember(?:One|Two|Three|Four|Five|Six|[7-9]|[1-9]\d+)Image$/

/** First three: `testimonialOneThumbnail` / `testimonialOneVideo`; fourth+ use `testimonial4Thumbnail`, `testimonial4Video`, … */
const ABOUT_TEAM_TESTIMONIALS_SLOT_RE =
  /^testimonial(?:(?:One|Two|Three)(Thumbnail|Video)|(?:[4-9]|[1-9]\d+)(Thumbnail|Video))$/

/** First five use word names; 6+ use `reviewer6Avatar`, `reviewer7Avatar`, … */
const REVIEW_HERO_AVATAR_SLOT_RE =
  /^reviewer(?:(?:One|Two|Three|Four|Five)Avatar|(?:[6-9]|[1-9]\d+)Avatar)$/

export const isAllowedContentSlot = (key: string, slot: string): boolean => {
  if (!isAllowedContentKey(key)) return false
  if (key === 'aboutHero') {
    return ABOUT_HERO_TEAM_IMAGE_SLOT_RE.test(slot)
  }
  if (key === 'aboutTeamTestimonials') {
    return ABOUT_TEAM_TESTIMONIALS_SLOT_RE.test(slot)
  }
  if (key === 'reviewHero') {
    return REVIEW_HERO_AVATAR_SLOT_RE.test(slot)
  }
  return uploadSlotsByKey[key].includes(slot)
}
