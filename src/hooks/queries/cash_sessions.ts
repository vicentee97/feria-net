/**
 * hooks/queries/cash_sessions.ts — FeriaNet
 *
 * Hooks de React Query para cajas diarias. Keys jerarquicas:
 *  - `["cash_sessions", "attraction", attractionId]`
 *      -> listado completo de cajas (abiertas + cerradas) de una atraccion.
 *  - `["cash_sessions", "open", attractionId]`
 *      -> caja abierta de una atraccion (o `null`).
 *  - `["cash_sessions", "by_date", attractionId, date]`
 *      -> caja de una atraccion en una fecha concreta (o `null`).
 *
 * Decisiones de diseno:
 *  - No exponemos `useCashSessionById(id)` directo: el backend no tiene
 *    `get_cash_session_by_id`. Para cargar una caja por id desde la UI,
 *    se conoce su `attractionId` (pasado por URL o derivable del cache)
 *    y se usa `useCashSessionsForAttraction` filtrando en cliente. Ver
 *    `CajaDetallePage` para el patron concreto.
 *
 * Patron de toasts unificado (canonico para todos los hooks del proyecto):
 *  - El hook emite SIEMPRE `onError` con `toast.error(message)` usando
 *    el mensaje canonico del backend (viene del `AppError.message`
 *    serializado).
 *  - El hook NO emite `onSuccess`: el toast verde lo emite el caller
 *    porque el wording depende del contexto (p.ej. "Caja abierta para
 *    Noria" vs "Caja cerrada con 36 EUR").
 *  - El caller NO envuelve la mutacion en `try/catch` solo para mostrar
 *    el toast de error. Si necesita reaccionar al exito (navegar,
 *    recargar queries), usa el resultado de `await mutateAsync()` sin
 *    try/catch: los errores se propagan al `onError` del hook.
 *  - Excepcion documentada: cuando `onConfirm` se pasa a
 *    `ConfirmDestructiveDialog` o a un dialog que precise control de
 *    flujo, el caller mantiene `try/catch` para `throw` y evitar que el
 *    dialog se cierre, pero NO emite `toast.error` dentro del catch
 *    (lo hace el hook).
 */

import { useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  closeCashSession,
  getCashSessionForAttractionOnDate,
  getOpenCashSession,
  listAttractionsByEdition,
  listCashSessionsForAttraction,
  listFairEditions,
  openCashSession,
} from "@/api/tauri";
import { useFairs } from "@/hooks/queries/fairs";
import { errorMessage } from "@/lib/errors";
import type {
  Attraction,
  CashSession,
  CloseCashSessionInput,
  CreateCashSessionInput,
  Fair,
  FairEdition,
} from "@/types/domain";

// Claves reutilizables para invalidaciones externas.
export const cashSessionKeys = {
  byAttraction: (attractionId: string) =>
    ["cash_sessions", "attraction", attractionId] as const,
  open: (attractionId: string) =>
    ["cash_sessions", "open", attractionId] as const,
  byDate: (attractionId: string, date: string) =>
    ["cash_sessions", "by_date", attractionId, date] as const,
};

/**
 * `useQuery` para el listado completo de cajas (abiertas + cerradas)
 * de una atraccion. Orden descendente por fecha (regla del backend).
 */
export function useCashSessionsForAttraction(attractionId: string | undefined) {
  return useQuery({
    queryKey: attractionId
      ? cashSessionKeys.byAttraction(attractionId)
      : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId
        ? listCashSessionsForAttraction(attractionId)
        : Promise.resolve([]),
    enabled: Boolean(attractionId),
    staleTime: 30 * 1000,
  });
}

/**
 * `useQuery` para la caja abierta de una atraccion. Devuelve `null`
 * si no hay ninguna abierta.
 */
export function useOpenCashSessionForAttraction(
  attractionId: string | undefined,
) {
  return useQuery({
    queryKey: attractionId
      ? cashSessionKeys.open(attractionId)
      : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId ? getOpenCashSession(attractionId) : Promise.resolve(null),
    enabled: Boolean(attractionId),
    staleTime: 10 * 1000,
  });
}

/**
 * `useQuery` para la caja de una atraccion en una fecha concreta.
 * Devuelve `null` si no existe (util para "abrir caja del dia" cuando
 * la UI detecta si ya hay una creada).
 */
export function useCashSessionForAttractionOnDate(
  attractionId: string | undefined,
  date: string | undefined,
) {
  return useQuery({
    queryKey:
      attractionId && date
        ? cashSessionKeys.byDate(attractionId, date)
        : ["cash_sessions", "_disabled"],
    queryFn: () =>
      attractionId && date
        ? getCashSessionForAttractionOnDate(attractionId, date)
        : Promise.resolve(null),
    enabled: Boolean(attractionId && date),
    staleTime: 30 * 1000,
  });
}

