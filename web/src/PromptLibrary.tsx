/**
 * Prompt Library — 30+ curated prompts organized by category
 */
import { useState, useMemo } from "react";

export interface PromptItem {
  title: string;
  prompt: string;
  category: string;
  tags: string[];
}

const PROMPTS: PromptItem[] = [
  // Portraits (5)
  { title: "Cinematic Portrait", prompt: "Cinematic portrait of a person with dramatic rim lighting, shallow depth of field, film grain, moody atmosphere, shot on 85mm lens, 4K, photorealistic", category: "Portraits", tags: ["portrait", "cinematic", "dramatic"] },
  { title: "Fashion Editorial", prompt: "High fashion editorial portrait, model in avant-garde clothing, studio lighting with colored gels, Vogue magazine style, sharp focus, elegant pose", category: "Portraits", tags: ["fashion", "editorial", "studio"] },
  { title: "Professional Headshot", prompt: "Professional corporate headshot, neutral background, soft natural lighting, confident expression, sharp eyes, business attire, clean and polished", category: "Portraits", tags: ["headshot", "professional", "corporate"] },
  { title: "Fantasy Character", prompt: "Epic fantasy character portrait, intricate armor with glowing runes, magical aura, detailed face paint, dramatic volumetric lighting, concept art style", category: "Portraits", tags: ["fantasy", "character", "concept art"] },
  { title: "Anime Character", prompt: "Beautiful anime character portrait, large expressive eyes, colorful hair, dynamic pose, cel shading, vibrant colors, Studio Ghibli inspired, detailed illustration", category: "Portraits", tags: ["anime", "illustration", "character"] },

  // Landscapes (5)
  { title: "Epic Vista", prompt: "Breathtaking epic landscape vista, towering mountains at golden hour, dramatic clouds, crystal clear lake reflection, cinematic composition, 8K ultra detailed, National Geographic quality", category: "Landscapes", tags: ["landscape", "mountains", "epic"] },
  { title: "Underwater World", prompt: "Stunning underwater seascape, vibrant coral reef, schools of tropical fish, sunlight rays penetrating deep blue water, bioluminescent creatures, crystal clear visibility", category: "Landscapes", tags: ["underwater", "ocean", "nature"] },
  { title: "Space Scene", prompt: "Awe-inspiring deep space scene, colorful nebula with swirling gas clouds, distant galaxies, bright stars, planet in foreground, NASA-quality render, cosmic scale", category: "Landscapes", tags: ["space", "nebula", "cosmic"] },
  { title: "Cyberpunk City", prompt: "Futuristic cyberpunk cityscape at night, neon signs in Japanese and English, rain-slicked streets, flying vehicles, holographic advertisements, Blade Runner atmosphere, dense urban environment", category: "Landscapes", tags: ["cyberpunk", "city", "neon"] },
  { title: "Nature Macro", prompt: "Extreme macro photography of a dewdrop on a flower petal, perfect bokeh, morning golden light, intricate natural textures, razor sharp focus, nature's tiny world revealed", category: "Landscapes", tags: ["macro", "nature", "closeup"] },

  // Products (5)
  { title: "Floating Product", prompt: "Luxury product floating in mid-air with dynamic lighting, clean white background, subtle shadow beneath, studio photography, commercial grade, minimalist composition", category: "Products", tags: ["product", "floating", "commercial"] },
  { title: "Lifestyle Product", prompt: "Product in a cozy lifestyle setting, warm natural lighting, rustic wooden table, plants and books in background, Instagram-worthy aesthetic, soft earth tones", category: "Products", tags: ["product", "lifestyle", "warm"] },
  { title: "Minimal Product", prompt: "Ultra-minimal product photography, single item on pure white background, perfect symmetry, soft diffused lighting, no distractions, Apple-style clean aesthetic", category: "Products", tags: ["product", "minimal", "clean"] },
  { title: "Luxury Product", prompt: "Premium luxury product shot, dark moody background, golden accent lighting, marble surface, reflections, high-end brand aesthetic, elegant and sophisticated", category: "Products", tags: ["product", "luxury", "premium"] },
  { title: "Tech Product", prompt: "Sleek tech product hero shot, gradient background, colorful ambient lighting, floating particles, futuristic feel, sharp details, product launch quality", category: "Products", tags: ["product", "tech", "futuristic"] },

  // Abstract (5)
  { title: "Fluid Art", prompt: "Mesmerizing fluid art with swirling colors, metallic gold and deep blue, organic flowing shapes, high contrast, glossy finish, abstract expressionism, 4K wallpaper quality", category: "Abstract", tags: ["abstract", "fluid", "art"] },
  { title: "Geometric Pattern", prompt: "Complex geometric pattern, sacred geometry, impossible shapes, clean lines, gradient colors transitioning from purple to teal, mathematical beauty, vector-sharp edges", category: "Abstract", tags: ["abstract", "geometric", "pattern"] },
  { title: "Fractal Universe", prompt: "Infinite fractal pattern zooming into mathematical beauty, Mandelbrot set inspired, vibrant psychedelic colors, recursive detail at every level, digital art masterpiece", category: "Abstract", tags: ["abstract", "fractal", "mathematical"] },
  { title: "Neon Abstract", prompt: "Abstract neon light composition, glowing lines and shapes in electric blue and hot pink, dark background, long exposure light painting effect, energetic and dynamic", category: "Abstract", tags: ["abstract", "neon", "glow"] },
  { title: "Organic Texture", prompt: "Extreme close-up of organic texture, alien biological surface, iridescent colors, wet and glossy, microscopic detail, otherworldly patterns, biomechanical aesthetic", category: "Abstract", tags: ["abstract", "texture", "organic"] },

  // Video (5)
  { title: "Drone Shot", prompt: "Cinematic aerial drone shot slowly revealing a vast landscape, sweeping camera movement from ground level to bird's eye view, golden hour lighting, 4K smooth footage", category: "Video", tags: ["video", "drone", "aerial"] },
  { title: "Slow Motion", prompt: "Ultra slow motion capture of water splash with colorful liquid, 1000fps effect, every droplet visible, dramatic lighting against dark background, mesmerizing fluid dynamics", category: "Video", tags: ["video", "slowmo", "water"] },
  { title: "Timelapse", prompt: "Stunning timelapse of clouds rolling over mountain peaks, day to night transition, stars appearing, smooth motion, hyperlapse effect, epic sense of time passing", category: "Video", tags: ["video", "timelapse", "clouds"] },
  { title: "Tracking Shot", prompt: "Smooth tracking shot following a character walking through a bustling market, shallow depth of field, ambient sounds implied, cinematic color grading, Steadicam feel", category: "Video", tags: ["video", "tracking", "cinematic"] },
  { title: "Dramatic Reveal", prompt: "Dramatic camera reveal, starting on a close-up detail then pulling back to show the full epic scene, orchestral music moment, lens flare, cinematic aspect ratio", category: "Video", tags: ["video", "reveal", "dramatic"] },

  // Styles (5+)
  { title: "Oil Painting", prompt: "Classical oil painting style, rich impasto brushstrokes visible, warm Rembrandt lighting, museum-quality fine art, traditional canvas texture, masterful composition", category: "Styles", tags: ["style", "oil painting", "classical"] },
  { title: "Watercolor", prompt: "Delicate watercolor painting, soft washes of color bleeding into wet paper, loose expressive brushwork, white paper showing through, dreamy and ethereal atmosphere", category: "Styles", tags: ["style", "watercolor", "soft"] },
  { title: "3D Render", prompt: "High-quality 3D render, smooth glossy materials, physically based rendering, studio HDRI lighting, subsurface scattering, Octane/Blender quality, clean topology", category: "Styles", tags: ["style", "3d", "render"] },
  { title: "Pixel Art", prompt: "Detailed pixel art scene, 16-bit retro game aesthetic, limited color palette, clean pixel placement, nostalgic SNES era feel, dithering for shading, charming and colorful", category: "Styles", tags: ["style", "pixel art", "retro"] },
  { title: "Comic Book", prompt: "Bold comic book illustration, thick ink outlines, Ben-Day dots halftone pattern, dynamic action pose, speech bubble ready, vivid primary colors, Marvel/DC style", category: "Styles", tags: ["style", "comic", "illustration"] },
  { title: "Pencil Sketch", prompt: "Detailed pencil sketch, graphite on textured paper, crosshatching for shadows, fine line work, architectural precision, classical drawing technique", category: "Styles", tags: ["style", "sketch", "pencil"] },
];

