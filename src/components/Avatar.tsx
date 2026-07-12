import personPlaceholder from "@/assets/images/placeholders/person.jpg";
import vehiclePlaceholder from "@/assets/images/placeholders/vehicle.jpg";

// Always a real image — every avatar/photo field in this dataset is a
// Vite-resolved import now, not a Unicode emoji standing in for one, so
// there's no second "render as text" branch to keep in sync with the first.
// `value` is optional purely so a record that hasn't been given a photo yet
// still renders something sensible (the matching placeholder) instead of a
// broken image.
export function Avatar({
  value,
  kind = "person",
  className,
}: {
  value?: string;
  kind?: "person" | "vehicle";
  className?: string;
}) {
  const src = value || (kind === "vehicle" ? vehiclePlaceholder : personPlaceholder);
  return <img src={src} alt="" className={className} />;
}
