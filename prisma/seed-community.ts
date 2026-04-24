import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COMMUNITIES = [
  { slug: "tech", name: "Tech & Code", emoji: "💻", color: "#348fff", type: "public", desc: "Programming, AI, the web, and everything in between.", tags: ["javascript","ai","web-dev","devops","open-source"], rules: ["No spam or promotional posts","Be constructive in code reviews","Share knowledge freely","Credit original authors"] },
  { slug: "design", name: "Design & UX", emoji: "🎨", color: "#a78bfa", type: "public", desc: "Visual design, product thinking, and creative craft.", tags: ["figma","ui-ux","branding","typography","motion"], rules: ["Constructive feedback only","Credit your inspiration sources","No client work solicitation"] },
  { slug: "writing", name: "Writing Craft", emoji: "✍️", color: "#22c55e", type: "public", desc: "Tips, feedback, and discussions about the writing process.", tags: ["fiction","non-fiction","editing","voice","structure"], rules: ["Be kind in feedback","Specific critique is more helpful","Share your own work too","No AI-generated submissions for critique"] },
  { slug: "startups", name: "Startups", emoji: "🚀", color: "#f97316", type: "request", desc: "Building companies, fundraising, and founder stories.", tags: ["saas","fundraising","growth","product","b2b"], rules: ["No cold pitching to members","Keep fundraising discussions respectful","Verified founders get flair","Share lessons, not just wins"] },
  { slug: "science", name: "Science & Nature", emoji: "🔬", color: "#06b6d4", type: "public", desc: "Research, discoveries, and making science approachable.", tags: ["biology","physics","climate","space","research"], rules: ["Cite peer-reviewed sources","Distinguish consensus from debate","No pseudoscience"] },
  { slug: "philosophy", name: "Philosophy", emoji: "🤔", color: "#ec4899", type: "request", desc: "Big ideas, ethics, epistemology, and how to live well.", tags: ["ethics","epistemology","metaphysics","stoicism","eastern"], rules: ["Steelman opposing views","Define your terms clearly","Argue ideas, not people"] },
  { slug: "productivity", name: "Productivity", emoji: "⚡", color: "#8b5cf6", type: "public", desc: "Systems, habits, and tools for doing your best work.", tags: ["pkm","gtd","tools","habits","deep-work"], rules: ["Share systems that actually work for you","Be skeptical of productivity hacks","No affiliate spam"] },
  { slug: "health", name: "Health & Mind", emoji: "🧠", color: "#10b981", type: "public", desc: "Mental and physical wellbeing, backed by evidence.", tags: ["mental-health","fitness","nutrition","sleep","mindfulness"], rules: ["No medical advice (share resources instead)","Be trauma-aware","Cite sources for health claims"] },
  { slug: "pro-writers", name: "Pro Writers Circle", emoji: "👑", color: "#f59e0b", type: "private", desc: "Exclusive community for verified professional writers.", tags: ["publishing","agents","contracts","marketing"], rules: ["Verified pro writers only","NDAs apply for business discussions","Be generous with experience"] },
];

async function main() {
  for (const c of COMMUNITIES) {
    await prisma.community.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log("Communities seeded!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
