import type { HomeDict } from './home.uz';

/** English dictionary for the marketing landing page. */
const dict: HomeDict = {
  header: {
    nav: {
      home: "Home",
      features: "Features",
      forBusiness: "For business",
      forCustomers: "For customers",
      pricing: "Pricing",
      partners: "Partners",
      about: "About us",
    },
    a11yEye: "Accessibility version",
    businessTab: "For business",
    customersTab: "For customers",
    connectBusiness: "Connect your business",
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },
  hero: {
    card1: {
      titleLine1: "Online booking",
      titleLine2Accent: "for your business",
      body: "A convenient online booking system for your business. Customers pick a free slot themselves, while you keep the whole process under control.",
      cta: "Get started",
      imageAlt: "Modern salon interior",
    },
    card2: {
      titleLine1Accent: "A booking page",
      titleLine2: "for your customers",
      body1: "Customers find you online and see your services and prices. Ratings, reviews, location, and working hours are all out in the open too.",
      body2: "In just a few seconds they pick a time that suits them and book with ease.",
      imageAlt: "Customer app preview",
    },
    card3: {
      titleLine1Accent: "A smart online",
      titleLine2: "schedule and calendar",
      body1: "Every appointment in one system: staff, rooms, and tables are always under control.",
      body2: "Customers see available slots online and choose the time that works for them.",
      cta: "Learn more",
    },
    card4: {
      titleLine1: "Client database",
      titleLine2Accent: "and reminders",
      body1: "Client history, past visits, and notes — everything stored in one place.",
      body2: "SMS notifications go out automatically. Nothing slips through the cracks.",
      cta: "Learn more",
    },
  },
  solutions: {
    eyebrow: "Who it's for",
    title: "Built for any business",
    more: "Learn more",
    items: [
      {
        title: "Barbershops",
        description:
          "Schedules per barber, service prices, and online booking — all in one panel.",
      },
      {
        title: "Beauty salons",
        description:
          "Easy booking for nails, hair, brows, and more, plus staff management.",
      },
      {
        title: "Billiards & bowling clubs",
        description:
          "A live schedule for tables and lanes, hourly rates, and payments.",
      },
      {
        title: "Tennis & sports courts",
        description:
          "Hourly booking for courts and fields, memberships, and group sessions.",
      },
      {
        title: "Dental & medical clinics",
        description:
          "Doctor appointments, treatment stages, and reminders — all under control.",
      },
      {
        title: "Massage & SPA salons",
        description:
          "Room and therapist schedules, packages, and loyalty programs in one place.",
      },
    ],
  },
  sticky: {
    eyebrow: "Features",
    title: "One platform — full control",
    subtitle:
      "From booking to analytics — every part of running your business in one place.",
    freeSitePrefix: "A free personal website:",
    features: [
      {
        title: "Smart schedule and calendar",
        intro: "Staff, rooms, and tables — all in one panel.",
        bullets: [
          "Time conflicts are prevented automatically",
          "A live, real-time schedule",
          "Multiple staff members and service types supported",
        ],
      },
      {
        title: "Online booking 24/7",
        intro: "Customers book even while you sleep.",
        bullets: [
          "Direct booking from Instagram and Telegram",
          "No app installation required",
          "Confirmations and SMS reminders sent automatically",
        ],
      },
      {
        title: "Client database and reminders",
        intro: "No client gets lost, no visit gets forgotten.",
        bullets: [
          "Visit history and personal notes",
          "SMS and push notifications",
          "Loyalty programs and bonus points",
          "Birthday and promotion reminders",
        ],
      },
      {
        title: "Connects with the tools you love",
        intro: "Bookup plugs easily into the platforms you already use.",
        bullets: [
          "Bookings and messages via a Telegram bot",
          "Direct connection from your Instagram profile",
          "A website widget — one line of code",
        ],
      },
    ],
  },
  supportCta: {
    marqueeAccent: "Free",
    marqueeRest: "help and support",
    card1: {
      titlePre: "Still keeping bookings",
      titleAccent: "in a notebook or in",
      titlePost: "your head?",
      p1Pre: "If your answer is",
      p1Quote: '"let me check the notebook"',
      p1Mid: "— then your business is",
      p1Risk: "at risk",
      p1Post:
        ". A lost notebook, an erased entry, or a misremembered time can wipe out a full day's revenue.",
      p2Pre: "With online booking, every client and every open slot is on one screen. We set everything up and train your team —",
      p2Free: "FOR FREE",
      cta: "Talk to a manager",
    },
    card2: {
      titlePre: "Think switching",
      titleAccent: "from another system",
      titlePost: "is hard?",
      p1Pre: "Most people fear moving to a new platform:",
      p1Quote1: '"the data will get lost"',
      p1Quote2: '"work will grind to a halt"',
      p1Post:
        "— the usual worries. Not with Bookup — we migrate your existing clients, booking history, and schedule ourselves.",
      p2Pre: "You do nothing, and your business",
      p2Bold: "doesn't stop for a single day",
      cta: "Talk to a manager",
    },
  },
  integrations: {
    eyebrow: "Integrations",
    titleMain: "Connects with the tools",
    titleAccent: "you already love",
    subtitle:
      "Bookup plugs easily into the platforms you already use — no need to start anything from scratch.",
    more: "Learn more",
    slideLabel: "Slide",
    items: [
      {
        name: "Telegram",
        title: "Booking and chat in Telegram",
        description:
          "Customers complete their booking without leaving Telegram — they pick a service and time in the Mini App, while the bot sends confirmations and reminders automatically.",
        bullets: [
          "Full booking inside the Mini App",
          "Bot reminders and confirmations",
          "Operator chat in Telegram",
        ],
      },
      {
        name: "Instagram",
        title: "Straight from your Instagram profile",
        description:
          "Turn your DMs and profile bio into a booking channel. AI chats with customers, suggests times, and closes the booking — while you see everything in one place.",
        bullets: [
          "AI auto-replies in DMs",
          "A “Book now” button in your profile",
          "Conversation history is saved",
        ],
      },
      {
        name: "Website",
        title: "Your business on a bookup.uz subdomain",
        description:
          "A beautiful, fast, SEO-ready website for your customers. Create an account, add your services — and the site builds itself. The sizning-biznes.bookup.uz address is free.",
        bullets: [
          "sizning-biznes.bookup.uz for free",
          "Looks great on mobile and desktop",
          "Ready to be found on Google",
        ],
      },
      {
        name: "SMS",
        title: "SMS confirmations and reminders",
        description:
          "Via the Beeline, Ucell, Mobiuz, and Humans operators — every customer gets the message. Secure OTP sign-in, booking confirmations, and a reminder 1 hour before the visit.",
        bullets: [
          "All Uzbekistan mobile operators",
          "Secure sign-in with OTP",
          "Auto-confirmations and reminders",
        ],
      },
    ],
  },
  pro: {
    badge: "Mobile app",
    titleLine1: "Run your business",
    titleAccent: "from your pocket",
    titlePost: "anywhere",
    body: "Bookup Business is a mobile app for business owners. Accept bookings, work with clients, and track revenue in real time.",
    features: [
      "Online schedule and calendar",
      "Client database and visit history",
      "SMS and push notifications",
      "Analytics and reports",
    ],
    download: "Download",
    ios: "for iOS",
    android: "for Android",
    imageAlt: "Bookup Business mobile app",
  },
  faq: {
    eyebrow: "FAQ",
    titleLine1: "Got questions?",
    titleAccent: "We've got answers!",
    subtitle:
      "Get in touch — we'll answer all your questions quickly and clearly.",
    popular: "Most frequently asked",
    items: [
      {
        q: "What is Bookup?",
        a: "Bookup is an online booking and client management platform for businesses in Uzbekistan. It's built for barbershops, salons, dental clinics, billiards, tennis, and other service businesses.",
      },
      {
        q: "What kinds of businesses can join?",
        a: "Barbershops, beauty salons, dental clinics, SPAs, billiards, bowling, tennis, fitness — in short, any business that offers time-based services.",
      },
      {
        q: "How do online payments work?",
        a: "Online payments are coming soon — via Click, Payme, Uzum, and bank cards. The money goes directly to your account; we never act as an intermediary. Subscribe to stay informed about updates.",
      },
      {
        q: "Is there a mobile app for customers?",
        a: "No separate app is needed. Your customers book via Telegram or through your website on a bookup.uz subdomain — it works beautifully on mobile and desktop alike.",
      },
      {
        q: "What's the commission?",
        a: "Bookup takes no commission on bookings. There's only a monthly subscription — plans vary with the size of your business. A manager will walk you through detailed pricing.",
      },
      {
        q: "Can I try a demo?",
        a: "Of course. We offer a 14-day free trial — no bank card required. Our manager will help set up the system and train your team.",
      },
      {
        q: "How does support work?",
        a: "By phone (+998 88 363 40 20), Telegram, and email — we're available 24 hours a day, 7 days a week. The average response time is 5 minutes.",
      },
      {
        q: "Can I become a partner?",
        a: "Yes. We have a partner program — we pay a commission for every business you bring in. Contact a manager for detailed terms.",
      },
    ],
  },
  footer: {
    ctaTitleLine1: "Connect your business",
    ctaTitleLine2: "to Bookup today.",
    ctaStart: "Get started",
    about:
      "An online booking and client management platform for businesses in Uzbekistan.",
    columns: {
      business: {
        heading: "For business",
        links: [
          "Barbershops",
          "Salons",
          "Dental clinics",
          "Billiards",
          "Tennis",
          "Fitness",
        ],
      },
      features: {
        heading: "Features",
        links: [
          "Online schedule",
          "Client database",
          "SMS notifications",
          "Telegram bot",
          "Instagram integration",
          "Analytics and reports",
        ],
      },
      company: {
        heading: "Company",
        links: ["About us", "Partners", "Careers", "Contact"],
      },
      docs: {
        heading: "Legal",
        links: ["Terms of service", "Privacy policy", "Public offer"],
      },
    },
    rights: "All rights reserved.",
    privacy: "Privacy policy",
    terms: "Terms of service",
    offer: "Public offer",
  },
};

export default dict;
