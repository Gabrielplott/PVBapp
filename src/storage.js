import { supabase } from "./supabaseClient";

// Substitui o window.storage dos artefatos do Claude por um armazenamento
// real no Supabase (tabela app_storage), protegido por login (RLS).
export const storage = {
  async get(key) {
    const { data, error } = await supabase
      .from("app_storage")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? { key, value: data.value } : null;
  },

  async set(key, value) {
    const { error } = await supabase
      .from("app_storage")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
    if (error) throw error;
    return { key, value };
  },

  async delete(key) {
    const { error } = await supabase.from("app_storage").delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true };
  },
};
