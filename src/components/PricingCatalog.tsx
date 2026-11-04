"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Info, ArrowRight, ShieldCheck } from "lucide-react";

interface Product {
  name: string;
  substance: string;
  manufacturer: string;
  format: string;
  price: number;
  imageId: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Semalix 3 Tablet strip of 10 tablets",
    substance: "Semaglutide",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    format: "Tablet",
    price: 1100,
    imageId: "1qbl4a6zY0iBol_UC3KX_W4TpRSFzd7Df"
  },
  {
    name: "Semalix 14 Tablet strip of 10 tablets",
    substance: "Semaglutide",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    format: "Tablet",
    price: 2500,
    imageId: "1z433jmBS66bl5QrVjEYaF_lvhH5_PbvQ"
  },
  {
    name: "Semalix 2mg Prefilled Pen (For 0.25mg/0.5mg Dose) box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    format: "Pre-filled Pen",
    price: 4000,
    imageId: "1pAxE2KXfn2ORgsObV4lEUzvIsivz6UUC"
  },
  {
    name: "Semalix 4mg Prefilled Pen (For 1 mg Dose) box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    format: "Pre-filled Pen",
    price: 4500,
    imageId: "1awB5WzPmxdQt2zPVlqEE7d5VrBF49KzK"
  },
  {
    name: "Obeda 3mg Tablet strip of 10 tablets",
    substance: "Semaglutide",
    manufacturer: "Dr. Reddy's",
    format: "Tablet",
    price: 1000,
    imageId: "1FZOtJnyutPLWjTJhxT-msKZP8WZZ2lTk"
  },
  {
    name: "Obeda 7mg Tablet strip of 10 tablets",
    substance: "Semaglutide",
    manufacturer: "Dr. Reddy's",
    format: "Tablet",
    price: 1300,
    imageId: "1XNzBtTVCha-2hE04bmPBHsZRet69FtiW"
  },
  {
    name: "Obeda 14mg Tablet strip of 10 tablets",
    substance: "Semaglutide",
    manufacturer: "Dr. Reddy's",
    format: "Tablet",
    price: 2200,
    imageId: "1QUCkEsWna2ZhRxy_3iPJnBheolN9j93z"
  },
  {
    name: "Obeda 2mg Pre-filled Pen (with BD-Ultra Fine 32G - 6 Needle) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Dr. Reddy's",
    format: "Pre-filled Pen",
    price: 3800,
    imageId: "1w8aIDcBJMWcD03PG-UbLHBI7jgC4ZgZY"
  },
  {
    name: "Obeda 4mg Pre-filled Pen (with BD Ultra-Fine 32G - 4 Needle) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Dr. Reddy's",
    format: "Pre-filled Pen",
    price: 4000,
    imageId: "1WVsM976z_9iL4SoeT7nx9pgs6Rpxfedl"
  },
  {
    name: "Sundae Vial 0.25mg/0.5mg Injection box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Eris Lifesciences",
    format: "Vial",
    price: 1300,
    imageId: "1zhEaShKqrasuOLkEZuB1EiLGQbL80RUI"
  },
  {
    name: "Sundae Vial 1mg Injection box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Eris Lifesciences",
    format: "Vial",
    price: 1300,
    imageId: "1pPBS4IsniJCDfIIhdMnW__IMPAfuy4iU"
  },
  {
    name: "Sundae Vial 2mg Injection box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Eris Lifesciences",
    format: "Vial",
    price: 1800,
    imageId: "1vFcdZP6uEBUcTsyIXWMoAB5mEOeFRjFY"
  },
  {
    name: "Sundae 2mg Pre-filled Pen box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Eris Lifesciences",
    format: "Pre-filled Pen",
    price: 3000,
    imageId: "1ffoMeSBFh4uqA9dzFd7R-1DrtuoPUiAH"
  },
  {
    name: "Noveltreat 0.25 mg Pre-filled Pen box of 2 pre-filled pens",
    substance: "Semaglutide",
    manufacturer: "Sun Pharma",
    format: "Pre-filled Pen",
    price: 1700,
    imageId: "1SVIB6elNkOkOl7KDgigZs8LO7fw4DF7T"
  },
  {
    name: "Noveltreat 0.5 mg Pre-filled Pen box of 2 pre-filled pens",
    substance: "Semaglutide",
    manufacturer: "Sun Pharma",
    format: "Pre-filled Pen",
    price: 1900,
    imageId: "1wbaVyNKOhhqr-L5ZRtRMWPMwiQRYtB0W"
  },
  {
    name: "Noveltreat 1 mg Pre-filled Pen box of 2 pre-filled pens",
    substance: "Semaglutide",
    manufacturer: "Sun Pharma",
    format: "Pre-filled Pen",
    price: 2400,
    imageId: "1mqfa7Upr1gqknlGJOaCdK0GNiX8Kw3CH"
  },
  {
    name: "Noveltreat 1.7 mg Pre-filled Pen box of 2 pre-filled pens",
    substance: "Semaglutide",
    manufacturer: "Sun Pharma",
    format: "Pre-filled Pen",
    price: 3100,
    imageId: "1WlpNbFiBT_zggUCbKcEZ4gt-fvA7BO-O"
  },
  {
    name: "Noveltreat 2.4 mg Pre-filled Pen box of 2 pre-filled pens",
    substance: "Semaglutide",
    manufacturer: "Sun Pharma",
    format: "Pre-filled Pen",
    price: 3500,
    imageId: "1gcElwAjnYldi7of49XylAsNOiuu-ZtXF"
  },
  {
    name: "Semasize 0.25mg/0.5 Injection (1 Multi-dose Disposable Pen, 6 Needle, 6 Alcohol Swab) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Pre-filled Pen",
    price: 1900,
    imageId: "1YblyCe5N5s_fPVp4sURebWLmPzb0hTL-"
  },
  {
    name: "Semasize 1mg Solution for Injection (1 Cartridge, 4 Needle, 4 Alcohol Swab) box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Cartridge",
    price: 1500,
    imageId: "1ZH4wOe4LI7f5GmAJr92QHX-5JSK-zu9p"
  },
  {
    name: "Semasize 1mg Injection (1 Multi-dose Disposable Pen, 4 Needle, 4 Alcohol Swab) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Pre-filled Pen",
    price: 1500,
    imageId: "1uAbbHqI_vNE7BVweLB7Wab2IkeYyqJGt"
  },
  {
    name: "Semasize 2mg Injection (1 Multi-dose Disposable Pen, 4 Needle, 4 Alcohol Swab) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Pre-filled Pen",
    price: 2900,
    imageId: "1akliJXCgULs-BOLs6Xcu9XmjFcuYobPK"
  },
  {
    name: "Semasize Plus 1.7mg Solution for Injection (1 Cartridge, 4 Needle, 4 Alcohol Swab) box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Cartridge",
    price: 1950,
    imageId: "1_nZmEdVkeMmG5eahmIbtE2bgSV3cL--9"
  },
  {
    name: "Semasize Plus 1.7mg Injection (1 Multi-dose Disposable Pen, 4 Needle, 4 Alcohol Swab) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Pre-filled Pen",
    price: 2500,
    imageId: "1Et-Hw7SuRfm3SYWl0bush3YaBcoX68ew"
  },
  {
    name: "Semasize Plus 2.4mg Injection (1 Multi-dose Disposable Pen, 4 Needle, 4 Alcohol Swab) box of 1 pre-filled pen",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Pre-filled Pen",
    price: 2900,
    imageId: "1-V9jxK1fI1GIYy1j80UdwGage5m18b18"
  },
  {
    name: "Semasize Plus 2.4mg Solution for Injection (1 Cartridge, 4 Needle, 4 Alcohol Swab) box of 1 injection",
    substance: "Semaglutide",
    manufacturer: "Alkem Labs",
    format: "Cartridge",
    price: 3350,
    imageId: "1dxnDb8v4JeBhfU78OO6ZuogOpQ2Bvu36"
  },
  {
    name: "Yurpeak 7.5mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 1294,
    imageId: "1UYc7HlWCIo7Rv-dX7mo0ZKAo21Su4SXP"
  },
  {
    name: "Yurpeak 15mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 1294,
    imageId: "15d87tnkx9WiA0LtWHjKBdFIKuAxQcI9G"
  },
  {
    name: "Yurpeak 12.5mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 1298,
    imageId: "15Y7tgLp7R-9kHhnVI215ex6n_Ntup2qD"
  },
  {
    name: "Yurpeak 10mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 1298,
    imageId: "1kFVccDZbgO5Qgm7DDHUyAytVdE4LnE3F"
  },
  {
    name: "Yurpeak 5mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 13125,
    imageId: "1BTK0vnfGro4Dpmlq42c7mBIcfRn0r-RU"
  },
  {
    name: "Yurpeak 2.5mg KwikPen pre-filled pen of 3 ml solution for injection",
    substance: "Tirzepatide",
    manufacturer: "Cipla",
    format: "Pre-filled Pen",
    price: 16406.25,
    imageId: "1s6DY2mAYDhNm_BMOzz1jP4mlArTb6Vup"
  }
];

