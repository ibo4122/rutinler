"use client";

// Saf sunum bileşenleri. page.js'ten ayrıştırıldı; başka modüllerde de kullanılabilir.

export function SummaryCard({ title, value, detail, tone }) { return <article className={`summaryCard ${tone}`}><div className="summaryLabel">{title}</div><div className={`summaryValue summaryValue-${tone}`}>{value}</div><div className="summaryDetail">{detail}</div></article>; }

export function Panel({ title, subtitle, totalLabel, total, open, onToggle, children }) { return <section className="panelCard"><button type="button" className="panelHeader" onClick={onToggle}><div><h2 className="gradientTitle">{title}</h2><p>{subtitle}</p></div><div className="panelRight"><div className="panelTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="toggleButton">{open ? "−" : "+"}</div></div></button>{open ? <div className="panelBody">{children}</div> : null}</section>; }

export function MiniPanel({ title, totalLabel, total, color, open, onToggle, children }) { return <section className={`miniPanel ${color}`}><button type="button" className="miniHeader" onClick={onToggle}><div><h3 className={`miniTitle miniTitle-${color}`}>{title}</h3></div><div className="miniRight"><div className="miniTotal"><span>{totalLabel}</span><strong>{total}</strong></div><div className="miniToggle">{open ? "−" : "+"}</div></div></button>{open ? <div className="miniBody">{children}</div> : null}</section>; }

export function InputBox({ label, value, onChange, type = "text", placeholder = "" }) { return <label className="inputBox"><span>{label}</span><input type={type} value={value} placeholder={placeholder} inputMode={type === "date" ? undefined : "text"} onChange={(event) => onChange(event.target.value)} /></label>; }

export function SelectBox({ label, value, onChange, options }) { return <label className="inputBox"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

export function EmptyState({ text }) { return <div className="emptyState"><strong>{text}</strong><span>Yeni kayıt eklediğinde burada görüntülenecek.</span></div>; }
