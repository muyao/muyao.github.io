class GlobalFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = "<div><a href=\"/\"><i class=\"fa-solid fa-house\"></i>Home</a></div><div><a href=\"https://github.com/muyao/muyao.github.io\"><i class=\"fa-brands fa-github\"></i>GitHub</a></div>";
    }
}

customElements.define("global-footer", GlobalFooter);