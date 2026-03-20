"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, Edit2, Check, X, Store, Clock, Crosshair } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

const MapPicker = dynamic(() => import("@/components/dashboard/MapPicker"), { ssr: false });

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];

interface DayHours {
  open: string;
  close: string;
}

type HoursMap = Partial<Record<Day, DayHours>>;

interface StoreLocation {
  id: string;
  name: string;
  address_zh: string;
  address_en: string | null;
  district_zh: string | null;
  district_en: string | null;
  phone: string | null;
  hours: HoursMap | null;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
}

/* ── Business Hours Editor ─────────────────────────────── */
function BusinessHoursEditor({
  value,
  onChange,
  t,
}: {
  value: HoursMap;
  onChange: (h: HoursMap) => void;
  t: (key: string) => string;
}) {
  const toggleDay = (day: Day) => {
    const next = { ...value };
    if (next[day]) {
      delete next[day];
    } else {
      next[day] = { open: "10:00", close: "21:00" };
    }
    onChange(next);
  };

  const updateTime = (day: Day, field: "open" | "close", val: string) => {
    const current = value[day] ?? { open: "10:00", close: "21:00" };
    onChange({ ...value, [day]: { ...current, [field]: val } });
  };

  const isCrossDay = (day: Day) => {
    const dh = value[day];
    if (!dh) return false;
    return dh.close < dh.open;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {t("stores.hours")}
      </label>
      <div className="grid gap-1.5">
        {DAYS.map((day) => {
          const active = !!value[day];
          return (
            <div key={day} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`w-16 shrink-0 text-xs py-1 rounded text-center transition-colors ${
                  active
                    ? "bg-wine/10 text-wine font-medium"
                    : "bg-gray-100 text-gray-400 line-through"
                }`}
              >
                {t(`stores.hours.${day}`).slice(0, 3)}
              </button>
              {active ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="time"
                    value={value[day]!.open}
                    onChange={(e) => updateTime(day, "open", e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-24"
                  />
                  <span className="text-text-sub text-xs">—</span>
                  <input
                    type="time"
                    value={value[day]!.close}
                    onChange={(e) => updateTime(day, "close", e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-24"
                  />
                  {isCrossDay(day) && (
                    <span className="text-xs text-gold">{t("stores.hours.crossDay")}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">{t("stores.hours.closed")}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Hours Display (View Mode) ─────────────────────────── */
function HoursDisplay({ hours, t }: { hours: HoursMap | null; t: (key: string) => string }) {
  if (!hours || Object.keys(hours).length === 0) {
    return <p className="text-xs text-text-sub/40 mt-1">{t("stores.hours.notSet")}</p>;
  }

  // Group consecutive days with same hours
  const groups: { days: Day[]; open: string; close: string }[] = [];
  for (const day of DAYS) {
    const dh = hours[day];
    if (!dh) continue;
    const last = groups[groups.length - 1];
    if (last && last.open === dh.open && last.close === dh.close) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], open: dh.open, close: dh.close });
    }
  }

  const shortDay = (d: Day) => t(`stores.hours.${d}`).slice(0, 3);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      {groups.map((g, i) => {
        const label =
          g.days.length === 1
            ? shortDay(g.days[0])
            : `${shortDay(g.days[0])}-${shortDay(g.days[g.days.length - 1])}`;
        return (
          <span key={i} className="text-xs text-text-sub/60">
            {label} {g.open}-{g.close}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function StoresPage() {
  const { t } = useDashboardLang();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [requireSupabase, setRequireSupabase] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StoreLocation>>({});
  const [editHours, setEditHours] = useState<HoursMap>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", address_zh: "", address_en: "", district_zh: "", district_en: "", phone: "" });
  const [addHours, setAddHours] = useState<HoursMap>({});
  const [hoursEditingId, setHoursEditingId] = useState<string | null>(null);
  const [mapEditingId, setMapEditingId] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/stores");
      if (!res.ok) return;
      const data = await res.json();
      setStores(data.stores ?? []);
      setRequireSupabase(data.requireSupabase ?? false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const handleEdit = (store: StoreLocation) => {
    setEditingId(store.id);
    setEditForm({
      name: store.name,
      address_zh: store.address_zh,
      address_en: store.address_en ?? "",
      district_zh: store.district_zh ?? "",
      district_en: store.district_en ?? "",
      phone: store.phone ?? "",
    });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const { store } = await res.json();
        setStores((prev) => prev.map((s) => (s.id === id ? store : s)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: editHours }),
      });
      if (res.ok) {
        const { store } = await res.json();
        setStores((prev) => prev.map((s) => (s.id === id ? store : s)));
        setHoursEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoords = async (id: string) => {
    if (!mapCoords) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: mapCoords.lat, lng: mapCoords.lng }),
      });
      if (res.ok) {
        const { store } = await res.json();
        setStores((prev) => prev.map((s) => (s.id === id ? { ...s, lat: mapCoords.lat, lng: mapCoords.lng, ...store } : s)));
        setMapEditingId(null);
        setMapCoords(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (store: StoreLocation) => {
    const res = await fetch(`/api/merchant/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !store.is_active }),
    });
    if (res.ok) {
      const { store: updated } = await res.json();
      setStores((prev) => prev.map((s) => (s.id === store.id ? updated : s)));
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.address_zh) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...addForm };
      if (Object.keys(addHours).length > 0) body.hours = addHours;
      const res = await fetch("/api/merchant/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { store } = await res.json();
        setStores((prev) => [...prev, store]);
        setShowAdd(false);
        setAddForm({ name: "", address_zh: "", address_en: "", district_zh: "", district_en: "", phone: "" });
        setAddHours({});
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-bg-card rounded animate-pulse mb-4" />
        <div className="h-4 w-72 bg-bg-card rounded animate-pulse" />
      </div>
    );
  }

  if (requireSupabase) {
    return (
      <div className="p-8 text-center">
        <Store className="mx-auto h-12 w-12 text-text-sub mb-4" />
        <p className="text-text-sub">{t("stores.requireSupabase")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t("stores.title")}</h1>
          <p className="text-text-sub text-sm mt-1">{t("stores.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-wine text-white rounded-lg hover:bg-wine-dark transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          {t("stores.addStore")}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-2 text-sm text-text-sub">
        <MapPin className="h-4 w-4" />
        <span>{stores.length} {t("stores.storeCount")}</span>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white border border-bg-card rounded-xl p-5 mb-4">
          <h3 className="font-semibold mb-4">{t("stores.addStore")}</h3>
          <div className="grid gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.namePlaceholder")} value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.addressZh")} value={addForm.address_zh} onChange={(e) => setAddForm({ ...addForm, address_zh: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.addressEn")} value={addForm.address_en} onChange={(e) => setAddForm({ ...addForm, address_en: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.districtZh")} value={addForm.district_zh} onChange={(e) => setAddForm({ ...addForm, district_zh: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.districtEn")} value={addForm.district_en} onChange={(e) => setAddForm({ ...addForm, district_en: e.target.value })} />
            </div>
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.phone")} value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            <BusinessHoursEditor value={addHours} onChange={setAddHours} t={t} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setShowAdd(false); setAddHours({}); }} className="px-4 py-2 text-sm text-text-sub hover:text-text">{t("stores.cancel")}</button>
            <button onClick={handleAdd} disabled={saving || !addForm.name || !addForm.address_zh} className="px-4 py-2 bg-wine text-white rounded-lg text-sm hover:bg-wine-dark disabled:opacity-50">
              {saving ? t("stores.saving") : t("stores.save")}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stores.length === 0 && !showAdd && (
        <div className="text-center py-16 bg-white border border-bg-card rounded-xl">
          <MapPin className="mx-auto h-12 w-12 text-text-sub/30 mb-4" />
          <p className="text-text-sub">{t("stores.noStores")}</p>
          <p className="text-text-sub/60 text-sm mt-1">{t("stores.noStoresHint")}</p>
        </div>
      )}

      {/* Store List */}
      <div className="space-y-3">
        {stores.map((store) => (
          <div key={store.id} className="bg-white border border-bg-card rounded-xl p-5">
            {editingId === store.id ? (
              /* Edit Mode */
              <div>
                <div className="grid gap-3">
                  <input className="border rounded-lg px-3 py-2 text-sm font-medium" value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.addressZh")} value={editForm.address_zh ?? ""} onChange={(e) => setEditForm({ ...editForm, address_zh: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.addressEn")} value={editForm.address_en ?? ""} onChange={(e) => setEditForm({ ...editForm, address_en: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.districtZh")} value={editForm.district_zh ?? ""} onChange={(e) => setEditForm({ ...editForm, district_zh: e.target.value })} />
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.districtEn")} value={editForm.district_en ?? ""} onChange={(e) => setEditForm({ ...editForm, district_en: e.target.value })} />
                  </div>
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder={t("stores.phone")} value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setEditingId(null)} className="p-2 text-text-sub hover:text-text"><X className="h-4 w-4" /></button>
                  <button onClick={() => handleSave(store.id)} disabled={saving} className="p-2 text-wine hover:text-wine-dark"><Check className="h-4 w-4" /></button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text">{store.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${store.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {store.is_active ? t("stores.active") : t("stores.inactive")}
                      </span>
                    </div>
                    <p className="text-sm text-text-sub">{store.address_zh}</p>
                    {store.address_en && <p className="text-xs text-text-sub/60">{store.address_en}</p>}
                    {store.district_zh && <p className="text-xs text-text-sub/60 mt-1">{store.district_zh}{store.district_en ? ` / ${store.district_en}` : ""}</p>}
                    {store.phone && <p className="text-xs text-text-sub/60 mt-1">📞 {store.phone}</p>}
                    <HoursDisplay hours={store.hours} t={t} />
                    {store.lat != null && store.lng != null ? (
                      <p className="text-xs text-text-sub/60 mt-1 flex items-center gap-1">
                        <Crosshair className="h-3 w-3" />
                        {store.lat.toFixed(4)}, {store.lng.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-xs text-text-sub/40 mt-1">{t("stores.coordinates.notSet")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => handleEdit(store)} className="p-2 text-text-sub hover:text-wine" title={t("stores.edit")}><Edit2 className="h-4 w-4" /></button>
                    <button
                      onClick={() => {
                        setHoursEditingId(store.id);
                        setEditHours((store.hours as HoursMap) ?? {});
                      }}
                      className="p-2 text-text-sub hover:text-wine"
                      title={t("stores.hours.edit")}
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setMapEditingId(store.id);
                        setMapCoords(store.lat != null && store.lng != null ? { lat: store.lat, lng: store.lng } : null);
                      }}
                      className="p-2 text-text-sub hover:text-wine"
                      title={t("stores.coordinates.edit")}
                    >
                      <Crosshair className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleToggleActive(store)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${store.is_active ? "border-gray-300 text-text-sub hover:border-red-300 hover:text-red-600" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                      {store.is_active ? t("stores.inactive") : t("stores.active")}
                    </button>
                  </div>
                </div>

                {/* Inline Hours Editor */}
                {hoursEditingId === store.id && (
                  <div className="mt-4 pt-4 border-t border-bg-card">
                    <BusinessHoursEditor value={editHours} onChange={setEditHours} t={t} />
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => setHoursEditingId(null)} className="px-3 py-1.5 text-xs text-text-sub hover:text-text">{t("stores.cancel")}</button>
                      <button onClick={() => handleSaveHours(store.id)} disabled={saving} className="px-3 py-1.5 bg-wine text-white rounded-lg text-xs hover:bg-wine-dark disabled:opacity-50">
                        {saving ? t("stores.saving") : t("stores.save")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Map Picker */}
                {mapEditingId === store.id && (
                  <div className="mt-4 pt-4 border-t border-bg-card">
                    <label className="text-sm font-medium text-text flex items-center gap-1.5 mb-2">
                      <Crosshair className="h-3.5 w-3.5" />
                      {t("stores.coordinates")}
                    </label>
                    <MapPicker
                      lat={store.lat}
                      lng={store.lng}
                      onChange={(lat, lng) => setMapCoords({ lat, lng })}
                      t={t}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => { setMapEditingId(null); setMapCoords(null); }} className="px-3 py-1.5 text-xs text-text-sub hover:text-text">{t("stores.cancel")}</button>
                      <button onClick={() => handleSaveCoords(store.id)} disabled={saving || !mapCoords} className="px-3 py-1.5 bg-wine text-white rounded-lg text-xs hover:bg-wine-dark disabled:opacity-50">
                        {saving ? t("stores.saving") : t("stores.save")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
