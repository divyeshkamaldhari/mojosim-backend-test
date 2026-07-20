# Content Block Structure Contract

This file is the source of truth for dynamic page section keys, upload slots, and `content_blocks.value` JSON shapes.

We will keep updating this file as new sections are finalized.

---

## Global Rules (Current)

- Content API key format: use camelCase style keys (example: `homeHero`)
- Content upsert uniqueness: `key + locale`
- Upload endpoint inputs: `file`, `key`, `slot` (no `locale` for uploads)
- Content API stores media URLs inside `value`

---

## Home Page Sections

---

## Section 1: Home Hero

### Editable fields

- Headline text (`value.headline`)
- Subheadline text (`value.subheadline`)
- Search destination placeholder (`value.searchForm.destinationPlaceholder`)
- Search days placeholder (`value.searchForm.daysPlaceholder`)
- Search button label (`value.searchForm.buttonLabel`)
- Hero primary image URL (`value.media.heroPrimaryImageUrl`)
- Hero background image URL (`value.media.heroBackgroundImageUrl`)

### Content block key

- `homeHero`

### Upload slots

- `heroPrimaryImage` (main person/foreground visual)
- `heroBackgroundImage` (background/shape image)

### Upload request examples

Example 1:

- `file`: `hero-primary.jpg`
- `key`: `homeHero`
- `slot`: `heroPrimaryImage`

Example 2:

- `file`: `hero-background.png`
- `key`: `homeHero`
- `slot`: `heroBackgroundImage`

### Content upsert body example

`PUT /api/v1/admin/content/homeHero`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "headline": "Stay Connected wherever your journey takes you.",
    "subheadline": "With mojoSim's eSIM, enjoy seamless internet access on every trip and avoid costly roaming charges when you get back home.",
    "searchForm": {
      "destinationPlaceholder": "Where are you travelling?",
      "daysPlaceholder": "For how many days?",
      "buttonLabel": "Search Plan"
    },
    "media": {
      "heroPrimaryImageUrl": "https://cdn.example.com/content/homeHero/heroPrimaryImage.jpg",
      "heroBackgroundImageUrl": "https://cdn.example.com/content/homeHero/heroBackgroundImage.png"
    }
  },
  "is_published": true
}
```

---


## Section 2: Home Highlights (Features Strip - 4 Items)

### Editable fields

- Feature 1 icon/title/description
- Feature 2 icon/title/description
- Feature 3 icon/title/description
- Feature 4 icon/title/description

### Content block key

- `homeHighlights`

### Upload slots

- `featureOneIcon`
- `featureTwoIcon`
- `featureThreeIcon`
- `featureFourIcon`

### Upload request examples

Example 1:

- `file`: `unlimited-data.png`
- `key`: `homeHighlights`
- `slot`: `featureOneIcon`

Example 2:

- `file`: `no-roaming.png`
- `key`: `homeHighlights`
- `slot`: `featureTwoIcon`

Example 3:

- `file`: `keep-sim.png`
- `key`: `homeHighlights`
- `slot`: `featureThreeIcon`

Example 4:

- `file`: `easy-install.png`
- `key`: `homeHighlights`
- `slot`: `featureFourIcon`

### Content upsert body example

`PUT /api/v1/admin/content/homeHighlights`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "items": [
      {
        "iconUrl": "https://cdn.mojosim.com/content/homeHighlights/featureOneIcon.png",
        "title": "Unlimited data",
        "description": "Get unlimited data plans at multiple destinations."
      },
      {
        "iconUrl": "https://cdn.mojosim.com/content/homeHighlights/featureTwoIcon.png",
        "title": "No roaming charges",
        "description": "Travel and stay connected without roaming or surprise bills."
      },
      {
        "iconUrl": "https://cdn.mojosim.com/content/homeHighlights/featureThreeIcon.png",
        "title": "Keep your physical SIM",
        "description": "Keep your local SIM card to receive calls."
      },
      {
        "iconUrl": "https://cdn.mojosim.com/content/homeHighlights/featureFourIcon.png",
        "title": "Easy installation",
        "description": "Purchase and setup your eSIM in minutes."
      }
    ]
  },
  "is_published": true
}
```

