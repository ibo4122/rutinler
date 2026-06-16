"use client";

import { useMemo, useState } from "react";

export default function BesProjectionPanel() {
  const [yatirilanPara, setYatirilanPara] = useState("");
  const [fonGetirisi, setFonGetirisi] = useState("");
  const [devletKatkisi, setDevletKatkisi] = useState("");
  const [devletFonGetirisi, setDevletFonGetirisi] = useState("");

  const formatCurrency = (value) => {
    const number = Number(value) || 0;

    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const parseNumber = (value) => {
    if (!value) return 0;
    return Number(String(value).replace(",", ".")) || 0;
  };

  const hesaplama = useMemo(() => {
    const yatirilan = parseNumber(yatirilanPara);
    const fon = parseNumber(fonGetirisi);
    const devlet = parseNumber(devletKatkisi);
    const devletFon = parseNumber(devletFonGetirisi);

    const devletToplami = devlet + devletFon;
    const hakEdilenDevletTutari = devletToplami * 0.35;

    const mevcutTotalPara = yatirilan + fon + hakEdilenDevletTutari;

    return {
      yatirilan,
      fon,
      devlet,
      devletFon,
      devletToplami,
      hakEdilenDevletTutari,
      mevcutTotalPara,
    };
  }, [yatirilanPara, fonGetirisi, devletKatkisi, devletFonGetirisi]);

  const InputBox = ({ label, value, onChange, placeholder }) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          {label}
        </label>

        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    );
  };

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          BES Projeksiyon
        </p>

        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Mevcut BES Değeri
        </h2>

        <p className="text-sm text-slate-500">
          Devlet katkısı ve devlet katkısı fon getirisi toplamının yalnızca
          <strong className="text-slate-800"> %35’i </strong>
          mevcut toplam paraya dahil edilir.
        </p>
      </div>

      <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 p-[1px] shadow-2xl">
        <div className="rounded-3xl bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Mevcut Total Para
              </p>

              <h3 className="mt-1 text-4xl font-black tracking-tight text-slate-900">
                {formatCurrency(hesaplama.mevcutTotalPara)}
              </h3>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold text-emerald-700">
                Hak Edilen Devlet Payı
              </p>

              <p className="text-xl font-black text-emerald-700">
                {formatCurrency(hesaplama.hakEdilenDevletTutari)}
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                Devlet katkısı + devlet fon getirisi x %35
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputBox
          label="Yatırılan Para"
          value={yatirilanPara}
          onChange={setYatirilanPara}
          placeholder="Örn: 250000"
        />

        <InputBox
          label="Fon Getirisi"
          value={fonGetirisi}
          onChange={setFonGetirisi}
          placeholder="Örn: 75000"
        />

        <InputBox
          label="Devlet Katkısı"
          value={devletKatkisi}
          onChange={setDevletKatkisi}
          placeholder="Örn: 50000"
        />

        <InputBox
          label="Devlet Katkısı Fon Getirisi"
          value={devletFonGetirisi}
          onChange={setDevletFonGetirisi}
          placeholder="Örn: 15000"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-500">
            Yatırılan Para
          </p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {formatCurrency(hesaplama.yatirilan)}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-100 p-4">
          <p className="text-xs font-semibold text-blue-600">
            Fon Getirisi
          </p>
          <p className="mt-1 text-lg font-black text-blue-800">
            {formatCurrency(hesaplama.fon)}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-100 p-4">
          <p className="text-xs font-semibold text-purple-600">
            Devlet Toplamı
          </p>
          <p className="mt-1 text-lg font-black text-purple-800">
            {formatCurrency(hesaplama.devletToplami)}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-600">
            %35 Dahil Edilen
          </p>
          <p className="mt-1 text-lg font-black text-emerald-800">
            {formatCurrency(hesaplama.hakEdilenDevletTutari)}
          </p>
        </div>
      </div>
    </section>
  );
}
