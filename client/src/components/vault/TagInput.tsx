import type { KeyboardEvent, ReactElement } from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { MAX_TAGS_PER_NOTE } from "../../api/vault";

type TagInputProps = {
  readonly tags: readonly string[];
  readonly onChange: (tags: readonly string[]) => void;
  readonly suggestions?: readonly string[];
};

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps): ReactElement {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string): void => {
    const tag = raw.trim().toLowerCase();
    if (tag.length === 0 || tags.includes(tag) || tags.length >= MAX_TAGS_PER_NOTE) return;
    onChange([...tags, tag]);
    setDraft("");
  };

  const removeTag = (tag: string): void => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
      return;
    }
    if (e.key === "Backspace" && draft.length === 0 && tags.length > 0) {
      removeTag(tags[tags.length - 1] as string);
    }
  };

  const available = suggestions.filter((s) => !tags.includes(s)).slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-zinc-500 transition hover:text-red-400"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={tags.length >= MAX_TAGS_PER_NOTE ? "Limite de tags atingido" : "Tag + Enter"}
          disabled={tags.length >= MAX_TAGS_PER_NOTE}
          className="min-w-24 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-700 disabled:cursor-not-allowed"
        />
      </div>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300"
            >
              +#{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
