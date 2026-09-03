// Hodnoty odpovídají 1:1 UCA `App\Enums\PromotionPlacement` (Filament
// admin dropdown, viz universal-content-api repo) — nevymýšlej tu novou
// hodnotu, kterou by admin neměl kde vybrat. Dvě zónové hodnoty přidané
// speciálně pro KdeJeMetro (bez obrázku — appka dosud ukazovala jen
// ikonu + text, žádný banner), odpovídají přesně dosavadním dvěma
// místům, kde se reklama v appce zobrazuje.
export type PromotionPlacement = "finder_results" | "night_finder_results";
