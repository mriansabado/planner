import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { ViewToggle } from "./ViewToggle";
import { ThemeToggle } from "./ThemeToggle";
import "../App.css";

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <NavLink to="/" className="header-logo">
            <h1>Freelance Planner</h1>
          </NavLink>
          <p className="tagline">Track hours. Meet commitments. Stay organized.</p>
        </div>
        <nav className="header-nav">
          <NavLink to="/" end>
            Planner
          </NavLink>
          <NavLink to="/clients">Clients</NavLink>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <ViewToggle />
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
