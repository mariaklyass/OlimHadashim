"use strict";

class Entry {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, name, notes) {
    this.coords = coords; // [lat, lng]
    this.name = name;
    this.notes = notes;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Health extends Entry {
  type = "health";

  constructor(coords, name, notes) {
    super(coords, name, notes);
    this._setDescription();
  }
}

class Finance extends Entry {
  type = "finance";

  constructor(coords, name, notes) {
    super(coords, name, notes);
    this._setDescription();
  }
}

class Governement extends Entry {
  type = "governement";

  constructor(coords, name, notes) {
    super(coords, name, notes);
    this._setDescription();
  }
}

class Errands extends Entry {
  type = "errands";

  constructor(coords, name, notes) {
    super(coords, name, notes);
    this._setDescription();
  }
}

///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector(".form");
const containerEntries = document.querySelector(".entries");
const inputType = document.querySelector(".form__input--type");
const inputName = document.querySelector(".form__input--name");
const inputNotes = document.querySelector(".form__input--notes");

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #entries = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener("submit", this._newEntry.bind(this));
    // inputType.addEventListener("change", this._toggleElevationField);
    containerEntries.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#entries.forEach((entry) => {
      this._renderEntryMarker(entry);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
  }

  _hideForm() {
    // Empty inputs
    inputName.value = inputNotes.value = "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _newEntry(e) {
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const name = inputName.value;
    const notes = inputNotes.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let entry;

    // If entry health, create health object
    if (type === "health") {
      entry = new Health([lat, lng], name, notes);
    }

    // If entry finance, create finance object
    if (type === "finance") {
      entry = new Finance([lat, lng], name, notes);
    }

    // If entry governement, create governement object
    if (type === "governement") {
      entry = new Governement([lat, lng], name, notes);
    }

    // If entry errands, create errands object
    if (type === "errands") {
      entry = new Errands([lat, lng], name, notes);
    }

    // Add new object to entries array
    this.#entries.push(entry);

    // Render entry on map as marker
    this._renderEntryMarker(entry);

    // Render entry on list
    this._renderEntry(entry);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all entries
    this._setLocalStorage();
  }

  _renderEntryMarker(entry) {
    const marker = L.marker(entry.coords, { draggable: true })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          className: `${entry.type}-popup`,
        })
      )
      .setPopupContent(`${entry.description}`)
      .openPopup();
  }

  _renderEntry(entry) {
    let html = `
      <li class="entry entry--${entry.type}" data-id="${entry.id}">
        <h2 class="entry__title">${entry.description}</h2>
        <div class="entry__details">
          <span class="entry__icon">${
            entry.type === "finance" ? "📍" : "📍"
          }</span>
          <span class="entry__value">${entry.name}</span>

        </div>
        <div class="entry__details">
          <span class="entry__icon">📝</span>
          <span class="entry__value">${entry.notes}</span>
        </div>
    `;

    // html += `
    // <button class="delete-entry-btn" data-id="${entry.id}">
    // Delete the Marker
    // </button>
    // </li>
    // `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const entryEl = e.target.closest(".entry");

    if (!entryEl) return;

    const entry = this.#entries.find((entr) => entr.id === entryEl.dataset.id);

    this.#map.setView(entry.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // _deletePopup(e) {
  //   const deleteBtn = e.target.closest(".delete-entry-btn");

  //   if (deleteBtn) {
  //     //get the entry id from the delete button's data attribute
  //     const entryID = deleteBtn.dataset.id;

  //     //find the corresponding entry in the entries array

  //     const entryIndex = this.#entries.findIndex(
  //       (entry) => entry.id === entryID
  //     );

  //     if (entryIndex !== -1) {
  //       //remove the entry from the entries array
  //       this.#entries.splice(entryIndex, 1);

  //       //update the local storage and re-render the entries
  //       this._setLocalStorage();
  //       this._getLocalStorage();

  //       //remove the marker
  //       this.#map.removeLayer(this.entry);

  //       //refresh the map to remove the deleted marker
  //       this.#map.setView(this.entry.coords, this.#mapZoomLevel);
  //     }
  //   }
  // }

  _setLocalStorage() {
    localStorage.setItem("entries", JSON.stringify(this.#entries));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("entries"));

    if (!data) return;

    this.#entries = data;

    this.#entries.forEach((entr) => {
      this._renderEntry(entr);
    });
  }

  reset() {
    localStorage.removeItem("entries");
    location.reload();
  }
}

