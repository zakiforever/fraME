export default function Header() {
  return (
    <header style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 50, lineHeight: 0, fontSize: 0, padding: 0, margin: 0 }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "block", lineHeight: 0, padding: 0, margin: 0 }}>
          <img
            src="/logo.png"
            alt="fraME"
            style={{ height: "240px", width: "auto", display: "block", padding: 0, margin: 0 }}
          />
        </a>
        <nav style={{ lineHeight: "normal", fontSize: "initial" }}>
          <a
            href="/demo"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            Demo
          </a>
        </nav>
      </div>
    </header>
  );
}
