import { useState, KeyboardEvent } from "react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  id?: string;
}

// Componente reutilizável para entrada de tags com chips/badges.
// Aceita Enter, vírgula ou Tab pra adicionar.
export default function TagInput({
  tags,
  onChange,
  placeholder = "Adicione tags...",
  maxTags = 20,
  id,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    if (tags.length >= maxTags) return;

    onChange([...tags, cleaned]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 border border-input rounded-md bg-background min-h-[40px]">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            <span className="text-xs">#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-destructive/20 rounded p-0.5"
              aria-label={`Remover tag ${tag}`}
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        <Input
          id={id}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0 h-7 text-sm"
        />
      </div>
      {maxTags && (
        <div className="text-xs text-muted-foreground mt-1">
          {tags.length}/{maxTags} tags · Enter ou vírgula para adicionar
        </div>
      )}
    </div>
  );
}
