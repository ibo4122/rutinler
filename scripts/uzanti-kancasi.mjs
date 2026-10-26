// Node testleri için: lib/ dosyaları Next.js gibi uzantısız içe aktarım yapar
// ("./istanbul"). Bu kanca göreli ve uzantısız adreslere ".js" ekler.
import { register } from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(belirtec, baglam, sonraki) {
  if ((belirtec.startsWith("./") || belirtec.startsWith("../")) && !/\\.[cm]?js$|\\.json$/.test(belirtec)) {
    try { return await sonraki(belirtec + ".js", baglam); } catch {}
  }
  return sonraki(belirtec, baglam);
}
`), import.meta.url);