---

## Section 3: Home Featured Promo Card (First Card Only)

This section is based on your current requirement: only the following should be editable for the first image/card:

- Title: `Abroad for 30+ days?`
- Subtitle: `Subscribe and save money overseas!`
- Description paragraph text
- CTA label (`value.cta.label`)
- CTA URL (`value.cta.url`)
- Highlights list with icon + label (`value.highlights[]`)

### Content block key

- `homeFeaturedPromoCardOne`

### Upload slot

- `cardImage`

### Upload request example

- `file`: `featured-card-1.png`
- `key`: `homeFeaturedPromoCardOne`
- `slot`: `cardImage`

### Content upsert body example

`PUT /api/v1/admin/content/homeFeaturedPromoCardOne`

```json
{
  "locale": "en",
  "type": "promo_card",
  "value": {
    "title": "Abroad for 30+ days?",
    "subtitle": "Subscribe and save money overseas!",
    "description": "Our monthly and yearly plans get you connected anywhere in the world as long as you want. Get started for just $49.90/month - plan big, spend less, and travel with peace of mind.",
    "cta": {
      "label": "Check Plans",
      "url": "/plans"
    },
    "highlights": [
      {
        "iconUrl": "https://cdn.example.com/content/homeFeaturedPromoCardOne/highlightOneIcon.png",
        "label": "160 destinations"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeFeaturedPromoCardOne/highlightTwoIcon.png",
        "label": "Cancel anytime"
      }
    ],
    "media": {
      "cardImageUrl": "https://cdn.example.com/content/homeFeaturedPromoCardOne/cardImage.png"
    }
  },
  "is_published": true
}
```
---
---

## Section 4: Home Featured Promo Card (Second Card - "What is an eSIM?")

This section is for the second promo card shown with the "What is an eSIM?" heading.

### Editable fields

- Title text (`value.title`)
- Description paragraph text (`value.description`)
- CTA label (`value.cta.label`)
- CTA URL (`value.cta.url`)
- Highlights list with icon + label (`value.highlights[]`)
- Card image URL (`value.media.cardImageUrl`)

### Content block key

- `homeFeaturedPromoCardTwo`

### Upload slot

- `cardImage`

### Upload request example

- `file`: `featured-card-2.png`
- `key`: `homeFeaturedPromoCardTwo`
- `slot`: `cardImage`

### Content upsert body example

`PUT /api/v1/admin/content/homeFeaturedPromoCardTwo`

```json
{
  "locale": "en",
  "type": "promo_card",
  "value": {
    "title": "What is an eSIM?",
    "description": "An eSIM is a virtual or digital SIM card that allows you to connect to mobile networks without a physical SIM card. You can store multiple eSIMs, access different carriers, numbers, and data plans directly for travel or everyday use. Activate it on your phone to get online in minutes.",
    "cta": {
      "label": "More Details",
      "url": "/esim-installation"
    },
    "highlights": [
      {
        "iconUrl": "https://cdn.example.com/content/homeFeaturedPromoCardTwo/highlightOneIcon.png",
        "label": "easy to use"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeFeaturedPromoCardTwo/highlightTwoIcon.png",
        "label": "easy to enjoy"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeFeaturedPromoCardTwo/highlightThreeIcon.png",
        "label": "easy to install"
      }
    ],
    "media": {
      "cardImageUrl": "https://cdn.example.com/content/homeFeaturedPromoCardTwo/cardImage.png"
    }
  },
  "is_published": true
}
```

---

## Section 5: Home Benefits Grid (6 Feature Icons + CTA)

This section is the grid block with heading text, six benefit items (icon + title + description), and one CTA button.

### Editable fields

- Section heading text (`value.heading`)
- Benefit item 1 icon/title/description
- Benefit item 2 icon/title/description
- Benefit item 3 icon/title/description
- Benefit item 4 icon/title/description
- Benefit item 5 icon/title/description
- Benefit item 6 icon/title/description
- CTA button label (`value.cta.label`)
- CTA URL (`value.cta.url`)

### Content block key

- `homeBenefitsGrid`

### Upload slots

