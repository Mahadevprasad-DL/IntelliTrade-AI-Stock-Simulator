import React, { useState } from "react";
import TradingSystem from "./pages/TradingSystem.jsx";
import Settings from "./pages/Settings.jsx";
import Classification from "./pages/Classification.jsx";
import AIGuide from "./pages/AIGuide.jsx";
import Analysis from "./pages/Analysis.jsx";
import Tutorials from "./pages/Tutorials.jsx";
import ScreenHome from "./pages/ScreenHome.jsx";

function MainHome({ user, onLogout }) {

  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  const navItems = [
    { name: "Home", key: "home" },
    { name: "Trading System", key: "trading" },
    { name: "Classification", key: "Classification" },
    { name: "AI Guide", key: "guide" },
    { name: "Analysis", key: "analysis" },
    { name: "Tutorials", key: "tutorials" }
  ];

  // RENDER CONTENT BASED ON PAGE SELECTION
  const renderPageContent = () => {
    switch(currentPage) {
      case "stock":
        return <Stock user={user} />;
      case "trading":
        return <TradingSystem user={user} onOpenSettings={() => setCurrentPage("settings")} />;
      case "settings":
        return <Settings onBack={() => setCurrentPage("trading")} />;
      case "Classification":
        return <Classification user={user} />;
      case "guide":
        return <AIGuide user={user} />;
      case "analysis":
        return <Analysis user={user} />;
      case "tutorials":
        return <Tutorials user={user} />;
      case "home":
      default:
        return <ScreenHome user={user} onNavigate={setCurrentPage} onLogout={onLogout} />;
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Arial, sans-serif",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        color: "white",
        display: "flex",
        flexDirection: "column"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "18px 36px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(0,0,0,0.2)"
        }}
      >

        <h1
          onClick={() => setCurrentPage("home")}
          style={{
            margin: 0,
            fontSize: 28,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          IntelliTrade
        </h1>

        {/* NAVBAR */}
        <div style={{ display: "flex", gap: 30, flex: 1, justifyContent: "center" }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${currentPage === item.key ? "#00e0ff" : "transparent"}`,
                color: currentPage === item.key ? "#00e0ff" : "white",
                fontSize: 15,
                cursor: "pointer",
                padding: "8px 12px",
                fontWeight: currentPage === item.key ? "bold" : "normal",
                transition: "all 0.3s ease"
              }}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            style={{
              width: 45,
              height: 45,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#00c6ff,#0072ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 15px rgba(0,114,255,0.4)"
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          {showProfile && (
            <div
              style={{
                position: "absolute",
                top: 60,
                right: 0,
                width: 230,
                background: "white",
                color: "#222",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                zIndex: 1000
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <strong>Username:</strong>
                <br />
                {user?.username || "-"}
              </div>

              <div style={{ marginBottom: 15 }}>
                <strong>Email:</strong>
                <br />
                {user?.email || "-"}
              </div>

              <button
                onClick={onLogout}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "background 0.3s ease"
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {renderPageContent()}
      </div>

    </div>
  );
}

export default MainHome;