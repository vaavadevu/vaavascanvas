
const paintings = [
   {
    image: "images/herrOchFruAndersson.JPG",
    title: "Herr och Fru Andersson",
    description: "Gräsänder i sjön",
    size: "60 x 90 cm",
    originalPrice: 3000,
    status: "SÅLD",
  },
  {
    image: "images/womanInTheSea.jpg",
    title: "Woman of the Sea",
    description: "En självpoträtt inspirerad av hopp.",
    size: "60 x 90 cm",
    originalPrice: 2000,
    status: "TILL SALU",
  },
  {
    image: "images/vattenfall.jpg",
    title: "Vattenfall",
    description: "Där vattnet möter klippan och tiden står stilla.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "SÅLD",
  },
  
 {
    image: "images/solnedgang.JPG",
    title: "Havet",
    description: "Solnedgång i havet",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "TILL SALU",
  },

  {
    image: "images/sommarstuga.jpg",
    title: "Sommarstuga",
    description: "En somrig dag i Småland.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

   {
    image: "images/sommarPaStranden.jpg",
    title: "Beach day",
    description: "Semester på strand.",
    size: "42 x 59 cm",
    originalPrice: 1800,
    status: "TILL SALU",
  },

   {
    image: "images/sjalvportratt.jpg",
    title: "Embrace",
    description: "Självpoträtt som visar förändring och ett nytt liv.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
  

   {
    image: "images/mystiskJul.jpg",
    title: "Det är fortfarande tänt",
    description: "Mystisk jultomten.",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

   {
    image: "images/nackrosor.jpg",
    title: "Ska vi plocka blommor",
    description: "Stilla sjö med blommor",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "SÅLD",
  },
   
   {
    image: "images/savannan.jpg",
    title: "Dags att gå hem",
    description: "Savanna temad berättelse",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
   {
    image: "images/varkansla.JPG",
    title: "Vårkänsla",
    description: "Körsbärsblommor och en trött blåmes som vilar",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "SÅLD",
  },
   {
    image: "images/norrsken.jpg",
    title: "Norrsken",
    description: "Norrsken bakom bergerna.",
    size: "41 x 33 cm",
    originalPrice: 1000,
    status: "TILL SALU",
  },
     
   {
    image: "images/vargen.jpg",
    title: "Två sidor av samma mynt",
    description: "Målning som visar balans och styrka",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },
   
   {
    image: "images/radjur.jpg",
    title: "Savannan",
    description: "Antiloper som betar i savanna",
    size: "42 x 59 cm",
    originalPrice: 1500,
    status: "TILL SALU",
  },

  {
    image: "images/skogsvila.jpg",
    title: "Skogsvila",
    description: "Rävarna som myser innuti en trädöppning",
    size: "90 cm",
    originalPrice: 3000,
    status: "TILL SALU",
  },

   {
    image: "images/brollopspresent.jpg",
    title: "Bröllop",
    description: "Brollopsdag present till Herr och Fru Elfqvist.",
    size: "42 x 59 cm",
    status: "Personlig present",
  },
  
  {
    image: "images/bonnie.jpg",
    title: "Sovven och Bonnie",
    description: "Illustration som var en present till bebisen i bilden på hennes ett års födelsedag",
    size: "42 x 59 cm", 
    status: "Personlig present",
  },

  {
    image: "images/shiroOchOtis.jpg",
    title: "Vinterlek",
    description: "Hundarna Shiro och Otis som leker med varandra i snön",
    size: "42 x 59 cm",
    status: "Personlig present",
  },
];

const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
let modalImg, modalTitle, modalSize, modalDesc, modalButtons, modalClose, modalNext, modalPrev;
if (modal) {
  modalImg = document.getElementById("modal-img");
  modalTitle = document.getElementById("modal-title");
  modalSize = document.getElementById("modal-size");
  modalDesc = document.getElementById("modal-desc");
  modalButtons = document.getElementById("modal-buttons");
  modalClose = document.getElementById("modal-close");
  modalNext = document.getElementById("modal-next");
  modalPrev = document.getElementById("modal-prev");
}

let currentIndex = 0;

// Skapa gallery (används på pictures.html)
if (gallery) {
  paintings.forEach((painting, index) => {
    const item = document.createElement("div");
    item.classList.add("gallery-item");

    const img = document.createElement("img");
    img.src = painting.image;
    img.alt = painting.title;
    img.addEventListener("error", () => {
      console.error("Image failed to load:", painting.image);
      img.src = "images/devika.jpg"; // fallback
    });
    img.addEventListener("load", () => {
      console.log("Loaded image:", painting.image);
    });

    img.addEventListener("click", () => openModal(index));

    item.appendChild(img);

    if (painting.status === "SÅLD") {
      const badge = document.createElement("div");
      badge.textContent = "Såld";
      badge.classList.add("sold-badge");
      item.appendChild(badge);
    }

    gallery.appendChild(item);
  });
}

// Skapa mini-galleri på startsidan (första fyra målningarna)
const homeGrid = document.getElementById("homeGalleryGrid");
if (homeGrid) {
  paintings.slice(0, 3).forEach((painting, index) => {
    const item = document.createElement("div");
    item.classList.add("gallery-item");

    const img = document.createElement("img");
    img.src = painting.image;
    img.alt = painting.title;
    img.addEventListener("error", () => {
      console.error("Home image failed to load:", painting.image);
      img.src = "images/devika.jpg"; // fallback
    });
    img.addEventListener("load", () => {
      console.log("Loaded home image:", painting.image);
    });

    img.addEventListener("click", () => openModal(index));

    item.appendChild(img);

    if (painting.status === "SÅLD") {
      const badge = document.createElement("div");
      badge.textContent = "Såld";
      badge.classList.add("sold-badge");
      item.appendChild(badge);
    }

    homeGrid.appendChild(item);
  });
}

// Öppna modal
let currentImageIndex = 0;

function openModal(index) {
  if (!modal) return;
  currentIndex = index;
  currentImageIndex = 0;
  const painting = paintings[index];

  const imgs = painting.images || [painting.image];

  // Visa huvudbild
  modalImg.src = imgs[0];
  modalImg.alt = painting.title;
  modalTitle.textContent = painting.title;
  modalSize.textContent = painting.size;
  modalDesc.textContent = painting.description;

  // Bygg thumbnails
  const thumbsContainer = document.getElementById("modal-thumbs");
  thumbsContainer.innerHTML = "";
  if (imgs.length > 1) {
    imgs.forEach((src, i) => {
      const thumb = document.createElement("img");
      thumb.src = src;
      thumb.alt = `Bild ${i + 1}`;
      thumb.classList.add("modalThumb");
      if (i === 0) thumb.classList.add("active");
      thumb.addEventListener("click", () => switchModalImage(imgs, i));
      thumbsContainer.appendChild(thumb);
    });
  }

  // Bild-pilar
  const imgPrev = document.getElementById("modal-img-prev");
  const imgNext = document.getElementById("modal-img-next");
  if (imgs.length > 1) {
    imgPrev.style.display = "flex";
    imgNext.style.display = "flex";
    imgPrev.onclick = () => switchModalImage(imgs, (currentImageIndex - 1 + imgs.length) % imgs.length);
    imgNext.onclick = () => switchModalImage(imgs, (currentImageIndex + 1) % imgs.length);
  } else {
    imgPrev.style.display = "none";
    imgNext.style.display = "none";
  }

  // Knappar
  modalButtons.innerHTML = "";
  if (painting.status === "SÅLD") {
    const soldText = document.createElement("p");
    soldText.textContent = "Såld";
    soldText.style.color = "red";
    modalButtons.appendChild(soldText);
  } else if (painting.status === "Personlig present") {
    const personalText = document.createElement("p");
    personalText.textContent = "Personlig målning – ej till salu";
    personalText.style.opacity = "0.8";
    modalButtons.appendChild(personalText);
  } else if (painting.originalPrice) {
    const pris = document.createElement("p");
    pris.textContent = `${painting.originalPrice} kr`;
    pris.style.fontSize = "22px";
    pris.style.fontWeight = "bold";
    pris.style.margin = "10px 0";
    modalButtons.appendChild(pris);

    const btnKop = document.createElement("button");
btnKop.textContent = "✉ Skicka köpförfrågan";
btnKop.addEventListener("click", () => {
  // Fyll i formuläret
  document.getElementById("f-typ").value = "Köpa original";
  visaFooterPrintFalt();
  document.getElementById("f-verk").value = painting.title;
  document.getElementById("f-meddelande").value =
    `Hej! Jag är intresserad av originalmålningen "${painting.title}" (${painting.size}) för ${painting.originalPrice} kr.`;

  // Stäng modal och scrolla till footer
  closeModal();
  document.getElementById("footer").scrollIntoView({ behavior: "smooth" });
});
modalButtons.appendChild(btnKop);
  }

  modal.style.display = "flex";
}

function switchModalImage(imgs, i) {
  currentImageIndex = i;
  modalImg.src = imgs[i];
  document.querySelectorAll(".modalThumb").forEach((t, idx) => {
    t.classList.toggle("active", idx === i);
  });
}

// Stäng modal
function closeModal() {
  if (!modal) return;
  modal.style.display = "none";
}

// Next / Prev
function nextPainting() {
  currentIndex = (currentIndex + 1) % paintings.length;
  openModal(currentIndex);
}
function prevPainting() {
  currentIndex = (currentIndex - 1 + paintings.length) % paintings.length;
  openModal(currentIndex);
}
modalNext.addEventListener("click", nextPainting);
modalPrev.addEventListener("click", prevPainting);

// ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") nextPainting();
  if (e.key === "ArrowLeft") prevPainting();
});

// Klicka utanför bilden stänger modal
if (modal) {
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalNext) modalNext.addEventListener("click", nextPainting);
  if (modalPrev) modalPrev.addEventListener("click", prevPainting);
  // Klicka utanför bilden stänger modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

 window.addEventListener('scroll', () => {
  const footer = document.getElementById('footer');
  const footerTop = footer.getBoundingClientRect().top;
  const footerInView = footerTop <= window.innerHeight;
  var currentQuery = "#footer";

  if (!footerInView) {
    const currentUrl = window.location.href;
    if (currentUrl.includes('pictures.html')) {
      currentQuery = "pictures.html#main";
    } else {
      currentQuery = "index.html#top";
    }
  }
    activateQuery(currentQuery); 
});
}

function activateQuery(queryName) {
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  const query = document.querySelector(`a[href="${queryName}"]`);
  query.classList.add('active');
}