- `benefitOneIcon`
- `benefitTwoIcon`
- `benefitThreeIcon`
- `benefitFourIcon`
- `benefitFiveIcon`
- `benefitSixIcon`

### Upload request examples

Example 1:

- `file`: `benefit-safe-apps.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitOneIcon`

Example 2:

- `file`: `benefit-refer-earn.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitTwoIcon`

Example 3:

- `file`: `benefit-keep-whatsapp.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitThreeIcon`

Example 4:

- `file`: `benefit-support.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitFourIcon`

Example 5:

- `file`: `benefit-refund.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitFiveIcon`

Example 6:

- `file`: `benefit-fast-internet.png`
- `key`: `homeBenefitsGrid`
- `slot`: `benefitSixIcon`

### Content upsert body example

`PUT /api/v1/admin/content/homeBenefitsGrid`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "heading": "Enjoy reliable and affordable internet in your trips. We got you covered.",
    "items": [
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitOneIcon.png",
        "title": "Keep using your favorite Apps",
        "description": "Get that safe ride home, find that great restaurant, and pin the local attractions, all while staying connected with your loved ones."
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitTwoIcon.png",
        "title": "Get MojoCoins after buying",
        "description": "Earn MojoCoins when you buy an eSIM or refer a friend, and use them on future purchases!"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitThreeIcon.png",
        "title": "Keep your WhatsApp number",
        "description": "You can call and message all your contacts on WhatsApp, like you're in the same country. Don't lose touch with family and friends."
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitFourIcon.png",
        "title": "24/7 Customer support",
        "description": "In need of assistance? Our 24/7 chat support is just a message away to keep you connected and help you with everything you need."
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitFiveIcon.png",
        "title": "Money-back guarantee",
        "description": "Purchase your Holafly eSIM with peace of mind. If your plans change, you'll have up to 6 months to request a refund."
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeBenefitsGrid/benefitSixIcon.png",
        "title": "Fast and reliable Internet connection",
        "description": "Connect to the best networks at your destination and get internet that is consistent and high-speed."
      }
    ],
    "cta": {
      "label": "I want my eSIM",
      "url": "/plans"
    }
  },
  "is_published": true
}
```

---

## Section 6: Home Eco Commitment Banner

This section is the sustainability/eco banner block with heading, supporting text, three compact highlights, CTA, and one brand logo mark.

### Editable fields

- Main heading text (`value.heading`)
- Supporting description text (`value.description`)
- Highlight item 1 icon/label (`value.highlights[0].iconUrl`, `value.highlights[0].label`)
- Highlight item 2 icon/label (`value.highlights[1].iconUrl`, `value.highlights[1].label`)
- Highlight item 3 icon/label (`value.highlights[2].iconUrl`, `value.highlights[2].label`)
- CTA button label (`value.cta.label`)
- CTA URL (`value.cta.url`)
- Top-right logo image URL (`value.media.logoMarkUrl`)

### Content block key

- `homeEcoBanner`

### Upload slots

- `logoMark`
- `highlightOneIcon`
- `highlightTwoIcon`
- `highlightThreeIcon`

### Upload request examples

Example 1:

- `file`: `eco-banner-logo.png`
- `key`: `homeEcoBanner`
- `slot`: `logoMark`

Example 2:

- `file`: `highlight-one-icon.png`
- `key`: `homeEcoBanner`
- `slot`: `highlightOneIcon`

Example 3:

- `file`: `highlight-two-icon.png`
- `key`: `homeEcoBanner`
- `slot`: `highlightTwoIcon`

Example 4:

- `file`: `highlight-three-icon.png`
- `key`: `homeEcoBanner`
- `slot`: `highlightThreeIcon`

### Content upsert body example

`PUT /api/v1/admin/content/homeEcoBanner`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "heading": "Travel the world responsibly with Mojosim, and let's say goodbye to plastic!",
    "description": "By using eSIMs, we can eliminate the environmental impact associated with physical SIM cards production, packaging, and distribution.",
    "highlights": [
      {
        "iconUrl": "https://cdn.example.com/content/homeEcoBanner/highlightOneIcon.png",
        "label": "Zero plastic"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeEcoBanner/highlightTwoIcon.png",
        "label": "Zero hassle"
      },
      {
        "iconUrl": "https://cdn.example.com/content/homeEcoBanner/highlightThreeIcon.png",
        "label": "Zero transport"
      }
    ],
    "cta": {
      "label": "Buy an eSIM",
      "url": "/plans"
    },
    "media": {
      "logoMarkUrl": "https://cdn.example.com/content/homeEcoBanner/logoMark.png"
    }
  },
  "is_published": true
}
```