const CATEGORIES = ["All", "Portraits", "Landscapes", "Products", "Abstract", "Video", "Styles"];

const STORAGE_KEY = "openflow_prompt_favorites";

function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function toggleFavorite(title: string) {
  const favs = getFavorites();
  const idx = favs.indexOf(title);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(title);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  return favs;
}

export function PromptLibraryPanel({ onUsePrompt, onCreateNode }: {
  onUsePrompt: (prompt: string) => void;
  onCreateNode?: (prompt: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = PROMPTS;
    if (showFavoritesOnly) list = list.filter(p => favorites.includes(p.title));
    if (category !== "All") list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)));
    }
    return list;
  }, [search, category, favorites, showFavoritesOnly]);

  const inputStyle = { width: "100%", background: "#f5f5f7", border: "none", borderRadius: 8, fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box" as const, color: "#1a1a1a" };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>📚 Prompt Library</div>
      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>{PROMPTS.length} curated prompts</div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..." style={{ ...inputStyle, marginBottom: 8 }} />

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: category === c ? "#c026d3" : "#f5f5f7", color: category === c ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            {c}
          </button>
        ))}
        <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: showFavoritesOnly ? "#fbbf24" : "#f5f5f7", color: showFavoritesOnly ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
          ⭐ Favorites
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: 20 }}>No prompts found</div>}
        {filtered.map((p, i) => (
          <div key={i} style={{ padding: "10px 12px", background: "#f9f9fb", borderRadius: 10, marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.background = "#f0f0f3"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#f9f9fb"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", flex: 1 }}>{p.title}</div>
              <button onClick={(e) => { e.stopPropagation(); setFavorites(toggleFavorite(p.title)); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0, color: favorites.includes(p.title) ? "#fbbf24" : "#d1d5db" }}>
                {favorites.includes(p.title) ? "★" : "☆"}
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.prompt}</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => { navigator.clipboard.writeText(p.prompt); onUsePrompt(p.prompt); }}
                style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: "#c026d3", color: "#fff", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
                📋 Copy
              </button>
              {onCreateNode && (
                <button onClick={() => onCreateNode(p.prompt)}
                  style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
                  + Node
                </button>
              )}
              <span style={{ padding: "3px 6px", background: "#e8e8eb", borderRadius: 5, fontSize: 9, color: "#6b7280" }}>{p.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
