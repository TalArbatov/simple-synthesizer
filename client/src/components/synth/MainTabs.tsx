type Page = 'osc' | 'fx';

export function MainTabs({
  activePage,
  onChange,
}: {
  activePage: Page;
  onChange: (page: Page) => void;
}) {
  return (
    <div className="main-tabs">
      <div
        className={`main-tab${activePage === 'osc' ? ' active' : ''}`}
        data-page="osc"
        onClick={() => onChange('osc')}
      >
        Osc
      </div>
      <div
        className={`main-tab${activePage === 'fx' ? ' active' : ''}`}
        data-page="fx"
        onClick={() => onChange('fx')}
      >
        FX
      </div>
    </div>
  );
}