export default function PricingCatalog() {
  const [search, setSearch] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedManufacturer, setSelectedManufacturer] = useState("all");

  const manufacturers = useMemo(() => {
    return Array.from(new Set(PRODUCTS.map(p => p.manufacturer)));
  }, []);

  const formats = useMemo(() => {
    return Array.from(new Set(PRODUCTS.map(p => p.format)));
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
                            p.substance.toLowerCase().includes(search.toLowerCase());
      const matchesFormat = selectedFormat === "all" || p.format === selectedFormat;
      const matchesManufacturer = selectedManufacturer === "all" || p.manufacturer === selectedManufacturer;
      return matchesSearch && matchesFormat && matchesManufacturer;
    });
  }, [search, selectedFormat, selectedManufacturer]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search medications or brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-800 dark:text-zinc-200"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Format Selector */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-700 dark:text-zinc-300"
          >
            <option value="all">All Formats</option>
            {formats.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Manufacturer Selector */}
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="px-3 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-700 dark:text-zinc-300"
          >
            <option value="all">All Manufacturers</option>
            {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 rounded-3xl text-zinc-400">
          <Info className="h-8 w-8 mx-auto opacity-50 mb-2" />
          <p className="font-bold text-sm">No weight loss medications match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p, idx) => (
            <div
              key={idx}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-150 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/40 backdrop-blur-sm"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 flex items-center justify-center">
                  <img
                    src={`/api/med-image/${p.imageId}`}
                    alt={p.name}
                    className="max-h-[120px] max-w-full object-contain p-2 transition-transform duration-350 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      // fallback for loading issues
                      (e.target as HTMLImageElement).src = "/placeholder-med.png";
                    }}
                  />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {p.format}
                  </span>
                </div>

                {/* Product Specifications */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                      {p.manufacturer}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                      {p.substance}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-850 dark:text-zinc-100 line-clamp-2 min-h-[40px]" title={p.name}>
                    {p.name}
                  </h3>
                </div>
              </div>

              {/* Price & Call to Action */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">India Price</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                </div>
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Order Plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clinical Guidance Footnote */}
      <div className="bg-emerald-50/25 border border-emerald-100/50 p-5 rounded-3xl dark:bg-emerald-950/10 dark:border-emerald-900/30 flex gap-3 text-xs leading-relaxed text-zinc-650 dark:text-zinc-400">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-zinc-850 dark:text-zinc-200">Prescription Requirement & Medical Consultation</p>
          <p>
            All listed GLP-1 and dual GIP/GLP-1 (Semaglutide & Tirzepatide) formulations require a valid doctor prescription. Eligible patients receive structured dosage progression plans, continuous clinical support, and medication delivery directly from registered pharmacies. Take the online screening to verify qualification.
          </p>
        </div>
      </div>
    </div>
  );
}
