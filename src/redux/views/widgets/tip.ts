import "../../assets/style/widgets/tip.scss";

class Tip {
  static READ_SPEED: number = 600; //ms to read a word
  container: HTMLDivElement;
  content: string;
  show(content: string) {
    this.content = content;
    this.container = document.createElement("div");
    this.container.classList.add("tip-container", "ease-fade");
    this.container.innerHTML = this.content;
    document.body.appendChild(this.container);
    this.container.style.left = `calc(50% - ${
      this.container.clientWidth / 2
    }px)`;
    setTimeout(() => {
      this.hide();
    }, Tip.READ_SPEED * this.content.split(" ").length);
  }
  hide() {
    this.container.classList.add("hide-ele");
    setTimeout(() => {
      this.container.remove();
    }, 1000);
  }
}

export const tip: Tip = new Tip();
