export function GreenTrackBackdrop() {
  return (
    <div className="green-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="green-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="green-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="green-track-backdrop-line" />
      </svg>
    </div>
  );
}

export function OrangeTrackBackdrop() {
  return (
    <div className="orange-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="orange-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="orange-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="orange-track-backdrop-line" />
        <circle cx="37.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
        <circle cx="64.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
        <circle cx="82.5" cy="9" r="1.8" className="orange-track-backdrop-dot" />
      </svg>
    </div>
  );
}

export function PurpleTrackBackdrop() {
  return (
    <div className="purple-track-backdrop" aria-hidden="true">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="purple-track-backdrop-svg">
        <rect x="1.5" y="1.5" width="97" height="15" rx="7.5" className="purple-track-backdrop-frame" />
        <path d="M10.5 2v14M19.5 2v14M28.5 2v14M37.5 2v14M46.5 2v14M55.5 2v14M64.5 2v14M73.5 2v14M82.5 2v14M91.5 2v14" className="purple-track-backdrop-line" />
        <path d="M6 12c3-5 6-5 9 0s6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0 6 5 9 0 6-5 9 0" className="purple-track-backdrop-wave" />
      </svg>
    </div>
  );
}
