"use client";

type Props = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  hint?: string;
};

export function EmptyStateGuide({ icon = "🗂️", title, description, actionLabel, onAction, hint }: Props) {
  return (
    <div className="card" style={{ padding:20, textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--surface2)", display:"grid", placeItems:"center", fontSize:24, margin:"0 auto 12px" }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:14 }}>{title}</div>
      <div className="muted" style={{ fontSize:12, lineHeight:"16px", marginTop:6, maxWidth:320, marginLeft:"auto", marginRight:"auto" }}>{description}</div>
      {hint && <div style={{ background:"var(--accent-soft)", color:"var(--accent)", fontSize:12, padding:"8px 12px", borderRadius:10, marginTop:12 }}>{hint}</div>}
      {actionLabel && onAction && <button className="btn accent" style={{ width:"100%", marginTop:14, minHeight:44 }} onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
