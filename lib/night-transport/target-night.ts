import { addDaysToCalendarDate, getPragueDateTime, type PragueCalendarDate } from "../time/prague-time.ts";

const SECONDS_PER_DAY = 86_400;
/** Hranice "ještě probíhající noc" vs. "už dnešní den" (zadání bod 8 — "přibližně mezi 00:00 a 05:00"). */
const NIGHT_ROLLOVER_HOUR = 5;

export type TargetNightWindow = {
  /** GTFS provozní den (`service_id` kalendáře), do kterého cílová noc patří — noc z úterý na středu patří pod ÚTERÝ (viz GTFS konvence časů >24:00:00, stejně jako lib/departures/build-departures.ts). */
  serviceDate: PragueCalendarDate;
  /**
   * `now` vyjádřené jako sekund od půlnoci `serviceDate` — smí přesáhnout
   * 86400 (např. 02:00 probíhající noci = 93600 = "26:00" vzhledem k
   * včerejšímu `serviceDate`). Předej přímo do
   * `lib/departures/next-departures.ts` `getUpcomingDepartures`/
   * `getLastDeparture` beze změny — ty funkce už "dnešní/včerejší
   * provozní den" umí, tenhle posun jen zarovná "dnešek" na správnou
   * cílovou noc namísto kalendářního dneška.
   */
  nowSecondsSinceServiceMidnight: number;
  /** True = uživatel je právě UPROSTŘED té noci (00:00–04:59), false = noc teprve začne dnes večer (zadání bod 10 "během dne jasně uveď, že jde o nadcházející noc"). */
  isOngoing: boolean;
};

/**
 * Jediné, testované místo, které rozhoduje "která noc je teď cílová"
 * (zadání bod 8 — "časovou hranici neukládej na více míst"). Vždy počítá
 * v Europe/Prague, nikdy v časové zóně serveru/zařízení.
 *
 *  - 00:00–04:59 → probíhá noc, jejíž provozní den začal VČERA (Středa
 *    02:00 → serviceDate=úterý, nowSeconds=02:00+24h=26:00).
 *  - 05:00–23:59 → cílem je NADCHÁZEJÍCÍ noc, která začíná DNES večer
 *    (Středa 14:00 i 23:30 → serviceDate=středa, nowSeconds=beze změny).
 *
 * Ve druhém případě funguje beze změny i pozdě večer (23:30), protože
 * PID kóduje noční spoje pokračující po půlnoci pod STEJNÝM `service_id`
 * jako večer předtím (časy >24:00:00) — viz ověřeno na reálném feedu.
 */
export function getTargetNightWindow(now: Date): TargetNightWindow {
  const { year, month, day, hour, minute, second } = getPragueDateTime(now);
  const nowSecondsToday = hour * 3600 + minute * 60 + second;
  const today: PragueCalendarDate = { year, month, day };

  if (hour < NIGHT_ROLLOVER_HOUR) {
    return {
      serviceDate: addDaysToCalendarDate(today, -1),
      nowSecondsSinceServiceMidnight: nowSecondsToday + SECONDS_PER_DAY,
      isOngoing: true,
    };
  }

  return { serviceDate: today, nowSecondsSinceServiceMidnight: nowSecondsToday, isOngoing: false };
}
