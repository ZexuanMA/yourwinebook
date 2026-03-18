"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Plus, Edit2, Check, X, Store } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface StoreLocation {
  id: string;
  name: string;
  address_zh: string;
  address_en: string | null;
  district_zh: string | null;
  district_en: string | null;
  phone: string | null;
  is_active: boolean;
}

export default function StoresPage() {
  const { t } = useDashboardLang();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [requireSupabase, setRequireSupabase] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StoreLocation>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", address_zh: "", address_en: "", district_zh: "", district_en: "", phone: "" });

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
      const res = await fetch("/api/merchant/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const { store } = await res.json();
        setStores((prev) => [...prev, store]);
        setShowAdd(false);
        setAddForm({ name: "", address_zh: "", address_en: "", district_zh: "", district_en: "", phone: "" });
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
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-text-sub hover:text-text">{t("stores.cancel")}</button>
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
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => handleEdit(store)} className="p-2 text-text-sub hover:text-wine" title={t("stores.edit")}><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleToggleActive(store)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${store.is_active ? "border-gray-300 text-text-sub hover:border-red-300 hover:text-red-600" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                    {store.is_active ? t("stores.inactive") : t("stores.active")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
