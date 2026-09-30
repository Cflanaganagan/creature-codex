import { useId, useState } from "react";
import { useLocation } from "wouter";
import { Search, ArrowUpRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCreatures } from "@/hooks/useCreatures";

type Props = { value?: string; onChange?: (value: string) => void; onSearch?: (value: string) => void; placeholder?: string; testId?: string; className?: string };
const normalize = (text: string) => text.trim().toLocaleLowerCase();

export function CreatureSearch({ value, onChange, onSearch, placeholder = "Search extinct creatures...", testId = "input-header-search", className = "" }: Props) {
  const { creatures } = useCreatures();
  const [, navigate] = useLocation();
  const [localValue, setLocalValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const query = value ?? localValue;
  const term = normalize(query);
  const savedMatches = term ? creatures.filter(c => normalize(c.name).startsWith(term) || normalize(c.genus).startsWith(term))
    .sort((a, b) => Number(normalize(b.name).startsWith(term)) - Number(normalize(a.name).startsWith(term)) || a.name.localeCompare(b.name)).slice(0, 5) : [];
  const matches = savedMatches.map(c => ({key:c.id, id:c.id, name:c.name, detail:`${c.genus} · In the museum`}));
  const visible = open && term.length > 0;
  const choose = (index: number) => { const creature = matches[index]; if (creature) { setOpen(false); navigate(`/creature/${creature.id}`); } };

  return (
    <form className="relative w-full" role="search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }} onSubmit={e => {
      e.preventDefault();
      if (visible && active >= 0 && active < matches.length) { choose(active); return; }
      if (!term) return;
      setOpen(false);
      if (onSearch) onSearch(query.trim());
      else window.location.assign(`/browse?q=${encodeURIComponent(query.trim())}`);
    }}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input role="combobox" aria-label="Search creatures" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible && matches.length ? `${id}-list` : undefined} aria-activedescendant={visible && active >= 0 && matches[active] ? `${id}-${active}` : undefined}
        autoComplete="off" name="q" type="text" placeholder={placeholder} value={query} data-testid={testId}
        className={`pl-10 w-full rounded-full bg-muted/50 border-transparent focus:bg-background transition-colors ${className}`}
        onFocus={() => setOpen(true)} onChange={e => { setLocalValue(e.target.value); onChange?.(e.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); setOpen(false); setActive(-1); }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive(previous => matches.length ? (previous + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : -1); }
        }} />
      {visible && (
        <div className="search-suggestions absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#b49a6b]/30 bg-background shadow-[0_14px_40px_#38291624]">
          <div className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Were you thinking of…</div>
          {matches.length ? <ul id={`${id}-list`} role="listbox" aria-label="Matching creatures" className="max-h-72 overflow-auto p-1">
            {matches.map((creature, index) => <li key={creature.key} id={`${id}-${index}`} role="option" aria-selected={index === active}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${index === active ? "bg-secondary" : "hover:bg-secondary/70"}`}
              onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{creature.name}</span><span className="block truncate text-xs text-muted-foreground italic">{creature.detail}</span></span>
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            </li>)}
          </ul> : <div className="flex gap-2 px-4 pb-4 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 shrink-0 mt-0.5" /><span>No matching names yet. Press Enter to view results. You can then choose Discover for a specific extinct animal.</span></div>}
          <div className="border-t px-4 py-2 text-[10px] text-muted-foreground">{matches.length ? "↑ ↓ to explore · Enter to select · Esc to close" : "Searching never adds a card. Only the Discover button starts a lookup."}</div>
        </div>
      )}
    </form>
  );
}
