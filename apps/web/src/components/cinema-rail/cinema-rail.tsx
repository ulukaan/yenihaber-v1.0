import { getCinema } from "@/lib/cinema";
import { CinemaRailView } from "./cinema-rail-view";

/** Anasayfa / servis — vizyondaki filmler şeridi */
export async function CinemaRail() {
  const data = await getCinema();
  if (!data.films.length) return null;
  return (
    <CinemaRailView
      films={data.films}
      moreHref="/servis/vizyon"
      moreLabel="Diğer filmler →"
    />
  );
}
