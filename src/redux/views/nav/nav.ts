import "../../assets/style/nav.scss";
import LogoImg from "../../assets/img/logo.png";
import { NON_SKETCH_CLS } from "../../global-consts";

export default class Nav {
  navContainer: HTMLDivElement;

  public createNav() {
    this.navContainer = document.createElement("div");
    this.navContainer.className = `nav ${NON_SKETCH_CLS}`;

    const logoContainer: HTMLSpanElement = document.createElement("span");
    logoContainer.className = "logo-container";
    const logo: HTMLImageElement = new Image();
    logo.src = LogoImg;
    logoContainer.appendChild(logo);
    const logoText: HTMLSpanElement = document.createElement("span");
    logoText.textContent = "M2-CAST";
    logoText.className = "title-text";
    logoContainer.appendChild(logoText);

    this.createSubNav([
      logoContainer,
    ]);
  }

  public createSubNav(items: any[]) {
    const subNav: HTMLDivElement = document.createElement("div");
    subNav.className = "sub-nav";
    items.forEach((item) => {
      subNav.appendChild(item);
    });
    this.navContainer.appendChild(subNav);
  }
}

export const nav = new Nav();