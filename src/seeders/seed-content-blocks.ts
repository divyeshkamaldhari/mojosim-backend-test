import { ContentBlock } from '../models/content-block'
import { logger } from '../common/logger'

const CONTENT_DATA: Record<string, unknown> = {
  navbar: {
    links: [
      { label: 'Home', url: '/' },
      { label: 'Destinations', url: '/destinations' },
      { label: 'About Us', url: '/about' },
      { label: 'Contact', url: '/contact' },
    ],
  },
  homeHero: {
    badge: 'International eSIM card',
    headline: 'Stay Connected wherever your journey takes you.',
    subheadline:
      "With MojoSim's eSIM, enjoy seamless internet access on every trip and avoid costly roaming charges when you get back home.",
    searchForm: {
      destinationPlaceholder: 'Where are you travelling?',
      daysPlaceholder: 'For how many days?',
      buttonLabel: 'Search Plan',
    },
    trustpilot: {
      prefix: 'Based on 78,349+',
      suffix: 'customer reviews on',
    },
  },
  homeFeaturedPromoCardOne: {
    title: 'Abroad for 30+ days?',
    subtitle: 'Subscribe and save money overseas!',
    description:
      'Our monthly and yearly plans get you connected anywhere in the world as long as you want. Get started for just $49.90/month — plan big, spend less, and travel with peace of mind.',
    cta: {
      label: 'Check Plans',
      url: '/plans',
    },
    highlights: [{ label: '160 destinations' }, { label: 'Cancel anytime' }],
  },
  homeFeaturedPromoCardTwo: {
    title: 'What is an eSIM?',
    description:
      'An eSIM is a virtual or digital SIM card that allows you to connect to mobile networks without a physical SIM card. You can store multiple eSIMs, accessing different carriers, numbers, and data plans—ideal for travel or everyday use. Activate it on your phone to get online in minutes.',
    cta: {
      label: 'More Details',
      url: '/esim-installation',
    },
    highlights: [
      { label: 'Easy to use' },
      { label: 'Easy to enjoy' },
      { label: 'Easy to install' },
    ],
  },
  homeSteps: {
    title: 'Enjoy unlimited data in 3 steps',
    items: [
      {
        text: 'Find your destination and select the days for the data plan you need! Check compatibility here',
        linkText: 'Check compatibility here',
        linkUrl: '/compatibility',
      },
      {
        text: 'Install your eSIM using the setup guide in your email.',
      },
      {
        text: 'Turn on your eSIM at arrival and connect instantly.',
      },
    ],
  },
  homeBenefitsGrid: {
    heading:
      'Enjoy reliable and affordable internet in your trips. We got you covered.',
    cta: {
      label: 'I want my eSIM',
      url: '/plans',
    },
    items: [
      {
        title: 'Keep using your favorite Apps',
        description:
          'Get that safe ride home, find that good restaurant and pin the local attractions, all while staying connected with your loved ones.',
      },
      {
        title: 'Get MojoCoins after buying',
        description:
          'Earn MojoCoins when you buy an eSIM or refer a friend and use them on future purchases!',
      },
      {
        title: 'Keep your WhatsApp number',
        description:
          'You can call and message all your contacts on WhatsApp, like you’re in the same country. Don’t lose touch with family and friends.',
      },
      {
        title: '24/7 Customer support',
        description:
          'In need of assistance? Our 24/7 chat support is just a message away to keep you connected and help you with everything you need.',
      },
      {
        title: 'Money-back guarantee',
        description:
          "Purchase your Holiday eSIM with peace of mind. If your plans change, you'll have up to 6 months to request a refund.",
      },
      {
        title: 'Fast and reliable internet connection',
        description:
          'Connect to the best networks at your destination and get internet that is consistent and high speed.',
      },
    ],
  },
  homeEcoBanner: {
    heading:
      "Travel the world responsibly with MojoSim, and let's say goodbye to plastic!",
    description:
      'By using eSIMs, we can eliminate the environmental impact associated with physical SIM cards production, packaging, and distribution.',
    highlights: [
      { label: 'Zero plastic' },
      { label: 'Zero waste' },
      { label: 'Zero transport' },
    ],
    cta: {
      label: 'Buy an eSIM',
      url: '/plans',
    },
  },
  homeFaq: {
    title: 'Frequently Asked Questions (FAQs)',
    subtitle: 'Find helpful information to answer your questions',
    category: 'home',
    items: [
      {
        question: 'What is an eSIM?',
        answer:
          'An eSIM is a digital SIM that allows you to activate a cellular plan from your carrier without having to use a physical SIM card.',
      },
      {
        question: 'Can I top up my eSIM?',
        answer:
          'Yes, you can top up your data plan directly through our website or app if your plan supports top-ups.',
      },
      {
        question: "What do I do if I delete or lose my eSIM's QR code?",
        answer:
          "Don't worry! You can find your QR code in your confirmation email or by logging into your account on our website.",
      },
      {
        question: 'Do I have to activate data roaming on my device?',
        answer:
          'Yes, for the eSIM to work, you must enable Data Roaming in your device settings once you arrive at your destination.',
      },
    ],
  },
  aboutEsimFaq: {
    title: 'Everything about eSIM technology',
    subtitle: 'Learn the basics and advantages of using digital SIM cards',
    category: 'about',
    items: [
      {
        question: 'Is an eSIM better than a physical SIM?',
        answer:
          'eSIMs are more convenient for travelers as you can switch plans digitally without swapping cards, and they take up no physical space in your device.',
      },
      {
        question: 'Which devices support eSIM?',
        answer:
          'Most modern smartphones, including iPhone XR and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer support eSIM technology.',
      },
      {
        question: 'Can I use an eSIM on a locked phone?',
        answer:
          'No, your device must be carrier-unlocked to use an eSIM from a different provider like MojoSim.',
      },
      {
        question: 'Does an eSIM have a phone number?',
        answer:
          'MojoSim eSIMs are primarily data-only plans. They do not come with a traditional phone number for SMS or cellular calls, but you can use apps like WhatsApp for calling.',
      },
    ],
  },
  howEsimWorksFaq: {
    title: 'Installation & Setup Guide',
    subtitle: 'Step-by-step instructions to get you connected',
    category: 'how-it-works',
    items: [
      {
        question: 'How do I install my eSIM?',
        answer:
          'After purchase, you\'ll receive a QR code via email. Go to your phone\'s settings, select "Mobile Data" or "Cellular", and choose "Add eSIM" to scan the code.',
      },
      {
        question: 'When should I install my eSIM?',
        answer:
          'We recommend installing it a day before you travel or at the airport before departure. You can activate the data plan once you arrive at your destination.',
      },
      {
        question: 'Can I install the same eSIM on multiple devices?',
        answer:
          'No, an eSIM profile can typically only be installed on one device. Once scanned and activated, it cannot be moved to another phone.',
      },
      {
        question: 'What happens if I lose my QR code?',
        answer:
          'You can always access your QR code by logging into your MojoSim account portal or by checking your order confirmation email.',
      },
    ],
  },
  mojosimServicesFaq: {
    title: 'MojoSim Exclusive Services',
    subtitle: 'Discover the perks of being a MojoSim customer',
    category: 'services',
    items: [
      {
        question: 'What makes MojoSim different from other providers?',
        answer:
          'We offer high-speed 5G/LTE coverage in 160+ countries, 24/7 human support, and a transparent refund policy.',
      },
      {
        question: 'What are MojoCoins?',
        answer:
          'MojoCoins are our loyalty points. You earn them with every purchase and can use them to get discounts on future eSIM plans.',
      },
      {
        question: 'Do you offer unlimited data plans?',
        answer:
          'Yes, we provide unlimited data plans for many popular destinations so you never have to worry about running out of data.',
      },
      {
        question: 'Can I share my data (Hotspot)?',
        answer:
          'Most of our plans support data sharing/tethering, allowing you to use your phone as a hotspot for other devices.',
      },
    ],
  },
  aboutHero: {
    eyebrow: 'Hey! We are MojoSim',
    heading: 'Discover MojoSim, the team and all the open positions',
    headingHighlight: 'MojoSim',
    cta: { label: 'Join us', url: '/careers' },
  },
  aboutJourneyTimeline: {
    heading: 'Connecting the world one trip at a time',
    intro:
      'During a trip to Thailand, Pedro and Lidia, the founders of MojoSim, faced the frustration of having no internet connection abroad. Inspired by their struggle, they came up with a simple yet brilliant idea: letting travelers buy data plans for any destination!',
    items: [
      {
        year: '2017',
        title: 'The Beginning',
        description: 'MojoSim was founded with a vision to connect the world.',
      },
    ],
  },
  plansHero: {
    kicker: 'Discover our Monthly eSIM Data Plans',
    title: 'A global data plan for frequent travelers.',
    subtitle:
      'Monthly global data plans that keep you connected anywhere, anytime.',
    pricingLead: 'Starting from $45.95/month, cancel anytime.',
    cta: { label: 'Get connected now', url: '/plans' },
    benefits: [
      {
        title: 'Global coverage',
        description: 'Always connected in over 160 destinations.',
      },
      {
        title: 'Total flexibility',
        description: 'Cancel or reactivate anytime.',
      },
      { title: 'Multi-device', description: 'Share your data.' },
    ],
  },
  plansFeatures: {
    items: [
      {
        title: 'Always On',
        description: 'If you cancel, you keep 1 GB free per month for life.',
      },
      {
        title: 'Global coverage',
        description: 'One eSIM for multiple destinations.',
      },
      {
        title: 'Unlimited data',
        description: 'Browse without limits at high speed.',
      },
      {
        title: 'Share internet',
        description: 'Share your mobile data with other devices.',
      },
      {
        title: 'Cancel anytime',
        description: 'No commitment. Manage easily from your profile.',
      },
      {
        title: 'Support 24/7',
        description: 'Human customer service via chat and email.',
      },
    ],
  },
  reviewHero: {
    title: 'What our customers say',
    subtitle:
      'Discover the experience of other travelers through their eSIM reviews',
  },
  reviewsBenefits: {
    title:
      'We want you to have the best experience, with each purchase you will get:',
    items: [
      {
        title: 'Unlimited and Limited Data plans',
        description: 'Choose the plan that best suits you.',
      },
      {
        title: 'Fast and Reliable Internet',
        description: 'Connect to the best network at your destination.',
      },
      {
        title: 'No more Roaming Charges',
        description: 'Pay only for the data you need.',
      },
      {
        title: '24/7 Customer Support',
        description: 'Our chat support is always ready to assist.',
      },
    ],
  },
  recentReviews: {
    title: 'Read the most recent clients reviews:',
    trustpilot: {
      rating: 'Excellent',
      count: '78,349+',
    },
    reviews: [
      {
        name: 'James Miller',
        date: 'March 12th 2026',
        text: 'Great service, highly recommended!',
      },
      {
        name: 'Sophia Garcia',
        date: 'March 10th 2026',
        text: 'Seamless connectivity throughout my trip.',
      },
    ],
  },
  contactHero: {
    title: 'Need assistance?',
    subtitle: 'Our support team is always ready to help!',
  },
  contactWay: {
    title: 'Contact us anytime',
    subtitle: 'We want to help! Select the contact method that works for you.',
    methods: [
      { type: 'chat', title: 'Message us via chat' },
      {
        type: 'email',
        title: 'Message us via email',
        value: 'support@mojosim.com',
      },
      { type: 'whatsapp', title: 'Message us via WhatsApp' },
    ],
    faqCta: { label: "Other doubts? Go to our FAQ's", url: '/faqs' },
  },
  destinationHero: {
    title: 'eSIM for {countryName}',
    tabs: { standard: 'Standard', unlimited: 'Unlimited' },
    features: {
      unlimited: [
        { label: 'Unlimited data' },
        { label: 'Fast and reliable internet' },
        { label: 'No more roaming charges' },
      ],
      standard: [
        { label: 'Fixed data bundles' },
        { label: 'Fast and reliable internet' },
        { label: 'No surprise roaming' },
      ],
    },
  },
  destinationCalculator: {
    titles: {
      unlimited: 'Start enjoying unlimited data',
      standard: 'Pick a data bundle for your trip',
    },
    labels: { gb: 'Number of GBs', days: 'Number of days' },
    cta: { unlimited: 'Get Unlimited Internet', standard: 'Add to cart' },
  },
  destinationAdvantages: {
    title: 'Advantages of using MojoSim eSIM in {countryName}',
    subtitle: 'Change of plans? No problem at all!',
    description:
      'Purchase your Holafly eSIM with added peace of mind. You have up to 6 months to request a refund.',
    learnMore: { label: 'Learn more', url: '/refund-policy' },
    items: [
      {
        title: 'Keep your WhatsApp number',
        description: 'Call and message all your contacts normally.',
      },
      {
        title: 'The Best Travel eSIM',
        description: 'Enjoy Unlimited Data at 5G/4G speeds.',
      },
      {
        title: 'Unlimited data plans',
        description: 'No more top-ups or worrying about running out.',
      },
      {
        title: '24/7 customer support',
        description: 'Reach us by email or 24 hour chat support.',
      },
      {
        title: 'Immediate delivery',
        description: 'We send the eSIM immediately to your email.',
      },
      {
        title: 'Share your data',
        description: 'Share 1 GB of data per day with family and friends.',
      },
    ],
  },
  destinationEsimPrices: {
    title: 'eSIM prices for {countryName}',
    subtitle: 'MojoSim, the best eSIM for {countryName}',
    headers: { days: 'Number of days', price: 'Price' },
  },
  destinationConnection: {
    title: 'Fast and reliable connection',
    points: [
      'Clear video calls with no delays.',
      'Share stories in just a few seconds.',
      'Super fast uploading.',
      'Find your way wherever you go!',
    ],
    highlight: {
      title: 'The best Performance in all your apps',
      description:
        'Discover the freedom of reliable connectivity with high speed 4G and 5G.',
    },
  },
  destinationSupportBanner: {
    title: "Don't worry! We are here for you.",
    description:
      "If you have any questions during this process, remember we're here to assist you 24/7 through our Online Chat.",
    cta: { label: "Let's Talk", url: '/support' },
  },
  globalFooter: {
    aboutText:
      'Stay connected worldwide with affordable eSIM plans from MojoSim.',
    appLinks: [
      {
        platform: 'appStore',
        label: 'App Store',
        url: 'https://apps.apple.com/',
      },
      {
        platform: 'googlePlay',
        label: 'Google Play',
        url: 'https://play.google.com/',
      },
    ],
    linkGroups: [
      {
        title: 'About MojoSim',
        links: [
          { label: 'About Us', url: '/about' },
          { label: 'Plans', url: '/plans' },
          { label: 'Reviews', url: '/reviews' },
          { label: 'Contact us', url: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms and conditions', url: '/terms' },
          { label: 'Privacy policy', url: '/privacy' },
          { label: 'Refund policy', url: '/refund' },
        ],
      },
    ],
    contact: { email: 'support@mojosim.com' },
    socialLinks: [
      { platform: 'facebook', url: 'https://facebook.com/mojosim' },
      { platform: 'instagram', url: 'https://instagram.com/mojosim' },
      { platform: 'twitter', url: 'https://x.com/mojosim' },
    ],
    bottomBar: {
      copyrightText: 'Copyright © 2026 MojoSim. All rights reserved.',
      legalNoteText:
        'Prices and plans are subject to change. See Terms of Service for full details.',
    },
  },
  termsConditionsContent: {
    content:
      '<h1>Terms and Conditions</h1><p>MojoSim eSIM services terms...</p>',
  },
}

export const seedContentBlocks = async (): Promise<void> => {
  try {
    const locale = 'en'

    for (const [key, value] of Object.entries(CONTENT_DATA)) {
      const type =
        key.includes('Faq') || key.includes('FAQ') ? 'faq' : 'richText'
      const existing = await ContentBlock.findOne({ where: { key, locale } })

      if (existing) {
        await existing.update({
          value,
          type,
          isPublished: true,
        })
        logger.info('Updated content block', { key, locale })
      } else {
        await ContentBlock.create({
          key,
          locale,
          type,
          value,
          isPublished: true,
        })
        logger.info('Created content block', { key, locale })
      }
    }
  } catch (error) {
    logger.error('Failed to seed content blocks', { error })
    throw error
  }
}
