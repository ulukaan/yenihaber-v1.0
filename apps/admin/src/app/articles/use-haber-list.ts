"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ApiArticle,
  ApiCategory,
  HaberBulkAction,
  HaberStatusCounts,
  Role,
} from "@yenihaber/shared";
import {
  HaberFiltreSchema,
  canPublish,
  defaultHaberDurumForRole,
} from "@yenihaber/shared";
import { useAuth } from "@/components/auth-provider/auth-provider";
import { adminApi } from "@/lib/api";
import {
  EMPTY_COUNTS,
  type InlineEdit,
  type UndoState,
} from "./haber-list-utils";

export function useHaberList(searchRef: MutableRefObject<HTMLInputElement | null>) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleDefaultApplied = useRef(false);

  const role: Role = user?.role ?? "UYE";
  const isReporter = role === "MUHABIR" || role === "YAZAR";
  const publisher = canPublish(role);

  const parsed = useMemo(() => {
    return HaberFiltreSchema.parse({
      durum: searchParams.get("durum") ?? undefined,
      kategori: searchParams.get("kategori") ?? undefined,
      yazar: searchParams.get("yazar") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      imlec: searchParams.get("imlec") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
    });
  }, [searchParams]);

  const [items, setItems] = useState<ApiArticle[]>([]);
  const [counts, setCounts] = useState<HaberStatusCounts>(EMPTY_COUNTS);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qDraft, setQDraft] = useState(parsed.q ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusIdx, setFocusIdx] = useState(0);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [editing, setEditing] = useState<InlineEdit | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemIdsRef = useRef<string[]>([]);
  itemIdsRef.current = items.map((i) => i.id);

  useEffect(() => {
    if (authLoading || !user || roleDefaultApplied.current) return;
    if (searchParams.has("durum")) {
      roleDefaultApplied.current = true;
      return;
    }
    roleDefaultApplied.current = true;
    const durum = defaultHaberDurumForRole(user.role);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("durum", durum);
    router.replace(`/articles?${sp.toString()}`);
  }, [authLoading, user, searchParams, router]);

  useEffect(() => {
    setQDraft(parsed.q ?? "");
  }, [parsed.q]);

  const pushFilter = useCallback(
    (patch: Record<string, string | number | undefined | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") sp.delete(k);
        else sp.set(k, String(v));
      });
      if (!("page" in patch)) sp.delete("page");
      router.replace(`/articles?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.articles.panelList({
        durum: parsed.durum,
        kategori: parsed.kategori,
        yazar: parsed.yazar,
        q: parsed.q,
        page: parsed.page,
        limit: parsed.limit,
        mine: isReporter ? true : parsed.mine,
      });
      setItems(res.data ?? []);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      setCounts(res.meta.counts ?? EMPTY_COUNTS);
      setSelected(new Set());
      setFocusIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Haberler yüklenemedi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [parsed, isReporter]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [load, authLoading]);

  useEffect(() => {
    void adminApi.categories
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const tick = async () => {
      try {
        const snap = await adminApi.articles.panelSnapshot(itemIdsRef.current);
        setCounts(snap.counts);
        if (!snap.rows.length) return;
        const map = new Map(snap.rows.map((r) => [r.id, r]));
        setItems((prev) =>
          prev.map((row) => {
            const u = map.get(row.id);
            if (!u) return row;
            if (
              row.status === u.status &&
              row.viewCount === u.viewCount &&
              row.isFeatured === u.isFeatured
            ) {
              return row;
            }
            return {
              ...row,
              status: u.status,
              viewCount: u.viewCount,
              isFeatured: u.isFeatured,
            };
          }),
        );
      } catch {
        /* sessiz */
      }
    };
    const id = setInterval(() => void tick(), 60_000);
    return () => clearInterval(id);
  }, [authLoading]);

  const showUndo = useCallback((state: UndoState) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(state);
    undoTimer.current = setTimeout(() => setUndo(null), 10_000);
  }, []);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const runBulk = useCallback(
    async (action: Exclude<HaberBulkAction, { action: "geri_al" }>) => {
      if (!selected.size || bulkBusy) return;
      setBulkBusy(true);
      try {
        const res = await adminApi.articles.panelBulk(action);
        const n = res.data.length;
        const labels: Record<string, string> = {
          onayla: "onaya alındı",
          yayinla: "yayınlandı",
          arsivle: "arşivlendi",
          taslak: "taslağa alındı",
          kategori: "kategori değişti",
        };
        if (res.previous?.length) {
          showUndo({
            message: `${n} haber ${labels[action.action] ?? "güncellendi"}`,
            items: res.previous,
          });
        }
        setSelected(new Set());
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Toplu işlem başarısız");
      } finally {
        setBulkBusy(false);
      }
    },
    [selected, bulkBusy, showUndo, load],
  );

  const undoLast = useCallback(async () => {
    if (!undo?.items.length) return;
    setBulkBusy(true);
    try {
      await adminApi.articles.panelBulk({ action: "geri_al", items: undo.items });
      setUndo(null);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geri alma başarısız");
    } finally {
      setBulkBusy(false);
    }
  }, [undo, load]);

  const patchInline = useCallback(
    async (id: string, body: Parameters<typeof adminApi.articles.panelInline>[1]) => {
      try {
        const updated = await adminApi.articles.panelInline(id, body);
        setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
        setEditing(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    },
    [],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      if (typing && e.key !== "Escape") return;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if ((e.key === "n" || e.key === "N") && !typing) {
        e.preventDefault();
        router.push("/articles/new");
        return;
      }
      if ((e.key === "j" || e.key === "k") && !typing && items.length) {
        e.preventDefault();
        setFocusIdx((i) =>
          e.key === "j"
            ? Math.min(items.length - 1, i + 1)
            : Math.max(0, i - 1),
        );
        return;
      }
      if ((e.key === "e" || e.key === "E") && !typing && items[focusIdx]) {
        e.preventDefault();
        router.push(`/articles/${items[focusIdx].id}`);
        return;
      }
      if ((e.key === " " || e.code === "Space") && !typing && items[focusIdx]) {
        e.preventDefault();
        toggleSelect(items[focusIdx].id);
      }
      if (e.key === "Escape") {
        setEditing(null);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, focusIdx, router, toggleSelect, searchRef]);

  const hardDelete = useCallback(
    async (id: string) => {
      if (role !== "ADMIN") return;
      const row = items.find((a) => a.id === id);
      const isArsiv = row?.status === "ARSIV";
      const msg = isArsiv
        ? `"${row?.title ?? "Haber"}" kalıcı silinecek. Bu işlem geri alınamaz.`
        : `"${row?.title ?? "Haber"}" arşive alınmadan kalıcı silinecek. Siteden ve panelden tamamen kalkar. Devam?`;
      if (!window.confirm(msg)) return;
      if (
        !isArsiv &&
        !window.confirm("Son onay: kalıcı silme geri alınamaz. Emin misiniz?")
      ) {
        return;
      }
      try {
        await adminApi.articles.remove(id, { force: !isArsiv });
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Silinemedi");
      }
    },
    [role, load, items],
  );

  const rangeStart = total === 0 ? 0 : (parsed.page - 1) * parsed.limit + 1;
  const rangeEnd = Math.min(parsed.page * parsed.limit, total);

  return {
    role,
    isReporter,
    publisher,
    parsed,
    items,
    counts,
    total,
    totalPages,
    categories,
    loading,
    error,
    qDraft,
    setQDraft,
    selected,
    setSelected,
    focusIdx,
    setFocusIdx,
    bulkBusy,
    undo,
    editing,
    setEditing,
    pushFilter,
    load,
    runBulk,
    undoLast,
    patchInline,
    toggleSelect,
    hardDelete,
    selectedIds,
    rangeStart,
    rangeEnd,
    setError,
  };
}