---

## Section 7: Home FAQ Accordion

This section is the FAQ block with section heading, supporting subtitle, and a list of expandable question/answer items.

### Editable fields

- Section title (`value.title`)
- Section subtitle (`value.subtitle`)
- FAQ category (`value.category`) - example: `home`, `about`, `plans`
- FAQ items list (`value.items[]`)
- Each FAQ item question (`value.items[].question`)
- Each FAQ item answer (`value.items[].answer`)

### Content block key

- `homeFaq`

### Upload slots

- None (text-only section)

### Content upsert body example

`PUT /api/v1/admin/content/homeFaq`

```json
{
  "locale": "en",
  "type": "faq",
  "value": {
    "title": "Frequently Asked Questions (FAQs)",
    "subtitle": "Find helpful information to answer your questions",
    "category": "home",
    "items": [
      {
        "question": "What is an eSIM?",
        "answer": "An eSIM is a virtual SIM card that lets you connect to mobile networks without inserting a physical SIM."
      },
      {
        "question": "Can I top up my eSIM?",
        "answer": "Yes, top-up availability depends on your purchased plan and provider support."
      },
      {
        "question": "How can I get a refund?",
        "answer": "Refunds depend on plan status and policy. Contact support with your order details."
      },
      {
        "question": "Can I keep my WhatsApp number?",
        "answer": "Yes, you can keep your WhatsApp number while using an eSIM."
      }
    ]
  },
  "is_published": true
}
```

---

## About Page Sections

---

## Section 1: About Hero Team Showcase

This is the first About page hero section with left-side intro text and a right-side team showcase grid.

### Editable fields

- Intro eyebrow text (`value.eyebrow`)
- Main heading text (`value.heading`)
- Highlight text inside heading (`value.headingHighlight`)
- Team member cards (`value.teamMembers[]`)
- Team member image URL (`value.teamMembers[].imageUrl`)
- Team member name (`value.teamMembers[].name`)
- Team member role (`value.teamMembers[].role`)

### Content block key

- `aboutHero`

### Upload slots

- `teamMemberOneImage`
- `teamMemberTwoImage`
- `teamMemberThreeImage`
- `teamMemberFourImage`
- `teamMemberFiveImage`
- `teamMemberSixImage`

### Upload request examples

Example 1:

- `file`: `about-team-1.jpg`
- `key`: `aboutHero`
- `slot`: `teamMemberOneImage`

Example 2:

- `file`: `about-team-2.jpg`
- `key`: `aboutHero`
- `slot`: `teamMemberTwoImage`

### Content upsert body example