/**
 * `useMutation` para abrir caja. Invalida el listado de la atraccion,
 * la consulta de caja abierta y la consulta por fecha del dia.
 */
export function useOpenCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashSessionInput) => openCashSession(input),
    onSuccess: (session) => {
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byAttraction(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.open(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byDate(session.attraction_id, session.date),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

/**
 * `useMutation` para cerrar caja. Invalida el listado y la consulta
 * de caja abierta (la caja recien cerrada ya no aparece como abierta).
 */
export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CloseCashSessionInput;
    }) => closeCashSession(id, input),
    onSuccess: (session) => {
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byAttraction(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.open(session.attraction_id),
      });
      qc.invalidateQueries({
        queryKey: cashSessionKeys.byDate(session.attraction_id, session.date),
      });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });
}

// ============================================================
// Fan-out cross-attraction (listado global de cajas)
// ============================================================

/**
 * Resultado de `useAllCashSessionsWithContext`.
 *
 * `sessions` viene con un campo extra `_attractionId` (TS only, no se
 * serializa) que permite al caller resolver la atraccion contra
 * `attractionById` sin necesidad de joins adicionales.
 */
export interface CashSessionWithContext {
  sessions: Array<CashSession & { _attractionId: string }>;
  attractionById: Record<string, Attraction>;
  editionByAttractionId: Record<string, FairEdition>;
  fairByEditionId: Record<string, Fair>;
  isPending: boolean;
  isError: boolean;
  /** Primer error encontrado (fairs -> editions -> attractions -> sessions). */
  error: unknown;
}

/**
 * Hook que carga **todas** las cajas de **todas** las atracciones via
 * fan-out de queries (`useQueries`). Pensado para el listado global
 * `/cajas` y para resolver una caja por id en `CajaDetallePage`.
 *
 * Decisiones:
 *  - Fan-out a 4 niveles: fairs -> editions -> attractions -> cash_sessions.
 *    El backend no expone una sola query "listar todas las cajas", asi
 *    que iteramos. React Query deduplica y cachea cada nivel, asi que
 *    paginas que ya pidieron atracciones de una edicion no vuelven a
 *    pedirlas.
 *  - No hay `attractionId` en `CashSession` que apunte a la edicion o
 *    la feria; el caller debe cruzar contra `attractionById` y
 *    `editionByAttractionId`. Esta desnormalizacion vivira en la UI;
 *    el backend ya denormaliza otros campos en `ticket` (data-model §2.8).
 *  - Carga lazy por nivel: hasta que las fairs no llegan, no se
 *    lanzan las queries de ediciones (controlado por `enabled`).
 *  - En `CajaDetallePage` se usa combinado con un lookup por id: la
 *    pagina busca la sesion en `sessions` y si no esta (sesion
 *    recien creada, todavia no propagada al cache del listado), hace
 *    `refetch()` de las queries o navega al listado.
 */
