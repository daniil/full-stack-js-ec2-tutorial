import { NavLink } from "react-router-dom";
import logoImg from '../../assets/logo.jpeg';
import "./Header.scss";

function Header() {
  return (
    <header className="header">
      <img src={logoImg} height="100" alt="Warehouse Loog"/>
      <nav className="header__nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            "header__nav-link" + (isActive ? " header__nav-link--active" : "")
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/warehouses"
          className={({ isActive }) =>
            "header__nav-link" + (isActive ? " header__nav-link--active" : "")
          }
        >
          Warehouses
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            "header__nav-link" + (isActive ? " header__nav-link--active" : "")
          }
        >
          Inventory
        </NavLink>
      </nav>
    </header>
  );
}

export default Header;