`PUT /api/v1/admin/content/aboutHero`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "eyebrow": "Hey! We are mojoSim",
    "heading": "Discover mojoSim, the team and all the open positions",
    "headingHighlight": "mojoSim",
    "teamMembers": [
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberOneImage.jpg",
        "name": "James Miller",
        "role": "Customer Experience Director"
      },
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberTwoImage.jpg",
        "name": "Michael Davis",
        "role": "UX Designer"
      },
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberThreeImage.jpg",
        "name": "Olivia Smith",
        "role": "Digital Account Executive"
      },
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberFourImage.jpg",
        "name": "Sophia Garcia",
        "role": "Content Manager"
      },
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberFiveImage.jpg",
        "name": "Emma Johnson",
        "role": "Global Marketing Manager"
      },
      {
        "imageUrl": "https://cdn.example.com/content/aboutHero/teamMemberSixImage.jpg",
        "name": "Robert Wilson",
        "role": "Growth Specialist"
      }
    ]
  },
  "is_published": true
}
```

---

## Section 2: About Journey Timeline

This section is the About page timeline/story block with heading, supporting intro text, and horizontally scrollable milestone cards.

### Editable fields

- Main heading text (`value.heading`)
- Intro text (`value.intro`)
- Timeline cards list (`value.items[]`)
- Timeline card year (`value.items[].year`)
- Timeline card title (`value.items[].title`)
- Timeline card description (`value.items[].description`)

### Content block key

- `aboutJourneyTimeline`

### Upload slots

- None (text-only section)

### Content upsert body example

`PUT /api/v1/admin/content/aboutJourneyTimeline`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "heading": "Connecting the world one trip at a time",
    "intro": "During a trip to Thailand, Pedro and Lidia, the founders of mojoSim, faced the frustration of having no internet connection abroad. Inspired by their struggle, they came up with a simple yet brilliant idea: letting travelers buy data plans for any destination!",
    "items": [
      {
        "year": "2017",
        "title": "Where it all began",
        "description": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
      },
      {
        "year": "2018",
        "title": "Revolutionizing the industry",
        "description": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
      },
      {
        "year": "2019",
        "title": "Building a global team",
        "description": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
      }
    ]
  },
  "is_published": true
}
```

---

## Section 3: About Team Testimonials

This section is the About page testimonial block with heading, subtitle, and team member video cards.

### Editable fields

- Section title (`value.title`)
- Section subtitle (`value.subtitle`)
- Testimonial cards list (`value.items[]`)
- Card thumbnail image URL (`value.items[].thumbnailUrl`)
- Card video URL (`value.items[].videoUrl`)
- Person name (`value.items[].name`)
- Person role (`value.items[].role`)

### Content block key

- `aboutTeamTestimonials`

### Upload slots

- `testimonialOneThumbnail`
- `testimonialTwoThumbnail`
- `testimonialThreeThumbnail`
- `testimonialOneVideo`
- `testimonialTwoVideo`
- `testimonialThreeVideo`

### Upload request examples

Example 1:

- `file`: `testimonial-1-thumbnail.jpg`
- `key`: `aboutTeamTestimonials`
- `slot`: `testimonialOneThumbnail`

Example 2:

- `file`: `testimonial-1-video.mp4`
- `key`: `aboutTeamTestimonials`
- `slot`: `testimonialOneVideo`

### Content upsert body example

`PUT /api/v1/admin/content/aboutTeamTestimonials`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "title": "Hear it from our people",
    "subtitle": "Who better to tell you about mojoSim than our own team? Hear us about how we work, our culture, and what makes this place special.",
    "items": [
      {
        "thumbnailUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialOneThumbnail.jpg",
        "videoUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialOneVideo.mp4",
        "name": "Sophia Garcia",
        "role": "Content Manager"
      },
      {
        "thumbnailUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialTwoThumbnail.jpg",
        "videoUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialTwoVideo.mp4",
        "name": "Robert Wilson",
        "role": "Growth Specialist"
      },
      {
        "thumbnailUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialThreeThumbnail.jpg",
        "videoUrl": "https://cdn.example.com/content/aboutTeamTestimonials/testimonialThreeVideo.mp4",
        "name": "Emma Johnson",
        "role": "Global Marketing Manager"
      }
    ]
  },
  "is_published": true
}
```

---

## Review Page Sections

Sections below belong to the Review page.

---

## Section 1: Reviews Hero with Tabs and Review Cards

This is the first Review page section with title/subtitle, category tabs, and customer review cards.

### Editable fields

- Section title (`value.title`)
- Section subtitle (`value.subtitle`)
- Review category tabs (`value.tabs[]`)
- Active tab key (`value.activeTab`)
- Review cards list (`value.reviews[]`)
- Reviewer avatar image URL (`value.reviews[].avatarUrl`)
- Reviewer name (`value.reviews[].name`)
- Review date (`value.reviews[].date`)
- Review rating (`value.reviews[].rating`)
- Review text (`value.reviews[].text`)
- Review category (`value.reviews[].category`)

### Content block key

- `reviewHero`

### Upload slots

- `reviewerOneAvatar`
- `reviewerTwoAvatar`
- `reviewerThreeAvatar`
- `reviewerFourAvatar`
- `reviewerFiveAvatar`

### Upload request examples

Example 1:

- `file`: `reviewer-1.jpg`
- `key`: `reviewHero`
- `slot`: `reviewerOneAvatar`

Example 2:

- `file`: `reviewer-2.jpg`
- `key`: `reviewHero`
- `slot`: `reviewerTwoAvatar`

### Content upsert body example

`PUT /api/v1/admin/content/reviewHero`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "title": "Our Website Reviews",
    "subtitle": "Customer experiences with our packages and destination services",
    "tabs": [
      { "key": "packages", "label": "Packages" },
      { "key": "locations", "label": "Locations" }
    ],
    "activeTab": "packages",
    "reviews": [
      {
        "avatarUrl": "https://cdn.example.com/content/reviewHero/reviewerOneAvatar.jpg",
        "name": "James Miller",
        "date": "March 12th 2026",
        "rating": 5,
        "text": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        "category": "packages"
      },
      {
        "avatarUrl": "https://cdn.example.com/content/reviewHero/reviewerTwoAvatar.jpg",
        "name": "Sophia Garcia",
        "date": "March 12th 2026",
        "rating": 5,
        "text": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        "category": "packages"
      },
      {
        "avatarUrl": "https://cdn.example.com/content/reviewHero/reviewerThreeAvatar.jpg",
        "name": "James Miller",
        "date": "March 12th 2026",
        "rating": 5,
        "text": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        "category": "packages"
      }
    ]
  },
  "is_published": true
}
```