export function useAllCashSessionsWithContext(): CashSessionWithContext {
  // Nivel 1: fairs.
  const fairsQuery = useFairs();
  const fairIds = useMemo<string[]>(
    () => (fairsQuery.data ?? []).map((f: Fair) => f.id),
    [fairsQuery.data],
  );

  // Nivel 2: editions por feria.
  const editionsQueries = useQueries({
    queries: fairIds.map((id: string) => ({
      queryKey: ["editions", id] as const,
      queryFn: () => listFairEditions(id),
      enabled: fairsQuery.isSuccess && fairIds.length > 0,
      staleTime: 30 * 1000,
    })),
  });

  // Aggregate editions.
  const editions = useMemo<FairEdition[]>(
    () => editionsQueries.flatMap((q) => q.data ?? []),
    [editionsQueries],
  );
  const editionIds = useMemo<string[]>(
    () => editions.map((e: FairEdition) => e.id),
    [editions],
  );

  // Nivel 3: attractions por edicion.
  const attractionsQueries = useQueries({
    queries: editionIds.map((id: string) => ({
      queryKey: ["attractions", id] as const,
      queryFn: () => listAttractionsByEdition(id),
      enabled: editionsQueries.every((q) => q.isSuccess) && editionIds.length > 0,
      staleTime: 30 * 1000,
    })),
  });

  const attractions = useMemo<Attraction[]>(
    () => attractionsQueries.flatMap((q) => q.data ?? []),
    [attractionsQueries],
  );
  const attractionIds = useMemo<string[]>(
    () => attractions.map((a: Attraction) => a.id),
    [attractions],
  );

  // Nivel 4: cash sessions por atraccion.
  const sessionsQueries = useQueries({
    queries: attractionIds.map((id: string) => ({
      queryKey: cashSessionKeys.byAttraction(id),
      queryFn: () => listCashSessionsForAttraction(id),
      enabled:
        attractionsQueries.every((q) => q.isSuccess) &&
        attractionIds.length > 0,
      staleTime: 10 * 1000,
    })),
  });

  // Mapas de resolucion.
  const attractionById = useMemo<Record<string, Attraction>>(
    () => Object.fromEntries(attractions.map((a) => [a.id, a])),
    [attractions],
  );
  const editionByAttractionId = useMemo<Record<string, FairEdition>>(
    () =>
      Object.fromEntries(
        attractions
          .map((a) => {
            const ed = editions.find((e) => e.id === a.fair_edition_id);
            return ed ? ([a.id, ed] as const) : null;
          })
          .filter((x): x is readonly [string, FairEdition] => x !== null),
      ),
    [attractions, editions],
  );
  const fairByEditionId = useMemo<Record<string, Fair>>(
    () =>
      Object.fromEntries(
        editions
          .map((e) => {
            const f = fairsQuery.data?.find((fr: Fair) => fr.id === e.fair_id);
            return f ? ([e.id, f] as const) : null;
          })
          .filter((x): x is readonly [string, Fair] => x !== null),
      ),
    [editions, fairsQuery.data],
  );

  // Flat de sesiones con su `attraction_id` inyectado.
  const sessions = useMemo<Array<CashSession & { _attractionId: string }>>(
    () =>
      attractionIds.flatMap((attrId, idx) =>
        (sessionsQueries[idx]?.data ?? []).map((s) => ({
          ...s,
          _attractionId: attrId,
        })),
      ),
    [attractionIds, sessionsQueries],
  );

  // Estado agregado.
  const isPending =
    fairsQuery.isPending ||
    editionsQueries.some((q) => q.isPending) ||
    attractionsQueries.some((q) => q.isPending) ||
    sessionsQueries.some((q) => q.isPending);
  const isError =
    fairsQuery.isError ||
    editionsQueries.some((q) => q.isError) ||
    attractionsQueries.some((q) => q.isError) ||
    sessionsQueries.some((q) => q.isError);
  const error: unknown =
    fairsQuery.error ??
    editionsQueries.find((q) => q.error)?.error ??
    attractionsQueries.find((q) => q.error)?.error ??
    sessionsQueries.find((q) => q.error)?.error ??
    null;

  return {
    sessions,
    attractionById,
    editionByAttractionId,
    fairByEditionId,
    isPending,
    isError,
    error,
  };
}

/**
 * Helper para resolver una caja concreta por id desde el cache del
 * listado global. Pensado para `CajaDetallePage` y `TpvPage`, que
 * reciben el id por URL.
 *
 * Devuelve `{ session, attraction, edition, fair }` si la encuentra,
 * o `null` si la fan-out todavia no la cargo (caso normal: usuario
 * acaba de abrir caja y navega antes de que el cache se actualice).
 *
 * Si la sesion no aparece tras unos ms (sesion muy reciente sin
 * propagar), el caller puede llamar a `refetch()` del listado o
 * navegar al listado para forzar recarga.
 */
export function useCashSessionById(id: string | undefined): {
  session: CashSession | null;
  attraction: Attraction | null;
  edition: FairEdition | null;
  fair: Fair | null;
  isPending: boolean;
  isError: boolean;
  error: unknown;
} {
  const ctx = useAllCashSessionsWithContext();
  const found = useMemo(() => {
    if (!id) return null;
    return ctx.sessions.find((s) => s.id === id) ?? null;
  }, [id, ctx.sessions]);

  if (!id) {
    return {
      session: null,
      attraction: null,
      edition: null,
      fair: null,
      isPending: false,
      isError: false,
      error: null,
    };
  }
  if (!found) {
    return {
      session: null,
      attraction: null,
      edition: null,
      fair: null,
      isPending: ctx.isPending,
      isError: ctx.isError,
      error: ctx.error,
    };
  }
  const attraction = ctx.attractionById[found._attractionId] ?? null;
  const edition = attraction ? ctx.editionByAttractionId[attraction.id] ?? null : null;
  const fair = edition ? ctx.fairByEditionId[edition.id] ?? null : null;
  return {
    session: found,
    attraction,
    edition,
    fair,
    isPending: ctx.isPending,
    isError: ctx.isError,
    error: ctx.error,
  };
}
