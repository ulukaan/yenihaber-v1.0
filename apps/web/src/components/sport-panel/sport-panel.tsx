import { getSports } from "@/lib/sports";
import { SportPanelView } from "./sport-panel-view";

/** Sporda canlı skor / program / puan — sunucuda ESPN verisi çeker */
export async function SportPanel() {
  const data = await getSports();
  return <SportPanelView data={data} />;
}