---

## Terms & Conditions Page Sections

Sections below belong to the Terms & Conditions page.

---

## Section 1: Terms & Conditions Full Content

This page is a single editable block managed via rich text content.

### Editable fields

- Full rich text content (`value.content`)

### Content block key

- `termsConditionsContent`

### Upload slots

- None (text-only section)

### Content upsert body example

`PUT /api/v1/admin/content/termsConditionsContent`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "content": "<h1>Terms & Conditions</h1><p>Welcome to mojoSim. By using our services, you agree to the following terms...</p>"
  },
  "is_published": true
}
```

---

## Destination Page Sections

Sections below belong to the Destination page.

---

## Section 1: Destination Why Choose Us Comparison

This section is the destination comparison table block with title, subtitle, column labels, and feature rows.

### Editable fields

- Section title (`value.title`)
- Section subtitle (`value.subtitle`)
- Table columns (`value.columns[]`)
- Feature rows (`value.rows[]`)
- Feature row label (`value.rows[].label`)
- Feature row icon (`value.rows[].icon`)
- Per-column availability (`value.rows[].values[]`)

### Content block key

- `destinationWhyChooseUs`

### Upload slots

- None (text-only section)

### Content upsert body example

`PUT /api/v1/admin/content/destinationWhyChooseUs`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "title": "Why choose us?",
    "subtitle": "Only mojoSim offers a quality premium service.",
    "columns": [
      { "key": "mojosim", "label": "mojoSim" },
      { "key": "localProvider", "label": "Local provider" },
      { "key": "limitedEsim", "label": "Limited data eSIM" }
    ],
    "rows": [
      {
        "label": "Unlimited data",
        "icon": "infinity",
        "values": [true, false, false]
      },
      {
        "label": "No hidden fees",
        "icon": "credit_card",
        "values": [true, false, false]
      },
      {
        "label": "Instant connection",
        "icon": "bolt",
        "values": [true, false, true]
      },
      {
        "label": "Fast and reliable coverage",
        "icon": "signal",
        "values": [true, true, false]
      }
    ]
  },
  "is_published": true
}
```

---

## Section 2: Destination Support CTA Banner

This section is the destination support banner with headline, support text, CTA button, and one illustration image.

### Editable fields

- Headline text (`value.title`)
- Support description (`value.description`)
- CTA label (`value.cta.label`)
- CTA URL (`value.cta.url`)
- Illustration image URL (`value.media.illustrationUrl`)

### Content block key

- `destinationSupportBanner`

### Upload slots

- `illustrationImage`

