import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Bookmark, Twitter, Link2 } from "lucide-react";
import Link from "next/link";
import styles from "./article.module.css";
import { ArticleActions } from "./ArticleActions";
import { Comments } from "./Comments";
import { FollowButton } from "@/components/FollowButton";
import { TextToSpeech } from "@/components/article/TextToSpeech";

const ARTICLES: Record<string, {
  slug: string; tag: string; tagColor: string; title: string; subtitle: string;
  author: string; authorHandle: string; authorBio: string; authorColor: string;
  readTime: string; publishedAt: string; likes: number; content: string;
}> = {
  "future-ai-writing": {
    slug: "future-ai-writing",
    tag: "Technology", tagColor: "#348fff",
    title: "The Future of AI Writing Tools: How Machine Learning is Reshaping Creativity",
    subtitle: "Artificial intelligence is no longer just a buzzword — it's fundamentally changing how writers research, draft, and refine their work.",
    author: "Sarah Chen", authorHandle: "sarahchen",
    authorBio: "AI researcher & tech writer. Making complex ideas accessible for everyone.",
    authorColor: "#348fff",
    readTime: "5 min", publishedAt: "April 10, 2026", likes: 847,
    content: `
      <p>For most of writing history, the blank page has been the enemy. Writers stare at it, curse at it, make coffee, stare some more. The process of getting ideas from head to paper — coherently, compellingly — has always been the hardest part.</p>
      <p>Now, for the first time, we have tools that can stare back.</p>
      <h2>The Shift from Tools to Collaborators</h2>
      <p>Early writing software — word processors, grammar checkers, spell correctors — was passive. It caught your mistakes but didn't help you think. The new generation of AI writing tools is different. They suggest, expand, reframe, and challenge your ideas in real time.</p>
      <blockquote>The question is no longer whether AI will change writing. It already has. The question is how writers will adapt — and thrive.</blockquote>
      <p>Tools like AI writing assistants can now analyze your prose's tone, flag clichés, suggest stronger verbs, and propose alternate structures for arguments. They're not replacing writers — they're becoming the world's most patient editor.</p>
      <h2>What This Means for Serious Writers</h2>
      <p>The writers most threatened by AI are those doing commodity work — generic content, SEO filler, templated copy. The writers least threatened are those bringing genuine insight, lived experience, and distinctive voice.</p>
      <p>Which is, of course, exactly the kind of writing that has always mattered.</p>
      <p>The opportunity for serious writers isn't to resist the tools — it's to leverage them to remove friction from the parts of writing that drain energy, so more energy can go toward the parts that require a human: the original thinking, the courageous argument, the authentic voice.</p>
      <h2>The Next Five Years</h2>
      <p>Over the next five years, we'll see AI writing tools become deeply integrated into every serious writer's workflow. Not as a replacement, but as infrastructure — as invisible and essential as spell-check or search.</p>
      <p>The writers who build fluency with these tools now will have a significant advantage. Not because the tools will write for them, but because they'll spend more time doing the thinking that only humans can do.</p>
    `,
  },
  "design-systems-scale": {
    slug: "design-systems-scale",
    tag: "Design", tagColor: "#a78bfa",
    title: "Design Systems at Scale: Lessons from Building for 10M Users",
    subtitle: "After three years of iterating on our design system, here's what we learned about consistency, communication, and the hidden costs of technical debt.",
    author: "Marcus Reid", authorHandle: "marcusreid",
    authorBio: "Design systems lead at a Fortune 500. Writing about craft, scale, and the beauty of constraints.",
    authorColor: "#a78bfa",
    readTime: "8 min", publishedAt: "April 9, 2026", likes: 612,
    content: `<p>Three years ago, we had seventeen different button styles across our product. Not seventeen shades of a button — seventeen genuinely different button components, built by different teams, serving slightly different needs, and maintained by no one.</p><p>Today, we have one. Here's how we got there, and what it cost us.</p><h2>Why Design Systems Fail</h2><p>Most design system efforts fail not because of bad design or bad engineering — they fail because of bad governance. Someone builds a beautiful component library, ships it, and then assumes adoption will be organic. It never is.</p><blockquote>A design system without adoption is just a well-documented graveyard of unused components.</blockquote><p>The teams that succeeded treated their design system like a product: with a roadmap, a feedback loop, and most importantly, dedicated people whose job was to make the system better.</p>`,
  },
};

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: "Article Not Found" };
  return { title: article.title, description: article.subtitle };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <Link href={`/topics/${article.tag.toLowerCase()}`} className={styles.tag}
            style={{ color: article.tagColor, background: article.tagColor + "15", borderColor: article.tagColor + "30" }}>
            {article.tag}
          </Link>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.subtitle}>{article.subtitle}</p>

          <div className={styles.authorBar}>
            <Link href={`/profile/${article.authorHandle}`} className={styles.authorLink}>
              <div className="avatar avatar-md" style={{ background: article.authorColor }}>
                {article.author[0]}
              </div>
              <div>
                <p className={styles.authorName}>{article.author}</p>
                <p className={styles.authorMeta}>
                  {article.publishedAt} · <Clock size={12} style={{ display: "inline" }} /> {article.readTime} read
                </p>
              </div>
            </Link>
            <div className={styles.headerActions}>
              <FollowButton handle={article.authorHandle} size="sm" />
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Share on Twitter"><Twitter size={14} /></Link>
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Copy link"><Link2 size={14} /></Link>
              <Link href="#" className="btn btn-ghost btn-sm" aria-label="Bookmark"><Bookmark size={14} /></Link>
            </div>
          </div>
        </header>

        {/* Text-to-Speech bar */}
        <div style={{ margin: "0 0 1rem" }}>
          <TextToSpeech content={article.content} />
        </div>

        {/* Hero image */}
        <div className={styles.heroImage}
          style={{ background: `linear-gradient(135deg, ${article.tagColor}18, ${article.tagColor}06)` }}>
          <div className={styles.heroImageAccent} style={{ background: article.tagColor }} />
        </div>

        {/* Body */}
        <div className={styles.bodyGrid}>
          {/* Client-side interactive actions */}
          <ArticleActions likes={article.likes} commentsCount={24} />
          {/* Article prose */}
          <article className="prose" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        {/* Author bio */}
        <div className={styles.authorCard}>
          <div className="avatar avatar-xl" style={{ background: article.authorColor }}>
            {article.author[0]}
          </div>
          <div className={styles.authorCardInfo}>
            <p className={styles.authorCardLabel}>Written by</p>
            <Link href={`/profile/${article.authorHandle}`} className={styles.authorCardName}>
              {article.author}
            </Link>
            <p className={styles.authorCardBio}>{article.authorBio}</p>
            <FollowButton handle={article.authorHandle} size="sm" />
          </div>
        </div>

        {/* Comments — fully interactive client component */}
        <Comments articleId={article.slug} />
      </div>
    </div>
  );
}