const app = new App();

//General site

const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const btnCloseModal = document.querySelector(".btn--close-modal");
const btnsOpenModal = document.querySelectorAll(".btn--show-modal");
const btnScrollTo = document.querySelector(".btn--scroll-to");
const section1 = document.querySelector("#section--1");

///////////////////////////////////////
// Modal window

const openModal = function (e) {
  e.preventDefault();
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

btnsOpenModal.forEach((btn) => btn.addEventListener("click", openModal));

btnCloseModal.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

//smooth scroll

btnScrollTo.addEventListener("click", function (e) {
  const s1coords = section1.getBoundingClientRect();

  ////OLD way
  //   //calculate current position + current scroll
  //   //make this an object, add behavior: "smooth"
  // window.scrollTo({
  //  left: s1coords.left + window.scrollX,
  //  top: s1coords.top + window.scrollY,
  //  behavior: "smooth",
  // });

  ////MODERN way
  section1.scrollIntoView({ behavior: "smooth" });
});

//Page navigation
//cleaner solution is to listen on to a parent element, we'll know where the event originated by looking at event.target property -> that's called "event delegation"
//event delegation is done in 2 steps: 1) add eventlistener to common parent element of all the elements we're interested in; 2) deterine what element originated the event

document.querySelector(".nav__links").addEventListener("click", function (e) {
  e.preventDefault();
  //Matching strategy to ignore clicks inbetween links
  if (e.target.classList.contains("nav__link")) {
    const id = e.target.getAttribute("href");
    document.querySelector(id).scrollIntoView({ behavior: "smooth" });
  }
});

//Tab component
const tabs = document.querySelectorAll(".operations__tab");
const tabsContainer = document.querySelector(".operations__tab-container");
const tabsContent = document.querySelectorAll(".operations__content");

tabsContainer.addEventListener("click", function (e) {
  const clicked = e.target.closest(".operations__tab");

  //Guard clause (here - so that any other parent element without "operations__tab" is not involved)
  if (!clicked) return;

  //removing active classes
  tabs.forEach((t) => t.classList.remove("operations__tab--active"));
  tabsContent.forEach((c) => c.classList.remove("operations__content--active"));

  //activating tab
  clicked.classList.add("operations__tab--active");

  //activating content area
  document
    .querySelector(`.operations__content--${clicked.dataset.tab}`)
    .classList.add("operations__content--active");
});

//Menu fade animation. Refactored: separate function, then called manually with 2 parameters - event and opacity)
//re-refactored: removing ugly anonymous callback functions, and instead using bind() method 1)to create a copy of a function, 2)set a this keyword in this function call to whatever value that we pass into bind. Usually this = e.currentTarget, but here we set it manually! Anyways, a handler function can only receive ONE real argument.

const handleHover = function (e) {
  if (e.target.classList.contains("nav__link")) {
    const link = e.target;
    const siblings = link.closest(".nav").querySelectorAll(".nav__link");
    const logo = link.closest(".nav").querySelector("img");
    siblings.forEach((el) => {
      if (el !== link) el.style.opacity = this;
    });
    logo.style.opacity = this;
  }
};

const nav = document.querySelector(".nav");

//passing an "argument" into handler function
nav.addEventListener("mouseover", handleHover.bind(0.5));
nav.addEventListener("mouseout", handleHover.bind(1));

//Sticky navigation (old way)
// const initialCoords = section1.getBoundingClientRect();
// window.addEventListener("scroll", function (e) {
//   if (window.scrollY > initialCoords.top) nav.classList.add("sticky");
//   else nav.classList.remove("sticky");
// });

//Sticky navigation with the Intersection Observer API
const header = document.querySelector(".header");
const navHeight = nav.getBoundingClientRect().height;

const stickyNav = function (entries) {
  const [entry] = entries;
  if (!entry.isIntersecting) nav.classList.add("sticky");
  else nav.classList.remove("sticky");
};

const headerObserver = new IntersectionObserver(stickyNav, {
  root: null,
  threshold: 0,
  rootMargin: `-${navHeight}px`,
});
headerObserver.observe(header);

//reveiling sections on scroll with IntersectionObserver

const allSections = document.querySelectorAll(".section");
const revealSection = function (entries, observer) {
  const [entry] = entries;
  //Guard clause
  if (!entry.isIntersecting) return;

  entry.target.classList.remove("section--hidden");
  observer.unobserve(entry.target);
};

const sectionObserver = new IntersectionObserver(revealSection, {
  root: null,
  threshold: 0.15,
});

allSections.forEach(function (section) {
  sectionObserver.observe(section);
  section.classList.add("section--hidden");
});

//Lazy loading images
const imgTargets = document.querySelectorAll("img[data-src]");

const loadImg = function (entries, observer) {
  const [entry] = entries;
  if (!entry.isIntersecting) return;

  //replace src with data-src
  entry.target.src = entry.target.dataset.src;
  entry.target.addEventListener("load", function () {
    entry.target.classList.remove("lazy-img");
  });

  observer.unobserve(entry.target);
};

const imgObserver = new IntersectionObserver(loadImg, {
  root: null,
  threshold: 0,
  rootMargin: "200px",
});

imgTargets.forEach((img) => imgObserver.observe(img));

///////////////////////////////////////
// Slider
const slider = function () {
  const slides = document.querySelectorAll(".slide");
  const btnLeft = document.querySelector(".slider__btn--left");
  const btnRight = document.querySelector(".slider__btn--right");

  let curSlide = 0;
  const maxSlide = slides.length;

  // Functions

  //aligning slides one by one horizontally
  const goToSlide = function (slide) {
    slides.forEach(
      (s, i) => (s.style.transform = `translateX(${100 * (i - slide)}%)`)
    );
  };

  // Go to Next slide
  const nextSlide = function () {
    if (curSlide === maxSlide - 1) {
      curSlide = 0;
    } else {
      curSlide++;
    }

    goToSlide(curSlide);
    activateDot(curSlide);
  };
  btnRight.addEventListener("click", nextSlide);

  // Go to Previous slide
  const prevSlide = function () {
    if (curSlide === 0) {
      curSlide = maxSlide - 1;
    } else {
      curSlide--;
    }
    goToSlide(curSlide);
    activateDot(curSlide);
  };
  btnLeft.addEventListener("click", prevSlide);

  //Keyboard swipes
  document.addEventListener("keydown", function (e) {
    (e.key === "ArrowRight" && nextSlide()) ||
      (e.key === "ArrowLeft" && prevSlide());
  });

  //Dots implementation
  const dotContainer = document.querySelector(".dots");

  const createDots = function () {
    slides.forEach(function (_, i) {
      dotContainer.insertAdjacentHTML(
        "beforeend",
        `<button class="dots__dot" data-slide="${i}"></button>`
      );
    });
  };

  const activateDot = function (slide) {
    document
      .querySelectorAll(".dots__dot")
      .forEach((dot) => dot.classList.remove("dots__dot--active"));

    document
      .querySelector(`.dots__dot[data-slide="${slide}"]`)
      .classList.add("dots__dot--active");
  };

  //actions for the beginning
  const init = function () {
    goToSlide(0);
    createDots();
    activateDot(0);
  };
  init();

  // Connecting the dots with the slides
  dotContainer.addEventListener("click", function (e) {
    if (e.target.classList.contains("dots__dot")) {
      const { slide } = e.target.dataset;
      goToSlide(slide);
      activateDot(slide);
    }
  });
};
slider();