### Upload request example

- `file`: `destination-support-banner.png`
- `key`: `destinationSupportBanner`
- `slot`: `illustrationImage`

### Content upsert body example

`PUT /api/v1/admin/content/destinationSupportBanner`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "title": "Don't worry! We are here for you.",
    "description": "If you have any questions during this process, remember we're here to assist you 24/7 through our Online Chat.",
    "cta": {
      "label": "Let's Talk",
      "url": "/support"
    },
    "media": {
      "illustrationUrl": "https://cdn.example.com/content/destinationSupportBanner/illustrationImage.png"
    }
  },
  "is_published": true
}
```

---

## Global Shared Sections

Sections below are shared across multiple pages (not tied to one page only).

---

## Section 1: Global Footer

This section defines the full website footer including logo, about text, repeatable link groups, contact info, social links, and bottom legal text.

### Editable fields

- Footer logo URL (`value.logoUrl`)
- About text (`value.aboutText`)
- App store links (`value.appLinks[]`)
- Link groups (`value.linkGroups[]`)
- Link group title (`value.linkGroups[].title`)
- Group links (`value.linkGroups[].links[]`)
- Group link label (`value.linkGroups[].links[].label`)
- Group link URL (`value.linkGroups[].links[].url`)
- Contact email (`value.contact.email`)
- Contact phone (`value.contact.phone`) - optional
- Social links (`value.socialLinks[]`)
- Social item platform (`value.socialLinks[].platform`)
- Social item URL (`value.socialLinks[].url`)
- Bottom copyright text (`value.bottomBar.copyrightText`)
- Bottom legal note text (`value.bottomBar.legalNoteText`)

### Content block key

- `globalFooter`

### Upload slots

- `footerLogo`

### Upload request example

- `file`: `footer-logo.png`
- `key`: `globalFooter`
- `slot`: `footerLogo`

### Content upsert body example

`PUT /api/v1/admin/content/globalFooter`

```json
{
  "locale": "en",
  "type": "rich_text",
  "value": {
    "logoUrl": "https://cdn.example.com/content/globalFooter/footerLogo.png",
    "aboutText": "Stay connected worldwide with affordable eSIM plans from mojoSim.",
    "appLinks": [
      { "platform": "appStore", "label": "App Store", "url": "https://apps.apple.com/" },
      { "platform": "googlePlay", "label": "Google Play", "url": "https://play.google.com/" }
    ],
    "linkGroups": [
      {
        "title": "About",
        "links": [
          { "label": "About Us", "url": "/about" },
          { "label": "Plans", "url": "/plans" },
          { "label": "Reviews", "url": "/reviews" }
        ]
      },
      {
        "title": "Legal",
        "links": [
          { "label": "Terms and conditions", "url": "/terms-and-conditions" },
          { "label": "Privacy policy", "url": "/privacy-policy" },
          { "label": "Refund policy", "url": "/refund-policy" }
        ]
      },
      {
        "title": "Destinations",
        "links": [
          { "label": "eSIM Europe", "url": "/destinations/europe" },
          { "label": "eSIM USA", "url": "/destinations/usa" },
          { "label": "All destinations", "url": "/destinations" }
        ]
      },
      {
        "title": "Support",
        "links": [
          { "label": "How to install an eSIM", "url": "/esim-installation" },
          { "label": "FAQs", "url": "/faqs" },
          { "label": "Data calculator", "url": "/data-calculator" }
        ]
      }
    ],
    "contact": {
      "email": "support@mojosim.com",
      "phone": "+1-000-000-0000"
    },
    "socialLinks": [
      { "platform": "facebook", "url": "https://facebook.com/mojosim" },
      { "platform": "instagram", "url": "https://instagram.com/mojosim" },
      { "platform": "twitter", "url": "https://x.com/mojosim" },
      { "platform": "linkedin", "url": "https://linkedin.com/company/mojosim" }
    ],
    "bottomBar": {
      "copyrightText": "Copyright 2026, mojoSim, All Rights Reserved",
      "legalNoteText": "Prices and plans are subject to change. See Terms of Service for full details."
    }
  },
  "is_published": true
}
```

