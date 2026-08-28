export default function FeaturePage({ title, kicker, description, nextStep }) {
  return <div className="feature-page panel"><span className="feature-icon">◌</span><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{description}</p><div className="feature-next"><strong>Planned next step</strong><span>{nextStep}</span></div></div>;
}
