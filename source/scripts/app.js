import AOS from "aos";
import "aos/dist/aos.css";
import {Notyf} from "notyf";
import "notyf/notyf.min.css";


const init = () => {
  AOS.init({
    offset: 100,
    duration: 500,
    easing: `ease-out-back`,
    delay: 0,
    once: true,
    disable: window.innerWidth < 768,
  });

  const notyf = new Notyf({
    duration: 3000,
    ripple: false,
    position: {
      x: `left`,
      y: `top`
    },
    dismissible: true,
    types: [
      {
        type: `info`,
        background: `#2f96b4`,
        icon: {
          className: `toast-icon toast-icon--info`,
          tagName: `i`,
        },
      }
    ]
  });

  document.querySelectorAll(`[data-blank-status]`)
    .forEach((node) => {
      node.addEventListener(`click`, (evt) => {
        evt.preventDefault();

        notyf.open({
          type: `info`,
          message: `Данный функционал отсутствует`,
        });
      });
    });
};

export {
  init,
};
