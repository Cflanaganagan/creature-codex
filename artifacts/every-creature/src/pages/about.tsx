import { Link, useLocation } from "wouter";
import { Search, BookOpen, Globe2, Dices, ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout";
import { useCreatures } from "@/hooks/useCreatures";
import codexLogo from "@/assets/creature-codex-logo.png";
import museumFossils from "@/assets/museum-fossils.png";

export default function About() {
  const { creatures, sharedCount, collectionStatus } = useCreatures();
  const [, navigate] = useLocation();
  const randomCreature = () => {
    const creature = creatures[Math.floor(Math.random() * creatures.length)];
    if (creature) navigate(`/creature/${creature.id}`);
  };
  return <Layout>
    <article className="mx-auto max-w-5xl">
      <header className="museum-hero relative overflow-hidden rounded-[2rem] border border-[#9a7a46]/20 px-6 py-12 text-center md:px-16 md:py-16">
        <div className="museum-fossil-backdrop museum-fossil-left" aria-hidden="true"><img src={museumFossils} alt="" /></div>
        <div className="museum-fossil-backdrop museum-fossil-right" aria-hidden="true"><img src={museumFossils} alt="" /></div>
        <div className="relative">
          <img src={codexLogo} alt="Woolly mammoth emblem" className="mx-auto mb-6 h-24 w-24 rounded-2xl object-cover shadow-lg ring-1 ring-[#b99b63]/30" />
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.3em] text-muted-foreground">About Woolly</p>
          <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">A vanished world.<br /><span className="text-[#82653b]">Built by curiosity.</span></h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">For everyone who has ever imagined the creatures that came before us.</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-2 py-12 md:py-16">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.25em] text-muted-foreground">Our idea</p>
        <h3 className="mb-6 font-serif text-3xl font-bold md:text-4xl">An archive as extraordinary<br className="hidden sm:block" /> as life itself.</h3>
        <div className="space-y-5 text-base leading-8 text-foreground/75 md:text-lg">
          <p>Woolly — Museum of the Extinct was created for creature lovers, fossil enthusiasts, and anyone fascinated by Earth’s lost worlds. Our ambition is to build an enormous, ever-growing archive of extinct animals—from prehistoric giants known through fossils to species that disappeared within human history.</p>
          <p>The idea is simple: your curiosity helps the collection grow. Explore a creature that is already here, or click Discover to uncover something new. Our AI naturalist, powered by an API, draws on scientific references to identify extinct creatures and bring their stories to life. Each new discovery joins the shared collection, ready for the next curious visitor.</p>
          <p>Creature lovers around the world can help build the same archive, one question and one discovery at a time.</p>
        </div>
      </section>

      <p className="mx-auto mb-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">Our name reference is adapted from the <a href="https://paleobiodb.org" target="_blank" rel="noopener noreferrer" className="underline">Paleobiology Database</a>, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>, with documented editorial corrections. Scientific classifications change, and no list covers every extinct animal. A missing name means we haven’t verified it yet. AI-written profiles may still contain errors.</p>
      <section aria-label="How the collection grows" className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Search, number: "01", title: "Follow a question", body: "Start with an extinct animal, an unfamiliar fossil, or a name you've never heard before." },
          { icon: BookOpen, number: "02", title: "Make a discovery", body: "Explore an existing entry, or click Discover to ask our AI naturalist to identify and add a specific extinct creature." },
          { icon: Globe2, number: "03", title: "Leave it for everyone", body: "New discoveries become part of the shared archive, ready for the next curious visitor." },
        ].map(({icon:Icon,number,title,body}) => <div key={number} className="rounded-2xl border border-[#a48a5c]/20 bg-[#f4ead2]/25 p-6 md:p-7">
          <div className="mb-7 flex items-center justify-between text-[#947446]"><Icon className="h-6 w-6" /><span className="font-serif text-sm opacity-60">{number}</span></div>
          <h3 className="mb-3 font-serif text-xl font-bold">{title}</h3><p className="text-sm leading-7 text-muted-foreground">{body}</p>
        </div>)}
      </section>
      <div className="my-12 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <span className="font-serif text-3xl text-foreground" data-testid="about-counter">{sharedCount.toLocaleString()}</span><span>extinct creatures catalogued. Countless discoveries ahead.</span>
      </div>
      {collectionStatus === "preview" && <p className="mb-8 text-center text-sm text-muted-foreground">The shared archive is being connected. For now, enjoy exploring the founding collection.</p>}
      <section className="mb-6 rounded-[2rem] border border-[#9a7a46]/20 bg-[#f4ead2]/30 px-6 py-10 text-center md:px-16 md:py-12">
        <p className="mb-4 font-serif text-2xl italic text-[#82653b] md:text-3xl">Your curiosity helps grow the database.</p>
        <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground">We hope you enjoy scrolling through the extraordinary extinct creatures that once called this planet home. Not sure where to begin? Try the Random Creature generator—you might meet your next favourite.</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
          <button type="button" onClick={randomCreature} data-testid="button-about-random" className="random-creature-button inline-flex items-center rounded-full border px-6 py-3 font-semibold"><Dices className="mr-2 h-5 w-5" /> Random Creature</button>
          <Link href="/browse" className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">Explore the collection <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </article>
  </Layout>;
}
